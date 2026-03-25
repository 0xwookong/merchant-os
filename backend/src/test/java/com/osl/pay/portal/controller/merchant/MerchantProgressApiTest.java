package com.osl.pay.portal.controller.merchant;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.model.dto.LoginRequest;
import com.osl.pay.portal.model.dto.RegisterRequest;
import com.osl.pay.portal.model.entity.DomainWhitelist;
import com.osl.pay.portal.model.entity.WebhookConfig;
import com.osl.pay.portal.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("商户进度接口")
class MerchantProgressApiTest {

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
        merchantMapper.delete(null);
        Set<String> keys = redis.keys("auth:*");
        if (keys != null && !keys.isEmpty()) redis.delete(keys);
        Set<String> rateKeys = redis.keys("rate:*");
        if (rateKeys != null && !rateKeys.isEmpty()) redis.delete(rateKeys);
    }

    private String registerVerifyAndLogin() throws Exception {
        RegisterRequest reg = new RegisterRequest();
        reg.setEmail("progress@test.com");
        reg.setPassword("Test1234");
        reg.setConfirmPassword("Test1234");
        reg.setCompanyName("Progress Test Corp");
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
        login.setEmail("progress@test.com");
        login.setPassword("Test1234");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    private Long getMerchantId() {
        return merchantMapper.selectList(null).get(0).getId();
    }

    @Nested
    @DisplayName("获取商户进度")
    class GetProgress {

        @Test
        @DisplayName("新注册商户 → 账户已创建、KYB 未开始、无入驻申请、无技术集成")
        void should_returnInitialProgress_when_newMerchant() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(get("/api/v1/merchant/progress")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0))
                    .andExpect(jsonPath("$.data.accountCreated").value(true))
                    .andExpect(jsonPath("$.data.kybStatus").value("NOT_STARTED"))
                    .andExpect(jsonPath("$.data.onboardingStatus").isEmpty())
                    .andExpect(jsonPath("$.data.hasCredentials").value(false))
                    .andExpect(jsonPath("$.data.hasWebhooks").value(false))
                    .andExpect(jsonPath("$.data.hasDomains").value(false));
        }

        @Test
        @DisplayName("提交 KYB 后 → kybStatus 变为 APPROVED（沙箱自动审批）")
        void should_reflectKybStatus_when_kybSubmitted() throws Exception {
            String token = registerVerifyAndLogin();

            // Submit KYB (sandbox auto-approves)
            mockMvc.perform(post("/api/v1/kyb/submit")
                    .header("Authorization", "Bearer " + token)
                    .header("X-Environment", "sandbox")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"companyRegCountry\":\"HK\",\"companyRegNumber\":\"12345678\",\"businessLicenseNo\":\"BL-001\",\"companyType\":\"LLC\",\"legalRepName\":\"Test\",\"legalRepNationality\":\"CN\",\"legalRepIdType\":\"PASSPORT\",\"legalRepIdNumber\":\"E12345678\",\"legalRepSharePct\":80}"));

            mockMvc.perform(get("/api/v1/merchant/progress")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.kybStatus").value("APPROVED"));
        }

        @Test
        @DisplayName("有 Webhook 和域名 → hasWebhooks 和 hasDomains 为 true")
        void should_reflectTechIntegration_when_webhooksAndDomainsExist() throws Exception {
            String token = registerVerifyAndLogin();
            Long merchantId = getMerchantId();

            // Directly insert webhook and domain records
            WebhookConfig webhook = new WebhookConfig();
            webhook.setMerchantId(merchantId);
            webhook.setUrl("https://example.com/webhook");
            webhook.setSecret("test-secret");
            webhook.setEvents("[\"ORDER_COMPLETED\"]");
            webhook.setStatus("ACTIVE");
            webhookConfigMapper.insert(webhook);

            DomainWhitelist domain = new DomainWhitelist();
            domain.setMerchantId(merchantId);
            domain.setDomain("example.com");
            domainWhitelistMapper.insert(domain);

            mockMvc.perform(get("/api/v1/merchant/progress")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.hasWebhooks").value(true))
                    .andExpect(jsonPath("$.data.hasDomains").value(true));
        }

        @Test
        @DisplayName("获取凭证后 → hasCredentials 为 true")
        void should_reflectCredentials_when_credentialsGenerated() throws Exception {
            String token = registerVerifyAndLogin();

            // Trigger credential generation
            mockMvc.perform(get("/api/v1/credentials")
                    .header("Authorization", "Bearer " + token));

            mockMvc.perform(get("/api/v1/merchant/progress")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.hasCredentials").value(true));
        }
    }

    @Nested
    @DisplayName("安全测试")
    class Security {

        @Test
        @DisplayName("未认证访问 → HTTP 403")
        void should_return403_when_noAuth() throws Exception {
            mockMvc.perform(get("/api/v1/merchant/progress"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("租户隔离 → 商户 A 看不到商户 B 的数据")
        void should_isolateProgress_betweenMerchants() throws Exception {
            // Register merchant A with credentials
            String tokenA = registerVerifyAndLogin();
            mockMvc.perform(get("/api/v1/credentials")
                    .header("Authorization", "Bearer " + tokenA));

            // Register merchant B (new merchant, no credentials)
            RegisterRequest reg = new RegisterRequest();
            reg.setEmail("progress2@test.com");
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

            LoginRequest loginB = new LoginRequest();
            loginB.setEmail("progress2@test.com");
            loginB.setPassword("Test1234");
            MvcResult resultB = mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginB)))
                    .andReturn();
            String tokenB = objectMapper.readTree(resultB.getResponse().getContentAsString())
                    .path("data").path("accessToken").asText();

            // Merchant A has credentials, merchant B doesn't
            mockMvc.perform(get("/api/v1/merchant/progress")
                            .header("Authorization", "Bearer " + tokenA))
                    .andExpect(jsonPath("$.data.hasCredentials").value(true));

            mockMvc.perform(get("/api/v1/merchant/progress")
                            .header("Authorization", "Bearer " + tokenB))
                    .andExpect(jsonPath("$.data.hasCredentials").value(false));
        }
    }
}
