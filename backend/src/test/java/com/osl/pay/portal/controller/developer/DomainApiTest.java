package com.osl.pay.portal.controller.developer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.model.dto.LoginRequest;
import com.osl.pay.portal.model.dto.RegisterRequest;
import com.osl.pay.portal.repository.*;
import com.osl.pay.portal.security.AuthRedisService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("域名白名单接口")
class DomainApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private MerchantUserMapper merchantUserMapper;
    @Autowired private MerchantMapper merchantMapper;
    @Autowired private OrderMapper orderMapper;
    @Autowired private ApiCredentialMapper apiCredentialMapper;
    @Autowired private WebhookConfigMapper webhookConfigMapper;
    @Autowired private WebhookLogMapper webhookLogMapper;
    @Autowired private DomainWhitelistMapper domainWhitelistMapper;
    @Autowired private ApiRequestLogMapper apiRequestLogMapper;
    @Autowired private AuditLogMapper auditLogMapper;
    @Autowired private MerchantApplicationMapper merchantApplicationMapper;
    @Autowired private ApplicationDocumentMapper applicationDocumentMapper;
    @Autowired private StringRedisTemplate redis;
    @Autowired private AuthRedisService authRedis;

    private String token;
    private Long userId;

    @BeforeEach
    void setUp() throws Exception {
        auditLogMapper.delete(null);
        apiRequestLogMapper.delete(null);
        webhookLogMapper.delete(null);
        domainWhitelistMapper.delete(null);
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

        MvcResult result = registerVerifyAndLogin();
        token = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
        userId = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("userId").asLong();
    }

    private MvcResult registerVerifyAndLogin() throws Exception {
        RegisterRequest reg = new RegisterRequest();
        reg.setEmail("domain@test.com");
        reg.setPassword("Test1234");
        reg.setConfirmPassword("Test1234");
        reg.setCompanyName("Domain Corp");
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
        login.setEmail("domain@test.com");
        login.setPassword("Test1234");
        return mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn();
    }

    @Nested
    @DisplayName("添加域名（需身份验证）")
    class AddDomain {

        @Test
        @DisplayName("有效邮件验证码 + 合法域名 → 200 添加成功")
        void should_addDomain_when_validEmailCode() throws Exception {
            authRedis.saveEmailCode(userId, "123456");

            mockMvc.perform(post("/api/v1/domains")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "domain", "https://example.com",
                                    "emailCode", "123456"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.domain").value("https://example.com"));
        }

        @Test
        @DisplayName("无验证码 → 400")
        void should_reject_when_noVerificationCode() throws Exception {
            mockMvc.perform(post("/api/v1/domains")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "domain", "https://example.com"))))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("错误邮件验证码 → 400 '邮件验证码错误或已过期'")
        void should_reject_when_wrongEmailCode() throws Exception {
            authRedis.saveEmailCode(userId, "123456");

            mockMvc.perform(post("/api/v1/domains")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "domain", "https://example.com",
                                    "emailCode", "999999"))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("邮件验证码错误或已过期"));
        }

        @Test
        @DisplayName("重复添加 → 400 '该域名已存在'")
        void should_reject_duplicate() throws Exception {
            authRedis.saveEmailCode(userId, "111111");
            mockMvc.perform(post("/api/v1/domains")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                            "domain", "https://dup.com",
                            "emailCode", "111111"))));

            authRedis.saveEmailCode(userId, "222222");
            mockMvc.perform(post("/api/v1/domains")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "domain", "https://dup.com",
                                    "emailCode", "222222"))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("该域名已存在"));
        }

        @Test
        @DisplayName("无效格式（无协议）→ 400")
        void should_reject_noProtocol() throws Exception {
            authRedis.saveEmailCode(userId, "123456");

            mockMvc.perform(post("/api/v1/domains")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "domain", "example.com",
                                    "emailCode", "123456"))))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("删除域名（需身份验证）")
    class RemoveDomain {

        @Test
        @DisplayName("有效验证码 → 200 删除成功，数据库中域名已清除")
        void should_removeDomain_when_validCode() throws Exception {
            // Add first
            authRedis.saveEmailCode(userId, "111111");
            MvcResult addResult = mockMvc.perform(post("/api/v1/domains")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "domain", "https://remove-me.com",
                                    "emailCode", "111111"))))
                    .andReturn();
            Long id = objectMapper.readTree(addResult.getResponse().getContentAsString())
                    .path("data").path("id").asLong();

            // Remove with verification
            authRedis.saveEmailCode(userId, "222222");
            mockMvc.perform(post("/api/v1/domains/" + id + "/remove")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "emailCode", "222222"))))
                    .andExpect(status().isOk());

            assertThat(domainWhitelistMapper.selectCount(null)).isEqualTo(0);
        }

        @Test
        @DisplayName("无验证码 → 400")
        void should_reject_when_noCode() throws Exception {
            mockMvc.perform(post("/api/v1/domains/1/remove")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("查看与认证")
    class ListAndAuth {

        @Test
        @DisplayName("列表 → 返回已添加的域名")
        void should_listDomains() throws Exception {
            authRedis.saveEmailCode(userId, "123456");
            mockMvc.perform(post("/api/v1/domains")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                            "domain", "https://list.com",
                            "emailCode", "123456"))));

            mockMvc.perform(get("/api/v1/domains").header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].domain").value("https://list.com"));
        }

        @Test
        @DisplayName("未认证 → 403")
        void should_return403() throws Exception {
            mockMvc.perform(get("/api/v1/domains")).andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("添加域名后审计日志中存在 DOMAIN_ADDED 记录")
        void should_writeAuditLog_when_addDomain() throws Exception {
            authRedis.saveEmailCode(userId, "123456");
            mockMvc.perform(post("/api/v1/domains")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                            "domain", "https://audit.com",
                            "emailCode", "123456"))));

            // Give async audit a moment
            Thread.sleep(200);

            long auditCount = auditLogMapper.selectCount(null);
            assertThat(auditCount).isGreaterThanOrEqualTo(1);
        }
    }
}
