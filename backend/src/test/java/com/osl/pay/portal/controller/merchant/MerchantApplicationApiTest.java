package com.osl.pay.portal.controller.merchant;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.model.dto.ApplicationSaveDraftRequest;
import com.osl.pay.portal.model.dto.ApplicationSubmitRequest;
import com.osl.pay.portal.model.dto.LoginRequest;
import com.osl.pay.portal.model.dto.RegisterRequest;
import com.osl.pay.portal.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("统一入驻申请接口")
class MerchantApplicationApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private MerchantUserMapper merchantUserMapper;
    @Autowired private MerchantMapper merchantMapper;
    @Autowired private OrderMapper orderMapper;
    @Autowired private ApiCredentialMapper apiCredentialMapper;
    @Autowired private OnboardingApplicationMapper onboardingMapper;
    @Autowired private KybApplicationMapper kybApplicationMapper;
    @Autowired private MerchantApplicationMapper merchantApplicationMapper;
    @Autowired private ApplicationDocumentMapper applicationDocumentMapper;
    @Autowired private AuditLogMapper auditLogMapper;
    @Autowired private ApiRequestLogMapper apiRequestLogMapper;
    @Autowired private WebhookLogMapper webhookLogMapper;
    @Autowired private DomainWhitelistMapper domainWhitelistMapper;
    @Autowired private WebhookConfigMapper webhookConfigMapper;
    @Autowired private StringRedisTemplate redis;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
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

        token = registerAndLogin();
    }

    private String registerAndLogin() throws Exception {
        RegisterRequest reg = new RegisterRequest();
        reg.setEmail("app@test.com");
        reg.setPassword("Test1234");
        reg.setConfirmPassword("Test1234");
        reg.setCompanyName("App Test Corp");
        reg.setContactName("测试");
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)));
        Set<String> verifyKeys = redis.keys("auth:verify:*");
        for (String key : verifyKeys) {
            mockMvc.perform(get("/api/v1/auth/verify-email")
                    .param("token", key.replace("auth:verify:", "")));
        }
        LoginRequest login = new LoginRequest();
        login.setEmail("app@test.com");
        login.setPassword("Test1234");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    // --- Helper methods ---

    private ApplicationSaveDraftRequest step1Draft() {
        ApplicationSaveDraftRequest req = new ApplicationSaveDraftRequest();
        req.setCurrentStep(1);
        req.setCounterpartyType("CASP");
        req.setCompanyName("Test Corp Ltd");
        req.setCompanyNameEn("Test Corp Limited");
        req.setRegCountry("HK");
        req.setRegNumber("12345678");
        req.setTaxIdNumber("HK-TAX-001");
        req.setCompanyType("LIMITED");
        req.setIncorporationDate("2020-01-15");
        req.setAddressLine1("123 Test Street");
        req.setCity("Hong Kong");
        req.setPostalCode("999077");
        req.setCountry("HK");
        req.setContactName("张三");
        req.setContactTitle("CEO");
        req.setContactEmail("contact@test.com");
        req.setContactPhone("+852-12345678");
        return req;
    }

    private ApplicationSaveDraftRequest step2Draft() {
        ApplicationSaveDraftRequest req = step1Draft();
        req.setCurrentStep(2);
        req.setLegalRep(Map.of(
                "name", "张三",
                "nationality", "CN",
                "idTypeNumber", "ID Card: 110101199001011234",
                "placeOfBirth", "Beijing, China",
                "dateOfBirth", "1990-01-01"
        ));
        req.setUbos(List.of(Map.of(
                "name", "张三",
                "nationality", "CN",
                "idTypeNumber", "ID Card: 110101199001011234",
                "placeOfBirth", "Beijing, China",
                "dateOfBirth", "1990-01-01",
                "residentialAddress", "123 Beijing Road, Beijing",
                "sharePercentage", 60,
                "isLegalRep", true
        ), Map.of(
                "name", "李四",
                "nationality", "CN",
                "idTypeNumber", "Passport: E12345678",
                "placeOfBirth", "Shanghai, China",
                "dateOfBirth", "1985-06-15",
                "residentialAddress", "456 Shanghai Road, Shanghai",
                "sharePercentage", 40,
                "isLegalRep", false
        )));
        req.setDirectors(List.of(Map.of(
                "name", "张三",
                "idTypeNumber", "ID Card: 110101199001011234",
                "placeOfBirth", "Beijing, China",
                "dateOfBirth", "1990-01-01",
                "nationality", "CN"
        )));
        req.setAuthorizedPersons(List.of(Map.of(
                "name", "王五",
                "idTypeNumber", "Passport: G87654321",
                "placeOfBirth", "Hong Kong",
                "dateOfBirth", "1988-03-20",
                "nationality", "HK",
                "phone", "+852-98765432",
                "email", "wang@test.com"
        )));
        return req;
    }

    private ApplicationSaveDraftRequest step3Draft() {
        ApplicationSaveDraftRequest req = step2Draft();
        req.setCurrentStep(3);
        req.setBusinessType("E_COMMERCE");
        req.setWebsite("https://test.com");
        req.setPurposeOfAccount("Crypto payment processing for e-commerce");
        req.setSourceOfIncome("E-commerce sales revenue");
        req.setEstAmountPerTxFrom("100");
        req.setEstAmountPerTxTo("10000");
        req.setEstTxPerYear("5000");
        req.setMonthlyVolume("100K_1M");
        req.setMonthlyTxCount("1K_10K");
        req.setSupportedFiat("USD,EUR,HKD");
        req.setSupportedCrypto("USDT,USDC,BTC");
        req.setUseCases("ONLINE_PAYMENT,CROSS_BORDER");
        req.setBusinessDesc("在线电商平台，为全球客户提供加密货币支付能力");
        return req;
    }

    private ApplicationSubmitRequest submitDeclarations() {
        ApplicationSubmitRequest req = new ApplicationSubmitRequest();
        req.setInfoAccuracyConfirmed(true);
        req.setSanctionsDeclared(true);
        req.setTermsAccepted(true);
        return req;
    }

    /** Save a full 3-step draft so it's ready for submit */
    private void saveFullDraft() throws Exception {
        mockMvc.perform(post("/api/v1/application/save-draft")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(step3Draft())));
    }

    // --- Tests ---

    @Nested
    @DisplayName("查询当前申请")
    class GetCurrent {

        @Test
        @DisplayName("新商户无申请 → 返回 null data")
        void should_returnNull_when_noApplication() throws Exception {
            mockMvc.perform(get("/api/v1/application/current")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isEmpty());
        }

        @Test
        @DisplayName("保存草稿后查询 → 返回已保存的草稿数据")
        void should_returnDraft_when_saved() throws Exception {
            // Save step 1
            mockMvc.perform(post("/api/v1/application/save-draft")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(step1Draft())));

            // Query
            MvcResult result = mockMvc.perform(get("/api/v1/application/current")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("DRAFT"))
                    .andExpect(jsonPath("$.data.companyName").value("Test Corp Ltd"))
                    .andExpect(jsonPath("$.data.regCountry").value("HK"))
                    .andReturn();

            JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
            assertThat(data.path("currentStep").asInt()).isEqualTo(1);
        }

        @Test
        @DisplayName("未认证访问 → HTTP 403")
        void should_return403_when_noAuth() throws Exception {
            mockMvc.perform(get("/api/v1/application/current"))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("保存草稿 - Step 1 公司信息")
    class SaveDraftStep1 {

        @Test
        @DisplayName("保存 Step 1 部分字段 → 创建草稿，返回 DRAFT")
        void should_createDraft_when_step1() throws Exception {
            mockMvc.perform(post("/api/v1/application/save-draft")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(step1Draft())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("DRAFT"))
                    .andExpect(jsonPath("$.data.currentStep").value(1))
                    .andExpect(jsonPath("$.data.companyName").value("Test Corp Ltd"))
                    .andExpect(jsonPath("$.data.companyNameEn").value("Test Corp Limited"))
                    .andExpect(jsonPath("$.data.regCountry").value("HK"));

            assertThat(merchantApplicationMapper.selectCount(null)).isEqualTo(1);
        }

        @Test
        @DisplayName("再次保存 → 更新同一条记录")
        void should_updateSameRecord_when_saveTwice() throws Exception {
            // Save first time
            mockMvc.perform(post("/api/v1/application/save-draft")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(step1Draft())));

            // Save again with updated data
            ApplicationSaveDraftRequest updated = step1Draft();
            updated.setCompanyName("Updated Corp Ltd");
            mockMvc.perform(post("/api/v1/application/save-draft")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updated)))
                    .andExpect(jsonPath("$.data.companyName").value("Updated Corp Ltd"));

            assertThat(merchantApplicationMapper.selectCount(null)).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("保存草稿 - Step 2 法人与 UBO")
    class SaveDraftStep2 {

        @Test
        @DisplayName("保存法人 + UBO 信息 → 返回 JSON 结构正确")
        void should_saveLegalRepAndUbos() throws Exception {
            MvcResult result = mockMvc.perform(post("/api/v1/application/save-draft")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(step2Draft())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.currentStep").value(2))
                    .andExpect(jsonPath("$.data.legalRep.name").value("张三"))
                    .andExpect(jsonPath("$.data.ubos").isArray())
                    .andReturn();

            JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
            assertThat(data.path("ubos").size()).isEqualTo(2);
            assertThat(data.path("ubos").get(0).path("sharePercentage").asInt()).isEqualTo(60);
            assertThat(data.path("ubos").get(1).path("name").asText()).isEqualTo("李四");
        }

        @Test
        @DisplayName("UBO 持股比例总和 > 100% → HTTP 400")
        void should_return400_when_uboShareExceeds100() throws Exception {
            ApplicationSaveDraftRequest req = step1Draft();
            req.setCurrentStep(2);
            req.setUbos(List.of(
                    Map.of("name", "A", "sharePercentage", 60),
                    Map.of("name", "B", "sharePercentage", 50)
            ));

            mockMvc.perform(post("/api/v1/application/save-draft")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("UBO 持股比例总和不能超过 100%"));
        }

        @Test
        @DisplayName("UBO 超过 10 人 → HTTP 400")
        void should_return400_when_tooManyUbos() throws Exception {
            ApplicationSaveDraftRequest req = step1Draft();
            req.setCurrentStep(2);
            List<Map<String, Object>> ubos = new java.util.ArrayList<>();
            for (int i = 0; i < 11; i++) {
                ubos.add(Map.of("name", "UBO" + i, "sharePercentage", 5));
            }
            req.setUbos(ubos);

            mockMvc.perform(post("/api/v1/application/save-draft")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("UBO 数量不能超过 10 人"));
        }
    }

    @Nested
    @DisplayName("保存草稿 - Step 3 业务信息")
    class SaveDraftStep3 {

        @Test
        @DisplayName("保存完整三步草稿 → currentStep=3，所有字段返回")
        void should_saveBusinessInfo() throws Exception {
            mockMvc.perform(post("/api/v1/application/save-draft")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(step3Draft())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.currentStep").value(3))
                    .andExpect(jsonPath("$.data.businessType").value("E_COMMERCE"))
                    .andExpect(jsonPath("$.data.monthlyVolume").value("100K_1M"))
                    .andExpect(jsonPath("$.data.supportedFiat").value("USD,EUR,HKD"))
                    .andExpect(jsonPath("$.data.useCases").value("ONLINE_PAYMENT,CROSS_BORDER"));
        }
    }

    @Nested
    @DisplayName("状态保护")
    class StatusProtection {

        @Test
        @DisplayName("已 SUBMITTED 的申请保存草稿 → HTTP 400")
        void should_return400_when_submitted() throws Exception {
            // Create and manually set to SUBMITTED
            mockMvc.perform(post("/api/v1/application/save-draft")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(step1Draft())));

            var app = merchantApplicationMapper.selectList(null).get(0);
            app.setStatus("SUBMITTED");
            merchantApplicationMapper.updateById(app);

            // Try to save draft → blocked
            mockMvc.perform(post("/api/v1/application/save-draft")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(step1Draft())))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("申请已提交，不能修改"));
        }

        @Test
        @DisplayName("已 APPROVED 的申请保存草稿 → HTTP 400")
        void should_return400_when_approved() throws Exception {
            mockMvc.perform(post("/api/v1/application/save-draft")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(step1Draft())));

            var app = merchantApplicationMapper.selectList(null).get(0);
            app.setStatus("APPROVED");
            merchantApplicationMapper.updateById(app);

            mockMvc.perform(post("/api/v1/application/save-draft")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(step1Draft())))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("安全测试")
    class Security {

        @Test
        @DisplayName("未认证访问保存草稿 → HTTP 403")
        void should_return403_when_noAuth() throws Exception {
            mockMvc.perform(post("/api/v1/application/save-draft")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(step1Draft())))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("租户隔离 → 不同商户看不到彼此的申请")
        void should_isolateTenants() throws Exception {
            // User A saves draft
            mockMvc.perform(post("/api/v1/application/save-draft")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(step1Draft())));

            // Register User B
            RegisterRequest reg = new RegisterRequest();
            reg.setEmail("other@test.com");
            reg.setPassword("Test1234");
            reg.setConfirmPassword("Test1234");
            reg.setCompanyName("Other Corp");
            reg.setContactName("其他");
            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(reg)));
            Set<String> verifyKeys = redis.keys("auth:verify:*");
            for (String key : verifyKeys) {
                mockMvc.perform(get("/api/v1/auth/verify-email")
                        .param("token", key.replace("auth:verify:", "")));
            }
            LoginRequest login = new LoginRequest();
            login.setEmail("other@test.com");
            login.setPassword("Test1234");
            MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(login)))
                    .andReturn();
            String tokenB = objectMapper.readTree(result.getResponse().getContentAsString())
                    .path("data").path("accessToken").asText();

            // User B sees no application
            mockMvc.perform(get("/api/v1/application/current")
                            .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isEmpty());
        }
    }

    @Nested
    @DisplayName("提交申请")
    class Submit {

        @Test
        @DisplayName("完整数据提交 → 状态变为 SUBMITTED，等待审核")
        void should_setSubmitted() throws Exception {
            saveFullDraft();

            mockMvc.perform(post("/api/v1/application/submit")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(submitDeclarations())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("SUBMITTED"))
                    .andExpect(jsonPath("$.data.infoAccuracyConfirmed").value(true))
                    .andExpect(jsonPath("$.data.submittedAt").isNotEmpty());
        }

        @Test
        @DisplayName("缺少 Step 1 必填字段 → HTTP 400")
        void should_return400_when_missingStep1Fields() throws Exception {
            // Save only partial Step 1 (missing contactTitle, incorporationDate, etc.)
            ApplicationSaveDraftRequest partial = new ApplicationSaveDraftRequest();
            partial.setCurrentStep(3);
            partial.setCompanyName("Test Corp");
            // Missing many required fields
            mockMvc.perform(post("/api/v1/application/save-draft")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(partial)));

            mockMvc.perform(post("/api/v1/application/submit")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(submitDeclarations())))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("缺少 Directors → HTTP 400 '请至少添加一位董事'")
        void should_return400_when_missingDirectors() throws Exception {
            // Save full data but without directors/authorized persons
            ApplicationSaveDraftRequest req = step1Draft();
            req.setCurrentStep(3);
            req.setBusinessType("E_COMMERCE");
            req.setPurposeOfAccount("Payment processing");
            req.setSourceOfIncome("Sales");
            req.setBusinessDesc("Test business");
            req.setUbos(List.of(Map.of("name", "A", "sharePercentage", 100)));
            // No directors, no authorized persons
            mockMvc.perform(post("/api/v1/application/save-draft")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)));

            mockMvc.perform(post("/api/v1/application/submit")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(submitDeclarations())))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("请至少添加一位董事"));
        }

        @Test
        @DisplayName("合规声明未勾选 → HTTP 400")
        void should_return400_when_declarationsNotConfirmed() throws Exception {
            saveFullDraft();

            ApplicationSubmitRequest req = new ApplicationSubmitRequest();
            req.setInfoAccuracyConfirmed(false);
            req.setSanctionsDeclared(true);
            req.setTermsAccepted(true);

            mockMvc.perform(post("/api/v1/application/submit")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("请确认信息真实、完整、准确"));
        }

        @Test
        @DisplayName("已 SUBMITTED 状态再次提交 → HTTP 400")
        void should_return400_when_alreadySubmitted() throws Exception {
            saveFullDraft();

            // Submit in production
            mockMvc.perform(post("/api/v1/application/submit")
                    .header("Authorization", "Bearer " + token)
                    .header("X-Environment", "production")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(submitDeclarations())));

            // Try again
            mockMvc.perform(post("/api/v1/application/submit")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(submitDeclarations())))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("只有草稿状态的申请才能提交"));
        }

        @Test
        @DisplayName("无草稿直接提交 → HTTP 400")
        void should_return400_when_noDraft() throws Exception {
            mockMvc.perform(post("/api/v1/application/submit")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(submitDeclarations())))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("请先填写申请信息"));
        }
    }

    @Nested
    @DisplayName("重新提交")
    class Resubmit {

        @Test
        @DisplayName("REJECTED 状态重提交 → SUBMITTED")
        void should_resubmit_when_rejected() throws Exception {
            saveFullDraft();

            // Submit in production → set to REJECTED manually
            mockMvc.perform(post("/api/v1/application/submit")
                    .header("Authorization", "Bearer " + token)
                    .header("X-Environment", "production")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(submitDeclarations())));

            var app = merchantApplicationMapper.selectList(null).get(0);
            app.setStatus("REJECTED");
            app.setRejectReason("信息不完整");
            merchantApplicationMapper.updateById(app);

            // Resubmit
            mockMvc.perform(post("/api/v1/application/resubmit")
                            .header("Authorization", "Bearer " + token)
                            .header("X-Environment", "production")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(submitDeclarations())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("SUBMITTED"))
                    .andExpect(jsonPath("$.data.rejectReason").isEmpty());
        }

        @Test
        @DisplayName("NEED_MORE_INFO 状态重提交 → SUBMITTED")
        void should_resubmit_when_needMoreInfo() throws Exception {
            saveFullDraft();

            mockMvc.perform(post("/api/v1/application/submit")
                    .header("Authorization", "Bearer " + token)
                    .header("X-Environment", "production")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(submitDeclarations())));

            var app = merchantApplicationMapper.selectList(null).get(0);
            app.setStatus("NEED_MORE_INFO");
            merchantApplicationMapper.updateById(app);

            mockMvc.perform(post("/api/v1/application/resubmit")
                            .header("Authorization", "Bearer " + token)
                            .header("X-Environment", "production")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(submitDeclarations())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("SUBMITTED"));
        }

        @Test
        @DisplayName("DRAFT 状态重提交 → HTTP 400")
        void should_return400_when_draftResubmit() throws Exception {
            saveFullDraft();

            mockMvc.perform(post("/api/v1/application/resubmit")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(submitDeclarations())))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("只有被拒绝或需补充信息的申请才能重新提交"));
        }

        @Test
        @DisplayName("APPROVED 状态重提交 → HTTP 400")
        void should_return400_when_approvedResubmit() throws Exception {
            saveFullDraft();

            mockMvc.perform(post("/api/v1/application/submit")
                    .header("Authorization", "Bearer " + token)
                    .header("X-Environment", "production")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(submitDeclarations())));

            var app = merchantApplicationMapper.selectList(null).get(0);
            app.setStatus("APPROVED");
            merchantApplicationMapper.updateById(app);

            mockMvc.perform(post("/api/v1/application/resubmit")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(submitDeclarations())))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("文件上传与删除")
    class Documents {

        @Test
        @DisplayName("上传文件 → 200，返回文件信息")
        void should_uploadDocument() throws Exception {
            saveFullDraft();

            MockMultipartFile file = new MockMultipartFile(
                    "file", "license.pdf", "application/pdf",
                    "fake-pdf-content".getBytes());

            mockMvc.perform(multipart("/api/v1/application/documents")
                            .file(file)
                            .param("docType", "BUSINESS_LICENSE")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.docType").value("BUSINESS_LICENSE"))
                    .andExpect(jsonPath("$.data.docName").value("license.pdf"))
                    .andExpect(jsonPath("$.data.status").value("UPLOADED"));
        }

        @Test
        @DisplayName("删除已上传文件 → 200")
        void should_deleteDocument() throws Exception {
            saveFullDraft();

            MockMultipartFile file = new MockMultipartFile(
                    "file", "license.pdf", "application/pdf",
                    "fake-pdf-content".getBytes());

            MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/application/documents")
                            .file(file)
                            .param("docType", "BUSINESS_LICENSE")
                            .header("Authorization", "Bearer " + token))
                    .andReturn();

            Long docId = objectMapper.readTree(uploadResult.getResponse().getContentAsString())
                    .path("data").path("id").asLong();

            mockMvc.perform(delete("/api/v1/application/documents/" + docId)
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk());

            assertThat(applicationDocumentMapper.selectById(docId)).isNull();
        }

        @Test
        @DisplayName("查询已上传文件列表 → 返回文件列表")
        void should_listDocuments() throws Exception {
            saveFullDraft();

            // Upload 2 files
            mockMvc.perform(multipart("/api/v1/application/documents")
                    .file(new MockMultipartFile("file", "a.pdf", "application/pdf", "a".getBytes()))
                    .param("docType", "BUSINESS_LICENSE")
                    .header("Authorization", "Bearer " + token));

            mockMvc.perform(multipart("/api/v1/application/documents")
                    .file(new MockMultipartFile("file", "b.png", "image/png", "b".getBytes()))
                    .param("docType", "ARTICLES")
                    .header("Authorization", "Bearer " + token));

            MvcResult result = mockMvc.perform(get("/api/v1/application/documents")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isArray())
                    .andReturn();

            JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
            assertThat(data.size()).isEqualTo(2);
        }

        @Test
        @DisplayName("无效文件类型 → HTTP 400")
        void should_return400_when_invalidDocType() throws Exception {
            saveFullDraft();

            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.pdf", "application/pdf", "test".getBytes());

            mockMvc.perform(multipart("/api/v1/application/documents")
                            .file(file)
                            .param("docType", "INVALID_TYPE")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("不支持的文件格式 → HTTP 400")
        void should_return400_when_unsupportedMimeType() throws Exception {
            saveFullDraft();

            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.exe", "application/octet-stream", "test".getBytes());

            mockMvc.perform(multipart("/api/v1/application/documents")
                            .file(file)
                            .param("docType", "BUSINESS_LICENSE")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("只支持 PDF、JPG、PNG 格式"));
        }
    }
}
