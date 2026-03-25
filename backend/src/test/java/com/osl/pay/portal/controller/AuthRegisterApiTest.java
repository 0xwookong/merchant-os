package com.osl.pay.portal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.model.dto.RegisterRequest;
import com.osl.pay.portal.model.entity.Merchant;
import com.osl.pay.portal.model.entity.MerchantUser;
import com.osl.pay.portal.model.enums.KybStatus;
import com.osl.pay.portal.model.enums.MerchantStatus;
import com.osl.pay.portal.model.enums.UserRole;
import com.osl.pay.portal.model.enums.UserStatus;
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

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("商户注册与邮箱验证接口")
class AuthRegisterApiTest {

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

    private RegisterRequest validRequest() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("merchant@example.com");
        req.setPassword("Secure1234");
        req.setConfirmPassword("Secure1234");
        req.setCompanyName("Test Corp Ltd");
        req.setContactName("张三");
        return req;
    }

    // ==================== 注册 - 正常流程 ====================

    @Nested
    @DisplayName("注册 - 正常流程")
    class RegisterHappyPath {

        @Test
        @DisplayName("合法参数注册 → HTTP 200，返回 merchantId + userId + email，数据库创建商户和用户，Redis 存在验证 token")
        void should_createMerchantAndUser_when_validRequest() throws Exception {
            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validRequest())))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0))
                    .andExpect(jsonPath("$.data.merchantId").isNumber())
                    .andExpect(jsonPath("$.data.userId").isNumber())
                    .andExpect(jsonPath("$.data.email").value("merchant@example.com"));

            // 验证数据库：商户记录
            Merchant merchant = merchantMapper.selectList(null).get(0);
            assertThat(merchant.getCompanyName()).isEqualTo("Test Corp Ltd");
            assertThat(merchant.getStatus()).isEqualTo(MerchantStatus.ACTIVE);
            assertThat(merchant.getKybStatus()).isEqualTo(KybStatus.NOT_STARTED);

            // 验证数据库：用户记录
            MerchantUser user = merchantUserMapper.selectList(null).get(0);
            assertThat(user.getEmail()).isEqualTo("merchant@example.com");
            assertThat(user.getContactName()).isEqualTo("张三");
            assertThat(user.getRole()).isEqualTo(UserRole.ADMIN);
            assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
            assertThat(user.getEmailVerified()).isFalse();
            assertThat(user.getMerchantId()).isEqualTo(merchant.getId());

            // 验证 Redis：存在验证 token
            Set<String> verifyKeys = redis.keys("auth:verify:*");
            assertThat(verifyKeys).hasSize(1);
        }

        @Test
        @DisplayName("注册成功后审计日志记录 → t_audit_log 中有 REGISTER 事件，邮箱已脱敏")
        void should_writeAuditLog_when_registerSuccess() throws Exception {
            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(validRequest())));

            Thread.sleep(500); // 等待异步审计写入

            var logs = auditLogMapper.selectList(null);
            assertThat(logs).isNotEmpty();
            var registerLog = logs.stream()
                    .filter(l -> "REGISTER".equals(l.getEventType()))
                    .findFirst().orElseThrow();
            assertThat(registerLog.getSuccess()).isTrue();
            assertThat(registerLog.getIpAddress()).isNotBlank();
            // 邮箱脱敏验证：不应包含完整邮箱
            assertThat(registerLog.getEmail()).contains("***");
            assertThat(registerLog.getEmail()).doesNotContain("merchant@example.com");
        }
    }

    // ==================== 注册 - 参数校验 ====================

    @Nested
    @DisplayName("注册 - 参数校验")
    class RegisterValidation {

        @Test
        @DisplayName("所有字段为空 → HTTP 400，返回参数校验错误")
        void should_return400_when_allFieldsEmpty() throws Exception {
            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new RegisterRequest())))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40000));
        }

        @Test
        @DisplayName("邮箱格式不合法（缺少@）→ HTTP 400")
        void should_return400_when_emailInvalid() throws Exception {
            RegisterRequest req = validRequest();
            req.setEmail("not-an-email");
            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("密码少于 8 位 → HTTP 400")
        void should_return400_when_passwordTooShort() throws Exception {
            RegisterRequest req = validRequest();
            req.setPassword("Ab1");
            req.setConfirmPassword("Ab1");
            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("密码超过 72 字节（BCrypt 上限）→ HTTP 400")
        void should_return400_when_passwordTooLong() throws Exception {
            RegisterRequest req = validRequest();
            String longPwd = "Aa1" + "x".repeat(70); // 73 chars
            req.setPassword(longPwd);
            req.setConfirmPassword(longPwd);
            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("密码仅含小写字母（不满足至少两种字符类型）→ HTTP 400，提示密码规则")
        void should_return400_when_passwordOnlyLowercase() throws Exception {
            RegisterRequest req = validRequest();
            req.setPassword("abcdefghij");
            req.setConfirmPassword("abcdefghij");
            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40001));
        }

        @Test
        @DisplayName("密码与邮箱相同 → HTTP 400")
        void should_return400_when_passwordEqualsEmail() throws Exception {
            RegisterRequest req = validRequest();
            req.setEmail("Test1234@x.com");
            req.setPassword("Test1234@x.com");
            req.setConfirmPassword("Test1234@x.com");
            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("两次密码不一致 → HTTP 400")
        void should_return400_when_passwordMismatch() throws Exception {
            RegisterRequest req = validRequest();
            req.setConfirmPassword("Different123");
            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40001));
        }

        @Test
        @DisplayName("公司名超过 200 字符 → HTTP 400")
        void should_return400_when_companyNameTooLong() throws Exception {
            RegisterRequest req = validRequest();
            req.setCompanyName("A".repeat(201));
            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("联系人姓名超过 100 字符 → HTTP 400")
        void should_return400_when_contactNameTooLong() throws Exception {
            RegisterRequest req = validRequest();
            req.setContactName("张".repeat(101));
            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }
    }

    // ==================== 注册 - 业务规则 ====================

    @Nested
    @DisplayName("注册 - 业务规则")
    class RegisterBusinessRules {

        @Test
        @DisplayName("公司名已存在（不同邮箱）→ HTTP 400，返回统一错误消息，不暴露'公司已存在'")
        void should_returnGenericError_when_companyNameExists() throws Exception {
            // 先注册一个商户
            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(validRequest())));

            // 用不同邮箱注册同一公司名
            RegisterRequest req2 = validRequest();
            req2.setEmail("another@example.com");
            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req2)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40002))
                    .andExpect(jsonPath("$.message").value("注册信息有误，请检查后重试或联系客服"));
        }

        @Test
        @DisplayName("邮箱已存在（不同公司名）→ HTTP 400，返回与公司名重复相同的统一错误消息（防枚举）")
        void should_returnSameGenericError_when_emailExists() throws Exception {
            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(validRequest())));

            RegisterRequest req2 = validRequest();
            req2.setCompanyName("Different Corp");
            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req2)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40002))
                    // 与公司名重复返回相同消息，防止攻击者区分
                    .andExpect(jsonPath("$.message").value("注册信息有误，请检查后重试或联系客服"));
        }
    }

    // ==================== 邮箱验证 ====================

    @Nested
    @DisplayName("邮箱验证")
    class VerifyEmail {

        @Test
        @DisplayName("使用有效 token 验证 → HTTP 200，用户 email_verified 变为 true，Redis token 被删除")
        void should_verifyEmail_when_validToken() throws Exception {
            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(validRequest())));

            Set<String> keys = redis.keys("auth:verify:*");
            assertThat(keys).hasSize(1);
            String token = keys.iterator().next().replace("auth:verify:", "");

            mockMvc.perform(get("/api/v1/auth/verify-email").param("token", token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0));

            MerchantUser user = merchantUserMapper.selectList(null).get(0);
            assertThat(user.getEmailVerified()).isTrue();

            // Token 已消费（从 Redis 删除）
            assertThat(redis.keys("auth:verify:*")).isEmpty();
        }

        @Test
        @DisplayName("使用同一 token 二次验证 → 第二次返回无效（token 已被原子删除）")
        void should_failOnSecondUse_when_tokenAlreadyConsumed() throws Exception {
            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(validRequest())));

            String token = redis.keys("auth:verify:*").iterator().next().replace("auth:verify:", "");

            // 第一次验证 → 成功
            mockMvc.perform(get("/api/v1/auth/verify-email").param("token", token))
                    .andExpect(jsonPath("$.code").value(0));

            // 第二次验证 → 失败（token 已不在 Redis）
            mockMvc.perform(get("/api/v1/auth/verify-email").param("token", token))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40003));
        }

        @Test
        @DisplayName("使用不存在的 token → HTTP 400，提示链接无效或已过期")
        void should_return400_when_tokenNotExists() throws Exception {
            mockMvc.perform(get("/api/v1/auth/verify-email").param("token", "nonexistent-token"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40003))
                    .andExpect(jsonPath("$.message").value("验证链接无效或已过期，如已验证请直接登录"));
        }
    }
}
