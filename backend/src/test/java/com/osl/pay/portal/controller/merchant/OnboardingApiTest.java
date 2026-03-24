package com.osl.pay.portal.controller.merchant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.model.dto.LoginRequest;
import com.osl.pay.portal.model.dto.OnboardingSaveDraftRequest;
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

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("入驻申请接口")
class OnboardingApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private MerchantUserMapper merchantUserMapper;
    @Autowired private MerchantMapper merchantMapper;
    @Autowired private OnboardingApplicationMapper onboardingMapper;
    @Autowired private AuditLogMapper auditLogMapper;
    @Autowired private StringRedisTemplate redis;

    @BeforeEach
    void cleanUp() {
        auditLogMapper.delete(null);
        onboardingMapper.delete(null);
        merchantUserMapper.delete(null);
        merchantMapper.delete(null);
        Set<String> keys = redis.keys("auth:*");
        if (keys != null && !keys.isEmpty()) redis.delete(keys);
        Set<String> rateKeys = redis.keys("rate:*");
        if (rateKeys != null && !rateKeys.isEmpty()) redis.delete(rateKeys);
    }

    private String registerVerifyAndLogin() throws Exception {
        RegisterRequest reg = new RegisterRequest();
        reg.setEmail("onboard@test.com");
        reg.setPassword("Test1234");
        reg.setConfirmPassword("Test1234");
        reg.setCompanyName("Onboard Corp");
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
        login.setEmail("onboard@test.com");
        login.setPassword("Test1234");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    private OnboardingSaveDraftRequest draftStep1() {
        OnboardingSaveDraftRequest req = new OnboardingSaveDraftRequest();
        req.setCurrentStep(1);
        req.setCompanyName("Test Corp Ltd");
        req.setCompanyAddress("123 Test St");
        req.setContactName("张三");
        req.setContactPhone("+86-13800138000");
        req.setContactEmail("contact@test.com");
        return req;
    }

    private OnboardingSaveDraftRequest fullDraft() {
        OnboardingSaveDraftRequest req = draftStep1();
        req.setCurrentStep(2);
        req.setBusinessType("E_COMMERCE");
        req.setMonthlyVolume("100K_500K");
        req.setSupportedFiat("USD,EUR");
        req.setSupportedCrypto("BTC,ETH,USDT");
        req.setBusinessDesc("在线电商平台，需要加密货币支付能力");
        return req;
    }

    @Nested
    @DisplayName("查询当前申请")
    class GetCurrent {

        @Test
        @DisplayName("新商户无申请 → 返回 null data")
        void should_returnNull_when_noApplication() throws Exception {
            String token = registerVerifyAndLogin();
            mockMvc.perform(get("/api/v1/onboarding/current")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isEmpty());
        }

        @Test
        @DisplayName("未认证 → HTTP 403")
        void should_return403_when_noAuth() throws Exception {
            mockMvc.perform(get("/api/v1/onboarding/current"))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("保存草稿")
    class SaveDraft {

        @Test
        @DisplayName("保存步骤1草稿 → 返回 DRAFT 状态 + 已填字段")
        void should_saveDraft_when_step1() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(post("/api/v1/onboarding/save-draft")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(draftStep1())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("DRAFT"))
                    .andExpect(jsonPath("$.data.currentStep").value(1))
                    .andExpect(jsonPath("$.data.companyName").value("Test Corp Ltd"));

            assertThat(onboardingMapper.selectCount(null)).isEqualTo(1);
        }

        @Test
        @DisplayName("再次保存草稿 → 更新同一条记录（不创建新记录）")
        void should_updateSameRecord_when_saveDraftAgain() throws Exception {
            String token = registerVerifyAndLogin();

            // Save step 1
            mockMvc.perform(post("/api/v1/onboarding/save-draft")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(draftStep1())));

            // Save step 2 (updates same record)
            mockMvc.perform(post("/api/v1/onboarding/save-draft")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(fullDraft())))
                    .andExpect(jsonPath("$.data.currentStep").value(2))
                    .andExpect(jsonPath("$.data.businessType").value("E_COMMERCE"));

            // Still only 1 record
            assertThat(onboardingMapper.selectCount(null)).isEqualTo(1);
        }

        @Test
        @DisplayName("草稿恢复 → GET /current 返回之前保存的草稿")
        void should_restoreDraft_when_getCurrent() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(post("/api/v1/onboarding/save-draft")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(draftStep1())));

            mockMvc.perform(get("/api/v1/onboarding/current")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("DRAFT"))
                    .andExpect(jsonPath("$.data.companyName").value("Test Corp Ltd"));
        }
    }

    @Nested
    @DisplayName("提交申请")
    class Submit {

        @Test
        @DisplayName("沙箱环境提交 → 状态直接变为 APPROVED（自动审批）")
        void should_autoApprove_when_sandbox() throws Exception {
            String token = registerVerifyAndLogin();

            OnboardingSaveDraftRequest req = fullDraft();
            req.setSubmit(true);

            mockMvc.perform(post("/api/v1/onboarding/save-draft")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("APPROVED"));
        }

        @Test
        @DisplayName("生产环境提交 → 状态变为 SUBMITTED")
        void should_setSubmitted_when_production() throws Exception {
            String token = registerVerifyAndLogin();

            OnboardingSaveDraftRequest req = fullDraft();
            req.setSubmit(true);

            mockMvc.perform(post("/api/v1/onboarding/save-draft")
                            .header("Authorization", "Bearer " + token)
                            .header("X-Environment", "production")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("SUBMITTED"));
        }

        @Test
        @DisplayName("提交时缺少必填字段 → HTTP 400")
        void should_return400_when_missingFieldsOnSubmit() throws Exception {
            String token = registerVerifyAndLogin();

            OnboardingSaveDraftRequest req = draftStep1(); // missing step 2 fields
            req.setSubmit(true);

            mockMvc.perform(post("/api/v1/onboarding/save-draft")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("生产环境已提交后再保存草稿 → HTTP 400 '申请已提交'")
        void should_return400_when_alreadySubmitted() throws Exception {
            String token = registerVerifyAndLogin();

            OnboardingSaveDraftRequest req = fullDraft();
            req.setSubmit(true);
            mockMvc.perform(post("/api/v1/onboarding/save-draft")
                    .header("Authorization", "Bearer " + token)
                    .header("X-Environment", "production")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)));

            mockMvc.perform(post("/api/v1/onboarding/save-draft")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(draftStep1())))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("申请已提交，不能修改"));
        }
    }

    @Nested
    @DisplayName("重新提交")
    class Reset {

        @Test
        @DisplayName("REJECTED 状态重置 → 状态回退为 DRAFT，数据保留")
        void should_resetToDraft_when_rejected() throws Exception {
            String token = registerVerifyAndLogin();

            // Submit in production → SUBMITTED
            OnboardingSaveDraftRequest req = fullDraft();
            req.setSubmit(true);
            mockMvc.perform(post("/api/v1/onboarding/save-draft")
                    .header("Authorization", "Bearer " + token)
                    .header("X-Environment", "production")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)));

            // Manually set to REJECTED (simulating admin review)
            var app = onboardingMapper.selectList(null).get(0);
            app.setStatus("REJECTED");
            app.setRejectReason("信息不完整");
            onboardingMapper.updateById(app);

            // Reset
            mockMvc.perform(post("/api/v1/onboarding/reset")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("DRAFT"))
                    .andExpect(jsonPath("$.data.companyName").value("Test Corp Ltd"));
        }

        @Test
        @DisplayName("非 REJECTED 状态重置 → HTTP 400")
        void should_return400_when_notRejected() throws Exception {
            String token = registerVerifyAndLogin();

            // Submit in production → SUBMITTED
            OnboardingSaveDraftRequest req = fullDraft();
            req.setSubmit(true);
            mockMvc.perform(post("/api/v1/onboarding/save-draft")
                    .header("Authorization", "Bearer " + token)
                    .header("X-Environment", "production")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)));

            // Try reset while SUBMITTED → fail
            mockMvc.perform(post("/api/v1/onboarding/reset")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("只有被拒绝的申请才能重新提交"));
        }
    }
}
