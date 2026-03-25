package com.osl.pay.portal.benchmark;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.model.dto.ApplicationSaveDraftRequest;
import com.osl.pay.portal.model.dto.LoginRequest;
import com.osl.pay.portal.model.dto.RegisterRequest;
import com.osl.pay.portal.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.LongStream;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * 压测：模拟 100 TPS 并发读取入驻申请详情。
 *
 * 测试对比两个 endpoint：
 * 1. GET /api/v1/application/current  — SELECT * (全量 JSON 反序列化)
 * 2. GET /api/v1/merchant/progress    — SELECT status (只查状态)
 *
 * 运行方式: mvn test -pl backend -Dtest="ApplicationReadBenchmark" -DfailIfNoTests=false
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("压测 — 入驻申请读取性能")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ApplicationReadBenchmark {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private MerchantUserMapper merchantUserMapper;
    @Autowired private MerchantMapper merchantMapper;
    @Autowired private MerchantApplicationMapper merchantApplicationMapper;
    @Autowired private ApplicationDocumentMapper applicationDocumentMapper;
    @Autowired private OrderMapper orderMapper;
    @Autowired private KybApplicationMapper kybApplicationMapper;
    @Autowired private OnboardingApplicationMapper onboardingMapper;
    @Autowired private ApiCredentialMapper apiCredentialMapper;
    @Autowired private AuditLogMapper auditLogMapper;
    @Autowired private ApiRequestLogMapper apiRequestLogMapper;
    @Autowired private WebhookLogMapper webhookLogMapper;
    @Autowired private DomainWhitelistMapper domainWhitelistMapper;
    @Autowired private WebhookConfigMapper webhookConfigMapper;
    @Autowired private StringRedisTemplate redis;

    private static final int MERCHANT_COUNT = 20;       // 预创建 20 个商户
    private static final int TOTAL_REQUESTS = 2000;      // 总请求数
    private static final int CONCURRENCY = 200;          // 并发数

    private static final List<String> tokens = new CopyOnWriteArrayList<>();

    @BeforeAll
    static void info() {
        System.out.println("\n" + "=".repeat(70));
        System.out.println("  压测参数: " + MERCHANT_COUNT + " 商户, " + TOTAL_REQUESTS + " 请求, " + CONCURRENCY + " 并发");
        System.out.println("=".repeat(70));
    }

    @Test
    @Order(0)
    @DisplayName("准备阶段 — 创建商户并填写完整申请")
    void setup() throws Exception {
        // Clean
        auditLogMapper.delete(null);
        apiRequestLogMapper.delete(null);
        webhookLogMapper.delete(null);
        domainWhitelistMapper.delete(null);
        applicationDocumentMapper.delete(null);
        merchantApplicationMapper.delete(null);
        kybApplicationMapper.delete(null);
        onboardingMapper.delete(null);
        webhookConfigMapper.delete(null);
        apiCredentialMapper.delete(null);
        orderMapper.delete(null);
        merchantUserMapper.delete(null);
        merchantMapper.delete(null);
        Set<String> keys = redis.keys("auth:*");
        if (keys != null && !keys.isEmpty()) redis.delete(keys);
        Set<String> rateKeys = redis.keys("rate:*");
        if (rateKeys != null && !rateKeys.isEmpty()) redis.delete(rateKeys);

        tokens.clear();

        for (int i = 0; i < MERCHANT_COUNT; i++) {
            // Clear rate limit keys before each registration to avoid hitting limits
            Set<String> rlKeys = redis.keys("rate:*");
            if (rlKeys != null && !rlKeys.isEmpty()) redis.delete(rlKeys);

            String email = "bench" + i + "@test.com";
            String company = "Bench Corp " + i;

            // Register
            RegisterRequest reg = new RegisterRequest();
            reg.setEmail(email);
            reg.setPassword("Test1234");
            reg.setConfirmPassword("Test1234");
            reg.setCompanyName(company);
            reg.setContactName("测试" + i);
            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(reg)));

            // Verify email
            Set<String> verifyKeys = redis.keys("auth:verify:*");
            if (verifyKeys != null) {
                for (String key : verifyKeys) {
                    mockMvc.perform(get("/api/v1/auth/verify-email")
                            .param("token", key.replace("auth:verify:", "")));
                }
            }

            // Login
            LoginRequest login = new LoginRequest();
            login.setEmail(email);
            login.setPassword("Test1234");
            MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(login)))
                    .andReturn();
            String token = objectMapper.readTree(result.getResponse().getContentAsString())
                    .path("data").path("accessToken").asText();
            tokens.add(token);

            // Save full draft (all 3 steps, realistic JSON data)
            ApplicationSaveDraftRequest draft = fullDraft(i);
            mockMvc.perform(post("/api/v1/application/save-draft")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(draft)));
        }

        System.out.println("✓ 已创建 " + MERCHANT_COUNT + " 个商户，每个都有完整的入驻申请草稿");
    }

    @Test
    @Order(1)
    @DisplayName("压测 — GET /api/v1/application/current (SELECT *, 全量 JSON)")
    void benchmark_fullApplication() throws Exception {
        BenchResult result = runBenchmark("/api/v1/application/current");
        printResult("application/current (全量)", result);
    }

    @Test
    @Order(2)
    @DisplayName("压测 — GET /api/v1/merchant/progress (SELECT status, 轻量)")
    void benchmark_progress() throws Exception {
        BenchResult result = runBenchmark("/api/v1/merchant/progress");
        printResult("merchant/progress (轻量)", result);
    }

    // ───────────────── Benchmark engine ─────────────────

    private BenchResult runBenchmark(String path) throws Exception {
        // Clear rate limits before benchmark
        Set<String> rlKeys = redis.keys("rate:*");
        if (rlKeys != null && !rlKeys.isEmpty()) redis.delete(rlKeys);

        // Warmup
        for (int i = 0; i < Math.min(10, tokens.size()); i++) {
            mockMvc.perform(get(path)
                    .header("Authorization", "Bearer " + tokens.get(i)));
        }

        // Clear rate limits after warmup
        rlKeys = redis.keys("rate:*");
        if (rlKeys != null && !rlKeys.isEmpty()) redis.delete(rlKeys);

        ExecutorService executor = Executors.newFixedThreadPool(CONCURRENCY);
        CountDownLatch latch = new CountDownLatch(TOTAL_REQUESTS);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);
        ConcurrentHashMap<Integer, AtomicInteger> statusCodes = new ConcurrentHashMap<>();
        long[] latencies = new long[TOTAL_REQUESTS];

        long startTime = System.nanoTime();

        for (int i = 0; i < TOTAL_REQUESTS; i++) {
            final int idx = i;
            final String token = tokens.get(i % tokens.size());
            executor.submit(() -> {
                try {
                    long t0 = System.nanoTime();
                    MvcResult r = mockMvc.perform(get(path)
                            .header("Authorization", "Bearer " + token))
                            .andReturn();
                    long elapsed = System.nanoTime() - t0;
                    latencies[idx] = elapsed;

                    int status = r.getResponse().getStatus();
                    statusCodes.computeIfAbsent(status, k -> new AtomicInteger()).incrementAndGet();
                    if (status == 200) {
                        successCount.incrementAndGet();
                    } else {
                        errorCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    errorCount.incrementAndGet();
                    latencies[idx] = -1;
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(60, TimeUnit.SECONDS);
        long wallTime = System.nanoTime() - startTime;
        executor.shutdownNow();

        // Calculate percentiles
        long[] validLatencies = LongStream.of(latencies).filter(l -> l > 0).sorted().toArray();

        return new BenchResult(
                TOTAL_REQUESTS,
                successCount.get(),
                errorCount.get(),
                wallTime,
                validLatencies,
                statusCodes
        );
    }

    private void printResult(String label, BenchResult r) {
        System.out.println("\n" + "─".repeat(60));
        System.out.printf("  %s%n", label);
        System.out.println("─".repeat(60));
        System.out.printf("  总请求: %d | 成功: %d | 失败: %d%n", r.total, r.success, r.errors);
        if (r.errors > 0) {
            System.out.print("  状态码分布: ");
            r.statusCodes.forEach((code, count) -> System.out.printf("%d×%d  ", code, count.get()));
            System.out.println();
        }
        System.out.printf("  总耗时: %.2f s%n", r.wallTimeNanos / 1e9);
        System.out.printf("  实际 TPS: %.1f req/s%n", r.success / (r.wallTimeNanos / 1e9));
        System.out.println();
        if (r.latencies.length > 0) {
            System.out.printf("  平均延迟:   %6.1f ms%n", avg(r.latencies) / 1e6);
            System.out.printf("  P50 延迟:   %6.1f ms%n", percentile(r.latencies, 50) / 1e6);
            System.out.printf("  P90 延迟:   %6.1f ms%n", percentile(r.latencies, 90) / 1e6);
            System.out.printf("  P95 延迟:   %6.1f ms%n", percentile(r.latencies, 95) / 1e6);
            System.out.printf("  P99 延迟:   %6.1f ms%n", percentile(r.latencies, 99) / 1e6);
            System.out.printf("  最大延迟:   %6.1f ms%n", r.latencies[r.latencies.length - 1] / 1e6);
        }
        System.out.println("─".repeat(60));
    }

    private double avg(long[] arr) {
        return LongStream.of(arr).average().orElse(0);
    }

    private long percentile(long[] sorted, int pct) {
        int idx = (int) Math.ceil(pct / 100.0 * sorted.length) - 1;
        return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
    }

    record BenchResult(int total, int success, int errors, long wallTimeNanos, long[] latencies,
                        Map<Integer, AtomicInteger> statusCodes) {}

    // ───────────────── Test data builder ─────────────────

    private ApplicationSaveDraftRequest fullDraft(int idx) {
        ApplicationSaveDraftRequest req = new ApplicationSaveDraftRequest();
        req.setCurrentStep(3);
        req.setCounterpartyType("CASP");
        req.setCompanyName("Bench Corp " + idx);
        req.setCompanyNameEn("Bench Corp Limited " + idx);
        req.setRegCountry("HK");
        req.setRegNumber("REG" + String.format("%08d", idx));
        req.setTaxIdNumber("TAX-" + idx);
        req.setCompanyType("LIMITED");
        req.setIncorporationDate("2020-01-15");
        req.setAddressLine1(idx + " Benchmark Street, Suite " + (idx * 100));
        req.setAddressLine2("Floor " + (idx % 50 + 1));
        req.setCity("Hong Kong");
        req.setStateProvince("HK");
        req.setPostalCode("999077");
        req.setCountry("HK");
        req.setContactName("联系人" + idx);
        req.setContactTitle("CEO");
        req.setContactEmail("contact" + idx + "@bench.com");
        req.setContactPhone("+852-" + String.format("%08d", 10000000 + idx));

        // Legal rep
        req.setLegalRep(Map.of(
                "name", "法人代表" + idx,
                "nationality", "CN",
                "idType", "PASSPORT",
                "idNumber", "E" + String.format("%08d", idx),
                "placeOfBirth", "Beijing, China",
                "dateOfBirth", "1985-06-15"
        ));

        // 4 UBOs (realistic)
        List<Map<String, Object>> ubos = new ArrayList<>();
        for (int u = 0; u < 4; u++) {
            ubos.add(Map.of(
                    "name", "UBO_" + idx + "_" + u,
                    "nationality", u % 2 == 0 ? "CN" : "HK",
                    "idType", "ID_CARD",
                    "idNumber", "ID" + String.format("%08d", idx * 10 + u),
                    "placeOfBirth", u % 2 == 0 ? "Beijing, China" : "Hong Kong",
                    "dateOfBirth", "198" + u + "-03-20",
                    "residentialAddress", u + " UBO Street, City " + idx,
                    "sharePercentage", 25
            ));
        }
        req.setUbos(ubos);

        // 3 Directors
        List<Map<String, Object>> directors = new ArrayList<>();
        for (int d = 0; d < 3; d++) {
            directors.add(Map.of(
                    "name", "Director_" + idx + "_" + d,
                    "nationality", "HK",
                    "idType", "PASSPORT",
                    "idNumber", "D" + String.format("%08d", idx * 10 + d),
                    "placeOfBirth", "Hong Kong",
                    "dateOfBirth", "197" + d + "-11-05"
            ));
        }
        req.setDirectors(directors);

        // 2 Authorized persons
        List<Map<String, Object>> authPersons = new ArrayList<>();
        for (int a = 0; a < 2; a++) {
            authPersons.add(Map.ofEntries(
                    Map.entry("name", "AuthPerson_" + idx + "_" + a),
                    Map.entry("nationality", "SG"),
                    Map.entry("idType", "PASSPORT"),
                    Map.entry("idNumber", "A" + String.format("%08d", idx * 10 + a)),
                    Map.entry("placeOfBirth", "Singapore"),
                    Map.entry("dateOfBirth", "199" + a + "-07-12"),
                    Map.entry("phone", "+65-" + String.format("%08d", 80000000 + idx * 10 + a)),
                    Map.entry("email", "auth" + a + "_" + idx + "@bench.com")
            ));
        }
        req.setAuthorizedPersons(authPersons);

        // Business info
        req.setBusinessType("E_COMMERCE");
        req.setWebsite("https://bench" + idx + ".com");
        req.setPurposeOfAccount("Crypto payment processing for global e-commerce platform number " + idx);
        req.setSourceOfIncome("E-commerce sales revenue and subscription services");
        req.setEstAmountPerTxFrom("100");
        req.setEstAmountPerTxTo("50000");
        req.setEstTxPerYear("10000");
        req.setMonthlyVolume("1M_10M");
        req.setMonthlyTxCount("10K_100K");
        req.setSupportedFiat("USD,EUR,HKD,GBP,SGD");
        req.setSupportedCrypto("USDT,USDC,BTC,ETH");
        req.setUseCases("ONLINE_PAYMENT,CROSS_BORDER,SUBSCRIPTION");
        req.setBusinessDesc("大型跨境电商平台，服务于全球 " + (idx + 1) * 1000 + " 个商户，年交易额超过 " + (idx + 1) * 100 + " 万美元。主要业务包括在线零售、跨境汇款和加密货币兑换。");

        // Licence info (CASP type)
        req.setLicenceInfo(Map.of(
                "regulated", true,
                "jurisdiction", "Hong Kong",
                "regulatorName", "Securities and Futures Commission",
                "licenceType", "Type 1 - Dealing in Securities",
                "licenceNumber", "LIC-" + String.format("%06d", idx),
                "licenceDate", "2022-06-01",
                "lastAuditDate", "2025-01-15"
        ));

        return req;
    }
}
