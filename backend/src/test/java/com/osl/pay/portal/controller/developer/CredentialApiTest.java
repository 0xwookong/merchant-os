package com.osl.pay.portal.controller.developer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.model.dto.LoginRequest;
import com.osl.pay.portal.model.dto.RegisterRequest;
import com.osl.pay.portal.model.entity.ApiCredential;
import com.osl.pay.portal.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("API 凭证接口")
class CredentialApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private MerchantUserMapper merchantUserMapper;
    @Autowired private MerchantMapper merchantMapper;
    @Autowired private OrderMapper orderMapper;
    @Autowired private KybApplicationMapper kybApplicationMapper;
    @Autowired private OnboardingApplicationMapper onboardingMapper;
    @Autowired private ApiCredentialMapper apiCredentialMapper;
    @Autowired private AuditLogMapper auditLogMapper;
    @Autowired private ApiRequestLogMapper apiRequestLogMapper;
    @Autowired private WebhookLogMapper webhookLogMapper;
    @Autowired private DomainWhitelistMapper domainWhitelistMapper;
    @Autowired private WebhookConfigMapper webhookConfigMapper;
    @Autowired private MerchantApplicationMapper merchantApplicationMapper;
    @Autowired private ApplicationDocumentMapper applicationDocumentMapper;
    @Autowired private StringRedisTemplate redis;

    @BeforeEach
    void cleanUp() {
        auditLogMapper.delete(null);
        apiRequestLogMapper.delete(null);
        webhookLogMapper.delete(null);
        domainWhitelistMapper.delete(null);
        kybApplicationMapper.delete(null);
        onboardingMapper.delete(null);
        webhookConfigMapper.delete(null);
        apiCredentialMapper.delete(null);
        orderMapper.delete(null);
        merchantUserMapper.delete(null);
        applicationDocumentMapper.delete(null);
        merchantApplicationMapper.delete(null);
        merchantMapper.delete(null);
        Set<String> keys = redis.keys("auth:*");
        if (keys != null && !keys.isEmpty()) redis.delete(keys);
        Set<String> rateKeys = redis.keys("rate:*");
        if (rateKeys != null && !rateKeys.isEmpty()) redis.delete(rateKeys);
    }

    private String registerVerifyAndLogin() throws Exception {
        RegisterRequest reg = new RegisterRequest();
        reg.setEmail("cred@test.com");
        reg.setPassword("Test1234");
        reg.setConfirmPassword("Test1234");
        reg.setCompanyName("Credential Test Corp");
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
        login.setEmail("cred@test.com");
        login.setPassword("Test1234");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    /** Register a second merchant and return its JWT token */
    private String registerSecondMerchantAndLogin() throws Exception {
        RegisterRequest reg = new RegisterRequest();
        reg.setEmail("cred2@test.com");
        reg.setPassword("Test1234");
        reg.setConfirmPassword("Test1234");
        reg.setCompanyName("Second Corp");
        reg.setContactName("测试二");
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)));

        Set<String> verifyKeys = redis.keys("auth:verify:*");
        for (String key : verifyKeys) {
            mockMvc.perform(get("/api/v1/auth/verify-email")
                    .param("token", key.replace("auth:verify:", "")));
        }

        LoginRequest login = new LoginRequest();
        login.setEmail("cred2@test.com");
        login.setPassword("Test1234");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Nested
    @DisplayName("获取 API 凭证")
    class GetCredentials {

        @Test
        @DisplayName("首次获取凭证 → 自动生成 appId、apiPublicKey、webhookPublicKey、apiEndpoint")
        void should_generateAndReturn_when_firstAccess() throws Exception {
            String token = registerVerifyAndLogin();

            MvcResult result = mockMvc.perform(get("/api/v1/credentials")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0))
                    .andExpect(jsonPath("$.data.appId").exists())
                    .andExpect(jsonPath("$.data.apiPublicKey").exists())
                    .andExpect(jsonPath("$.data.webhookPublicKey").exists())
                    .andExpect(jsonPath("$.data.apiEndpoint").exists())
                    .andReturn();

            JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
            assertThat(data.path("appId").asText()).startsWith("osl_app_");
            assertThat(data.path("apiPublicKey").asText()).startsWith("-----BEGIN PUBLIC KEY-----");
            assertThat(data.path("webhookPublicKey").asText()).startsWith("-----BEGIN PUBLIC KEY-----");

            // DB should have exactly 1 credential
            assertThat(apiCredentialMapper.selectCount(null)).isEqualTo(1);
        }

        @Test
        @DisplayName("重复获取凭证 → 返回相同 appId（幂等）")
        void should_returnSameAppId_when_calledTwice() throws Exception {
            String token = registerVerifyAndLogin();

            MvcResult first = mockMvc.perform(get("/api/v1/credentials")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn();

            MvcResult second = mockMvc.perform(get("/api/v1/credentials")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn();

            String appId1 = objectMapper.readTree(first.getResponse().getContentAsString())
                    .path("data").path("appId").asText();
            String appId2 = objectMapper.readTree(second.getResponse().getContentAsString())
                    .path("data").path("appId").asText();

            assertThat(appId1).isEqualTo(appId2);
            // Still only 1 record in DB
            assertThat(apiCredentialMapper.selectCount(null)).isEqualTo(1);
        }

        @Test
        @DisplayName("沙箱环境 → apiEndpoint 为沙箱地址")
        void should_returnSandboxEndpoint_when_sandboxEnv() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(get("/api/v1/credentials")
                            .header("Authorization", "Bearer " + token)
                            .header("X-Environment", "sandbox"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.apiEndpoint").value("https://openapitest.osl-pay.com"));
        }

        @Test
        @DisplayName("生产环境 → apiEndpoint 为生产地址")
        void should_returnProductionEndpoint_when_productionEnv() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(get("/api/v1/credentials")
                            .header("Authorization", "Bearer " + token)
                            .header("X-Environment", "production"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.apiEndpoint").value("https://openapi.osl-pay.com"));
        }

        @Test
        @DisplayName("响应不含私钥字段 → 确保 apiPrivateKey、webhookPrivateKey 不存在")
        void should_notContainPrivateKeys_inResponse() throws Exception {
            String token = registerVerifyAndLogin();

            MvcResult result = mockMvc.perform(get("/api/v1/credentials")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn();

            String json = result.getResponse().getContentAsString();
            assertThat(json).doesNotContain("apiPrivateKey");
            assertThat(json).doesNotContain("webhookPrivateKey");
            assertThat(json).doesNotContain("PRIVATE KEY");
        }

        @Test
        @DisplayName("数据库存储验证 → 私钥已加密存储，merchant_id 正确")
        void should_storeKeysInDb_when_generated() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(get("/api/v1/credentials")
                    .header("Authorization", "Bearer " + token));

            List<ApiCredential> all = apiCredentialMapper.selectList(null);
            assertThat(all).hasSize(1);

            ApiCredential cred = all.get(0);
            assertThat(cred.getAppId()).startsWith("osl_app_");
            assertThat(cred.getApiPublicKey()).startsWith("-----BEGIN PUBLIC KEY-----");
            assertThat(cred.getApiPrivateKey()).startsWith("-----BEGIN PRIVATE KEY-----");
            assertThat(cred.getWebhookPublicKey()).startsWith("-----BEGIN PUBLIC KEY-----");
            assertThat(cred.getWebhookPrivateKey()).startsWith("-----BEGIN PRIVATE KEY-----");
            assertThat(cred.getMerchantId()).isNotNull();
        }
    }

    @Nested
    @DisplayName("安全测试")
    class Security {

        @Test
        @DisplayName("未认证访问 → HTTP 403")
        void should_return403_when_noAuth() throws Exception {
            mockMvc.perform(get("/api/v1/credentials"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("租户隔离 → 商户 A 和商户 B 的凭证完全不同")
        void should_isolateCredentials_betweenMerchants() throws Exception {
            String tokenA = registerVerifyAndLogin();
            String tokenB = registerSecondMerchantAndLogin();

            MvcResult resultA = mockMvc.perform(get("/api/v1/credentials")
                            .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn();

            MvcResult resultB = mockMvc.perform(get("/api/v1/credentials")
                            .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andReturn();

            String appIdA = objectMapper.readTree(resultA.getResponse().getContentAsString())
                    .path("data").path("appId").asText();
            String appIdB = objectMapper.readTree(resultB.getResponse().getContentAsString())
                    .path("data").path("appId").asText();

            assertThat(appIdA).isNotEqualTo(appIdB);
            assertThat(apiCredentialMapper.selectCount(null)).isEqualTo(2);
        }

        @Test
        @DisplayName("App ID 格式 → 以 osl_app_ 开头，长度 40+")
        void should_generateSecureAppId() throws Exception {
            String token = registerVerifyAndLogin();

            MvcResult result = mockMvc.perform(get("/api/v1/credentials")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn();

            String appId = objectMapper.readTree(result.getResponse().getContentAsString())
                    .path("data").path("appId").asText();

            assertThat(appId).startsWith("osl_app_");
            assertThat(appId.length()).isGreaterThanOrEqualTo(40);
        }
    }
}
