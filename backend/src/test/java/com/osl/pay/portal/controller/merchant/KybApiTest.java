package com.osl.pay.portal.controller.merchant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.model.dto.KybSubmitRequest;
import com.osl.pay.portal.model.dto.LoginRequest;
import com.osl.pay.portal.model.dto.RegisterRequest;
import com.osl.pay.portal.repository.ApiCredentialMapper;
import com.osl.pay.portal.repository.ApiRequestLogMapper;
import com.osl.pay.portal.repository.AuditLogMapper;
import com.osl.pay.portal.repository.DomainWhitelistMapper;
import com.osl.pay.portal.repository.KybApplicationMapper;
import com.osl.pay.portal.repository.MerchantMapper;
import com.osl.pay.portal.repository.OnboardingApplicationMapper;
import com.osl.pay.portal.repository.OrderMapper;
import com.osl.pay.portal.repository.MerchantUserMapper;
import com.osl.pay.portal.repository.WebhookConfigMapper;
import com.osl.pay.portal.repository.WebhookLogMapper;
import com.osl.pay.portal.repository.MerchantApplicationMapper;
import com.osl.pay.portal.repository.ApplicationDocumentMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("KYB 认证接口")
class KybApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private MerchantUserMapper merchantUserMapper;
    @Autowired private MerchantMapper merchantMapper;
    @Autowired private OrderMapper orderMapper;
    @Autowired private ApiCredentialMapper apiCredentialMapper;
    @Autowired private KybApplicationMapper kybApplicationMapper;
    @Autowired private AuditLogMapper auditLogMapper;
    @Autowired private ApiRequestLogMapper apiRequestLogMapper;
    @Autowired private WebhookLogMapper webhookLogMapper;
    @Autowired private DomainWhitelistMapper domainWhitelistMapper;
    @Autowired private OnboardingApplicationMapper onboardingMapper;
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
        reg.setEmail("kyb@test.com");
        reg.setPassword("Test1234");
        reg.setConfirmPassword("Test1234");
        reg.setCompanyName("KYB Test Corp");
        reg.setContactName("测试");
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)));

        Set<String> keys = redis.keys("auth:verify:*");
        for (String key : keys) {
            mockMvc.perform(get("/api/v1/auth/verify-email")
                    .param("token", key.replace("auth:verify:", "")));
        }

        LoginRequest login = new LoginRequest();
        login.setEmail("kyb@test.com");
        login.setPassword("Test1234");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    private KybSubmitRequest validKybRequest() {
        KybSubmitRequest req = new KybSubmitRequest();
        req.setCompanyRegCountry("Hong Kong");
        req.setCompanyRegNumber("CR-12345678");
        req.setBusinessLicenseNo("BL-2024-001");
        req.setCompanyType("LIMITED");
        req.setLegalRepName("张三");
        req.setLegalRepNationality("中国");
        req.setLegalRepIdType("ID_CARD");
        req.setLegalRepIdNumber("110101199001011234");
        req.setLegalRepSharePct(new BigDecimal("80.00"));
        return req;
    }

    @Nested
    @DisplayName("查询 KYB 状态")
    class GetStatus {

        @Test
        @DisplayName("新注册商户查询状态 → HTTP 200，kybStatus=NOT_STARTED")
        void should_returnNotStarted_when_newMerchant() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(get("/api/v1/kyb/status")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.kybStatus").value("NOT_STARTED"))
                    .andExpect(jsonPath("$.data.rejectReason").isEmpty());
        }

        @Test
        @DisplayName("未认证访问 → HTTP 403")
        void should_return403_when_noAuth() throws Exception {
            mockMvc.perform(get("/api/v1/kyb/status"))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("提交 KYB 认证")
    class Submit {

        @Test
        @DisplayName("沙箱环境提交 → HTTP 200，merchant.kybStatus 直接变为 APPROVED（自动审批）")
        void should_autoApprove_when_sandbox() throws Exception {
            String token = registerVerifyAndLogin();

            // Default environment (no X-Environment header) = sandbox
            mockMvc.perform(post("/api/v1/kyb/submit")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validKybRequest())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0));

            mockMvc.perform(get("/api/v1/kyb/status")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(jsonPath("$.data.kybStatus").value("APPROVED"))
                    .andExpect(jsonPath("$.data.companyRegCountry").value("Hong Kong"));

            org.assertj.core.api.Assertions.assertThat(kybApplicationMapper.selectCount(null)).isEqualTo(1);
        }

        @Test
        @DisplayName("生产环境提交 → HTTP 200，merchant.kybStatus 变为 PENDING（等待人工审核）")
        void should_setPending_when_production() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(post("/api/v1/kyb/submit")
                            .header("Authorization", "Bearer " + token)
                            .header("X-Environment", "production")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validKybRequest())))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/api/v1/kyb/status")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(jsonPath("$.data.kybStatus").value("PENDING"));
        }

        @Test
        @DisplayName("生产环境状态为 PENDING 时再次提交 → HTTP 400 '已提交审核，请等待'")
        void should_return400_when_alreadyPending() throws Exception {
            String token = registerVerifyAndLogin();

            // 第一次提交（生产环境 → PENDING）
            mockMvc.perform(post("/api/v1/kyb/submit")
                    .header("Authorization", "Bearer " + token)
                    .header("X-Environment", "production")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(validKybRequest())));

            // 第二次提交
            mockMvc.perform(post("/api/v1/kyb/submit")
                            .header("Authorization", "Bearer " + token)
                            .header("X-Environment", "production")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validKybRequest())))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("已提交审核，请等待"));
        }

        @Test
        @DisplayName("沙箱自动审批后再次提交 → HTTP 400 '已通过认证'")
        void should_return400_when_alreadyApproved() throws Exception {
            String token = registerVerifyAndLogin();

            // 沙箱提交 → 自动 APPROVED
            mockMvc.perform(post("/api/v1/kyb/submit")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(validKybRequest())));

            // 再次提交
            mockMvc.perform(post("/api/v1/kyb/submit")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validKybRequest())))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("已通过认证"));
        }

        @Test
        @DisplayName("未认证提交 → HTTP 403")
        void should_return403_when_noAuth() throws Exception {
            mockMvc.perform(post("/api/v1/kyb/submit")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validKybRequest())))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("缺失必填字段 → HTTP 400")
        void should_return400_when_missingFields() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(post("/api/v1/kyb/submit")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new KybSubmitRequest())))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40000));
        }
    }
}
