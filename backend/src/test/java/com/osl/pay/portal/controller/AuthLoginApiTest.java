package com.osl.pay.portal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.model.dto.*;
import com.osl.pay.portal.model.entity.Merchant;
import com.osl.pay.portal.model.entity.MerchantUser;
import com.osl.pay.portal.model.enums.*;
import com.osl.pay.portal.repository.AuditLogMapper;
import com.osl.pay.portal.repository.MerchantMapper;
import com.osl.pay.portal.repository.MerchantUserMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("商户登录、Token 刷新与登出接口")
class AuthLoginApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private MerchantUserMapper merchantUserMapper;
    @Autowired private MerchantMapper merchantMapper;
    @Autowired private AuditLogMapper auditLogMapper;
    @Autowired private PasswordEncoder passwordEncoder;
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

    /** 注册并验证邮箱的快捷方法 */
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

    /** 在已有商户下创建用户（模拟邀请加入） */
    private MerchantUser createUserInMerchant(Long merchantId, String email) {
        MerchantUser user = new MerchantUser();
        user.setMerchantId(merchantId);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("Test1234"));
        user.setContactName("受邀用户");
        user.setRole(UserRole.TECH);
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerified(true);
        merchantUserMapper.insert(user);
        return user;
    }

    private LoginRequest loginReq(String email, String password, Long merchantId) {
        LoginRequest req = new LoginRequest();
        req.setEmail(email);
        req.setPassword(password);
        req.setMerchantId(merchantId);
        return req;
    }

    // ==================== 登录 - 正常流程 ====================

    @Nested
    @DisplayName("登录 - 单商户正常流程")
    class LoginSingleMerchant {

        @Test
        @DisplayName("邮箱+正确密码登录 → HTTP 200，authenticated=true，返回 accessToken + 用户信息 + httpOnly refresh cookie")
        void should_returnTokens_when_correctCredentials() throws Exception {
            registerAndVerify("user@test.com", "Corp A");

            MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginReq("user@test.com", "Test1234", null))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0))
                    .andExpect(jsonPath("$.data.authenticated").value(true))
                    .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.data.email").value("user@test.com"))
                    .andExpect(jsonPath("$.data.companyName").value("Corp A"))
                    .andExpect(jsonPath("$.data.role").value("ADMIN"))
                    .andReturn();

            // 验证 httpOnly cookie
            Cookie refreshCookie = result.getResponse().getCookie("refresh_token");
            assertThat(refreshCookie).isNotNull();
            assertThat(refreshCookie.isHttpOnly()).isTrue();
            // Secure=false in test/dev (HTTP), true in prod (HTTPS)
            assertThat(refreshCookie.getSecure()).isFalse();
            assertThat(refreshCookie.getPath()).isEqualTo("/api/v1/auth/refresh");

            // 验证 Redis 中存储了 refresh token
            MerchantUser user = merchantUserMapper.selectList(null).get(0);
            String redisRefresh = redis.opsForValue().get("auth:refresh:" + user.getId() + ":" + user.getMerchantId());
            assertThat(redisRefresh).isNotNull();
        }
    }

    // ==================== 登录 - 多商户选择 ====================

    @Nested
    @DisplayName("登录 - 多商户选择流程")
    class LoginMultiMerchant {

        @Test
        @DisplayName("同一邮箱在两个商户下，不指定 merchantId → authenticated=false，返回商户选择列表")
        void should_returnMerchantList_when_multiMerchantWithoutSelection() throws Exception {
            registerAndVerify("shared@test.com", "Corp A");
            // 模拟被邀请加入 Corp B
            Merchant corpB = new Merchant();
            corpB.setCompanyName("Corp B");
            corpB.setStatus(MerchantStatus.ACTIVE);
            corpB.setKybStatus(KybStatus.NOT_STARTED);
            merchantMapper.insert(corpB);
            createUserInMerchant(corpB.getId(), "shared@test.com");

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginReq("shared@test.com", "Test1234", null))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.authenticated").value(false))
                    .andExpect(jsonPath("$.data.merchants").isArray())
                    .andExpect(jsonPath("$.data.merchants.length()").value(2))
                    .andExpect(jsonPath("$.data.accessToken").doesNotExist());
        }

        @Test
        @DisplayName("指定 merchantId 登录 → authenticated=true，JWT 绑定到指定商户")
        void should_returnToken_when_merchantIdSpecified() throws Exception {
            registerAndVerify("shared@test.com", "Corp A");
            Merchant corpB = new Merchant();
            corpB.setCompanyName("Corp B");
            corpB.setStatus(MerchantStatus.ACTIVE);
            corpB.setKybStatus(KybStatus.NOT_STARTED);
            merchantMapper.insert(corpB);
            createUserInMerchant(corpB.getId(), "shared@test.com");

            MerchantUser userA = merchantUserMapper.selectList(null).stream()
                    .filter(u -> u.getEmail().equals("shared@test.com"))
                    .findFirst().orElseThrow();

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    loginReq("shared@test.com", "Test1234", userA.getMerchantId()))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.authenticated").value(true))
                    .andExpect(jsonPath("$.data.merchantId").value(userA.getMerchantId()));
        }
    }

    // ==================== 登录 - 失败场景 ====================

    @Nested
    @DisplayName("登录 - 失败场景")
    class LoginFailures {

        @Test
        @DisplayName("邮箱不存在 → HTTP 401，返回'账号或密码错误'（不泄漏邮箱不存在）")
        void should_return401WithGenericMsg_when_emailNotFound() throws Exception {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginReq("nobody@test.com", "Test1234", null))))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value(40101))
                    .andExpect(jsonPath("$.message").value("账号或密码错误"));
        }

        @Test
        @DisplayName("密码错误 → HTTP 401，返回与邮箱不存在相同的消息（防枚举），Redis 失败计数 +1")
        void should_return401AndIncrementFailCount_when_wrongPassword() throws Exception {
            registerAndVerify("user@test.com", "Corp A");

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginReq("user@test.com", "WrongPass1", null))))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value(40101))
                    .andExpect(jsonPath("$.message").value("账号或密码错误"));

            MerchantUser user = merchantUserMapper.selectList(null).get(0);
            String failCount = redis.opsForValue().get("auth:login-fail:" + user.getId());
            assertThat(failCount).isEqualTo("1");
        }

        @Test
        @DisplayName("连续 5 次密码错误后用正确密码登录 → HTTP 401，返回'账号已锁定'")
        void should_lockAccount_when_5ConsecutiveFailures() throws Exception {
            registerAndVerify("user@test.com", "Corp A");

            for (int i = 0; i < 5; i++) {
                mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq("user@test.com", "Wrong" + i + "Pass", null))));
            }

            // 第 6 次用正确密码 → 仍然锁定
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginReq("user@test.com", "Test1234", null))))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value(40102))
                    .andExpect(jsonPath("$.message").value("账号已锁定，请稍后重试"));
        }

        @Test
        @DisplayName("邮箱未验证 → HTTP 401，返回'请先验证邮箱'")
        void should_return401_when_emailNotVerified() throws Exception {
            RegisterRequest reg = new RegisterRequest();
            reg.setEmail("unverified@test.com");
            reg.setPassword("Test1234");
            reg.setConfirmPassword("Test1234");
            reg.setCompanyName("Corp Unverified");
            reg.setContactName("测试");
            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(reg)));

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginReq("unverified@test.com", "Test1234", null))))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value(40103));
        }

        @Test
        @DisplayName("密码超过 72 字节 → HTTP 400（DTO 校验拦截，防 BCrypt DoS）")
        void should_return400_when_passwordTooLong() throws Exception {
            LoginRequest req = loginReq("user@test.com", "A".repeat(73), null);
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }
    }

    // ==================== Token 刷新 ====================

    @Nested
    @DisplayName("Token 刷新")
    class TokenRefresh {

        @Test
        @DisplayName("用有效 refresh cookie 刷新 → HTTP 200，返回新 accessToken，cookie 轮换为新 refreshToken")
        void should_rotateTokens_when_validRefreshCookie() throws Exception {
            registerAndVerify("user@test.com", "Corp A");

            MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginReq("user@test.com", "Test1234", null))))
                    .andReturn();
            Cookie cookie1 = loginResult.getResponse().getCookie("refresh_token");

            MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh").cookie(cookie1))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.authenticated").value(true))
                    .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                    .andReturn();

            // 新 cookie 与旧 cookie 不同（轮换）
            Cookie cookie2 = refreshResult.getResponse().getCookie("refresh_token");
            assertThat(cookie2).isNotNull();
            assertThat(cookie2.getValue()).isNotEqualTo(cookie1.getValue());
        }

        @Test
        @DisplayName("用旧 refresh token 刷新（已被轮换）→ HTTP 401（防止被盗 token 重放）")
        void should_rejectOldToken_when_alreadyRotated() throws Exception {
            registerAndVerify("user@test.com", "Corp A");

            MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginReq("user@test.com", "Test1234", null))))
                    .andReturn();
            Cookie oldCookie = loginResult.getResponse().getCookie("refresh_token");

            // 先刷新一次（轮换 token）
            mockMvc.perform(post("/api/v1/auth/refresh").cookie(oldCookie));

            // 再用旧 cookie 刷新 → 被拒绝
            mockMvc.perform(post("/api/v1/auth/refresh").cookie(oldCookie))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value(40105));
        }

        @Test
        @DisplayName("无 refresh cookie → HTTP 401")
        void should_return401_when_noCookie() throws Exception {
            mockMvc.perform(post("/api/v1/auth/refresh"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==================== 登出 ====================

    @Nested
    @DisplayName("登出")
    class Logout {

        @Test
        @DisplayName("携带 accessToken 登出 → HTTP 200，refresh token 从 Redis 删除，cookie 被清除")
        void should_revokeRefreshToken_when_logout() throws Exception {
            registerAndVerify("user@test.com", "Corp A");

            MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginReq("user@test.com", "Test1234", null))))
                    .andReturn();

            String accessToken = objectMapper.readTree(
                    loginResult.getResponse().getContentAsString())
                    .path("data").path("accessToken").asText();
            Cookie refreshCookie = loginResult.getResponse().getCookie("refresh_token");

            // 登出
            MvcResult logoutResult = mockMvc.perform(post("/api/v1/auth/logout")
                            .header("Authorization", "Bearer " + accessToken))
                    .andExpect(status().isOk())
                    .andReturn();

            // Cookie 被清除（MaxAge=0）
            Cookie clearedCookie = logoutResult.getResponse().getCookie("refresh_token");
            assertThat(clearedCookie).isNotNull();
            assertThat(clearedCookie.getMaxAge()).isEqualTo(0);

            // 用旧 refresh cookie 刷新 → 被拒绝
            mockMvc.perform(post("/api/v1/auth/refresh").cookie(refreshCookie))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ==================== JWT 认证过滤器 ====================

    @Nested
    @DisplayName("JWT 认证过滤器")
    class JwtFilter {

        @Test
        @DisplayName("无 token 访问受保护端点 → HTTP 403")
        void should_return403_when_noToken() throws Exception {
            mockMvc.perform(get("/api/v1/orders"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("有效 accessToken 访问公开端点 → HTTP 200（不拦截）")
        void should_allowPublicEndpoint_when_withToken() throws Exception {
            registerAndVerify("user@test.com", "Corp A");

            MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginReq("user@test.com", "Test1234", null))))
                    .andReturn();
            String accessToken = objectMapper.readTree(
                    result.getResponse().getContentAsString())
                    .path("data").path("accessToken").asText();

            mockMvc.perform(get("/api/v1/health")
                            .header("Authorization", "Bearer " + accessToken))
                    .andExpect(status().isOk());
        }
    }

    // ==================== 审计日志 ====================

    @Nested
    @DisplayName("登录审计日志")
    class LoginAudit {

        @Test
        @DisplayName("登录成功 → t_audit_log 记录 LOGIN_SUCCESS 事件，含 IP 和 User-Agent")
        void should_logLoginSuccess_when_correctCredentials() throws Exception {
            registerAndVerify("user@test.com", "Corp A");

            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("User-Agent", "TestBrowser/1.0")
                    .content(objectMapper.writeValueAsString(loginReq("user@test.com", "Test1234", null))));

            Thread.sleep(500);

            var logs = auditLogMapper.selectList(null);
            var loginLog = logs.stream()
                    .filter(l -> "LOGIN_SUCCESS".equals(l.getEventType()))
                    .findFirst().orElseThrow();
            assertThat(loginLog.getSuccess()).isTrue();
            assertThat(loginLog.getIpAddress()).isNotBlank();
            assertThat(loginLog.getUserAgent()).contains("TestBrowser");
        }

        @Test
        @DisplayName("登录失败 → t_audit_log 记录 LOGIN_FAILED 事件")
        void should_logLoginFailed_when_wrongPassword() throws Exception {
            registerAndVerify("user@test.com", "Corp A");

            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginReq("user@test.com", "WrongPass1", null))));

            Thread.sleep(500);

            var logs = auditLogMapper.selectList(null);
            boolean hasFailLog = logs.stream()
                    .anyMatch(l -> "LOGIN_FAILED".equals(l.getEventType()) && !l.getSuccess());
            assertThat(hasFailLog).isTrue();
        }
    }
}
