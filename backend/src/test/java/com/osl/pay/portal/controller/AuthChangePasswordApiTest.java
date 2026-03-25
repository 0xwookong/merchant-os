package com.osl.pay.portal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.model.dto.*;
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

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("修改密码接口")
class AuthChangePasswordApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private MerchantUserMapper merchantUserMapper;
    @Autowired private MerchantMapper merchantMapper;
    @Autowired private OrderMapper orderMapper;
    @Autowired private ApiCredentialMapper apiCredentialMapper;
    @Autowired private AuditLogMapper auditLogMapper;
    @Autowired private ApiRequestLogMapper apiRequestLogMapper;
    @Autowired private WebhookLogMapper webhookLogMapper;
    @Autowired private DomainWhitelistMapper domainWhitelistMapper;
    @Autowired private KybApplicationMapper kybApplicationMapper;
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
        reg.setEmail("user@test.com");
        reg.setPassword("OldPass123");
        reg.setConfirmPassword("OldPass123");
        reg.setCompanyName("Test Corp");
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
        login.setEmail("user@test.com");
        login.setPassword("OldPass123");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    private ChangePasswordRequest changeReq(String oldPwd, String newPwd, String confirmPwd) {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setOldPassword(oldPwd);
        req.setNewPassword(newPwd);
        req.setConfirmPassword(confirmPwd);
        return req;
    }

    @Nested
    @DisplayName("修改密码 - 正常流程")
    class HappyPath {

        @Test
        @DisplayName("输入正确旧密码和合法新密码 → HTTP 200，新密码可登录，旧密码失效")
        void should_changePassword_when_validRequest() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(post("/api/v1/auth/change-password")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(changeReq("OldPass123", "NewPass456", "NewPass456"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0));

            // 新密码可登录
            LoginRequest login = new LoginRequest();
            login.setEmail("user@test.com");
            login.setPassword("NewPass456");
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(login)))
                    .andExpect(jsonPath("$.data.authenticated").value(true));

            // 旧密码失败
            login.setPassword("OldPass123");
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(login)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("修改密码后审计日志记录 PASSWORD_CHANGE 事件")
        void should_auditLog_when_passwordChanged() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(post("/api/v1/auth/change-password")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(changeReq("OldPass123", "NewPass456", "NewPass456"))));

            Thread.sleep(500);

            boolean hasLog = auditLogMapper.selectList(null).stream()
                    .anyMatch(l -> "PASSWORD_CHANGE".equals(l.getEventType()) && l.getSuccess());
            assertThat(hasLog).isTrue();
        }
    }

    @Nested
    @DisplayName("修改密码 - 认证与安全")
    class Security {

        @Test
        @DisplayName("未携带 JWT 调用 → HTTP 403")
        void should_return403_when_noToken() throws Exception {
            mockMvc.perform(post("/api/v1/auth/change-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(changeReq("a", "b", "c"))))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("旧密码错误 → HTTP 401 '旧密码错误'")
        void should_return401_when_wrongOldPassword() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(post("/api/v1/auth/change-password")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(changeReq("WrongOld1", "NewPass456", "NewPass456"))))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value(40101))
                    .andExpect(jsonPath("$.message").value("旧密码错误"));
        }

        @Test
        @DisplayName("新密码与旧密码相同 → HTTP 400 '新密码不能与旧密码相同'")
        void should_return400_when_sameAsOldPassword() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(post("/api/v1/auth/change-password")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(changeReq("OldPass123", "OldPass123", "OldPass123"))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("新密码不能与旧密码相同"));
        }

        @Test
        @DisplayName("新密码不符合规则（纯小写）→ HTTP 400")
        void should_return400_when_weakNewPassword() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(post("/api/v1/auth/change-password")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(changeReq("OldPass123", "abcdefgh", "abcdefgh"))))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("两次新密码不一致 → HTTP 400")
        void should_return400_when_confirmMismatch() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(post("/api/v1/auth/change-password")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(changeReq("OldPass123", "NewPass456", "Different789"))))
                    .andExpect(status().isBadRequest());
        }
    }
}
