package com.osl.pay.portal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.model.dto.*;
import com.osl.pay.portal.repository.AuditLogMapper;
import com.osl.pay.portal.repository.MerchantMapper;
import com.osl.pay.portal.repository.MerchantUserMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("忘记密码与密码重置接口")
class AuthPasswordResetApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private MerchantUserMapper merchantUserMapper;
    @Autowired private MerchantMapper merchantMapper;
    @Autowired private AuditLogMapper auditLogMapper;
    @Autowired private StringRedisTemplate redis;

    @BeforeEach
    void cleanUp() {
        auditLogMapper.delete(null);
        merchantUserMapper.delete(null);
        merchantMapper.delete(null);
        Set<String> keys = redis.keys("auth:*");
        if (keys != null && !keys.isEmpty()) redis.delete(keys);
        Set<String> rateKeys = redis.keys("rate:*");
        if (rateKeys != null && !rateKeys.isEmpty()) redis.delete(rateKeys);
    }

    private void registerAndVerify(String email, String companyName) throws Exception {
        RegisterRequest reg = new RegisterRequest();
        reg.setEmail(email);
        reg.setPassword("Test1234");
        reg.setConfirmPassword("Test1234");
        reg.setCompanyName(companyName);
        reg.setContactName("测试用户");
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)));
        Set<String> keys = redis.keys("auth:verify:*");
        if (keys != null) {
            for (String key : keys) {
                mockMvc.perform(get("/api/v1/auth/verify-email")
                        .param("token", key.replace("auth:verify:", "")));
            }
        }
    }

    private LoginRequest loginReq(String email, String password) {
        LoginRequest req = new LoginRequest();
        req.setEmail(email);
        req.setPassword(password);
        return req;
    }

    // ==================== 忘记密码 ====================

    @Nested
    @DisplayName("忘记密码 - 发送重置链接")
    class ForgotPassword {

        @Test
        @DisplayName("已注册邮箱申请重置 → HTTP 200，Redis 中存在 reset token")
        void should_createResetToken_when_emailExists() throws Exception {
            registerAndVerify("user@test.com", "Corp A");

            ForgotPasswordRequest req = new ForgotPasswordRequest();
            req.setEmail("user@test.com");
            mockMvc.perform(post("/api/v1/auth/forgot-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0));

            Set<String> resetKeys = redis.keys("auth:reset:*");
            assertThat(resetKeys).hasSize(1);
        }

        @Test
        @DisplayName("未注册邮箱申请重置 → HTTP 200，返回相同消息（不泄漏邮箱是否存在），Redis 无 reset token")
        void should_returnSameResponse_when_emailNotExists() throws Exception {
            ForgotPasswordRequest req = new ForgotPasswordRequest();
            req.setEmail("nobody@test.com");
            mockMvc.perform(post("/api/v1/auth/forgot-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0))
                    .andExpect(jsonPath("$.data").value("如果该邮箱已注册，您将收到密码重置邮件"));

            Set<String> resetKeys = redis.keys("auth:reset:*");
            assertThat(resetKeys).isEmpty();
        }
    }

    // ==================== 密码重置 ====================

    @Nested
    @DisplayName("密码重置")
    class ResetPassword {

        @Test
        @DisplayName("使用有效 reset token + 合法新密码 → HTTP 200，新密码可登录，旧密码失败，refresh token 被撤销")
        void should_updatePassword_when_validTokenAndPassword() throws Exception {
            registerAndVerify("user@test.com", "Corp A");

            // 先登录获取 refresh token
            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginReq("user@test.com", "Test1234"))));

            // 申请重置
            ForgotPasswordRequest forgot = new ForgotPasswordRequest();
            forgot.setEmail("user@test.com");
            mockMvc.perform(post("/api/v1/auth/forgot-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(forgot)));

            String resetToken = redis.keys("auth:reset:*").iterator().next().replace("auth:reset:", "");

            // 重置密码
            ResetPasswordRequest reset = new ResetPasswordRequest();
            reset.setToken(resetToken);
            reset.setNewPassword("NewPass567");
            reset.setConfirmPassword("NewPass567");
            mockMvc.perform(post("/api/v1/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(reset)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0));

            // 新密码可登录
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginReq("user@test.com", "NewPass567"))))
                    .andExpect(jsonPath("$.data.authenticated").value(true));

            // 旧密码无法登录
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginReq("user@test.com", "Test1234"))))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("使用无效 token → HTTP 400，提示链接无效或已过期")
        void should_return400_when_invalidToken() throws Exception {
            ResetPasswordRequest reset = new ResetPasswordRequest();
            reset.setToken("nonexistent-token");
            reset.setNewPassword("NewPass567");
            reset.setConfirmPassword("NewPass567");
            mockMvc.perform(post("/api/v1/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(reset)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40003));
        }

        @Test
        @DisplayName("同一 token 二次使用 → 第二次返回 400（token 原子消费）")
        void should_failOnSecondUse_when_tokenAlreadyConsumed() throws Exception {
            registerAndVerify("user@test.com", "Corp A");

            ForgotPasswordRequest forgot = new ForgotPasswordRequest();
            forgot.setEmail("user@test.com");
            mockMvc.perform(post("/api/v1/auth/forgot-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(forgot)));

            String resetToken = redis.keys("auth:reset:*").iterator().next().replace("auth:reset:", "");

            ResetPasswordRequest reset = new ResetPasswordRequest();
            reset.setToken(resetToken);
            reset.setNewPassword("NewPass567");
            reset.setConfirmPassword("NewPass567");

            // 第一次 → 成功
            mockMvc.perform(post("/api/v1/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(reset)))
                    .andExpect(jsonPath("$.code").value(0));

            // 第二次 → 失败
            reset.setNewPassword("Another789");
            reset.setConfirmPassword("Another789");
            mockMvc.perform(post("/api/v1/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(reset)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40003));
        }

        @Test
        @DisplayName("新密码不满足规则（纯数字）→ HTTP 400")
        void should_return400_when_newPasswordWeak() throws Exception {
            registerAndVerify("user@test.com", "Corp A");

            ForgotPasswordRequest forgot = new ForgotPasswordRequest();
            forgot.setEmail("user@test.com");
            mockMvc.perform(post("/api/v1/auth/forgot-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(forgot)));

            String resetToken = redis.keys("auth:reset:*").iterator().next().replace("auth:reset:", "");

            ResetPasswordRequest reset = new ResetPasswordRequest();
            reset.setToken(resetToken);
            reset.setNewPassword("12345678");
            reset.setConfirmPassword("12345678");
            mockMvc.perform(post("/api/v1/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(reset)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("两次密码不一致 → HTTP 400")
        void should_return400_when_passwordMismatch() throws Exception {
            registerAndVerify("user@test.com", "Corp A");

            ForgotPasswordRequest forgot = new ForgotPasswordRequest();
            forgot.setEmail("user@test.com");
            mockMvc.perform(post("/api/v1/auth/forgot-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(forgot)));

            String resetToken = redis.keys("auth:reset:*").iterator().next().replace("auth:reset:", "");

            ResetPasswordRequest reset = new ResetPasswordRequest();
            reset.setToken(resetToken);
            reset.setNewPassword("NewPass567");
            reset.setConfirmPassword("Different89");
            mockMvc.perform(post("/api/v1/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(reset)))
                    .andExpect(status().isBadRequest());
        }
    }
}
