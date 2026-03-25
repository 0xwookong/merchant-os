package com.osl.pay.portal.controller.merchant;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.model.dto.LoginRequest;
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

import com.osl.pay.portal.security.AuthRedisService;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("成员管理接口")
class MemberApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private MerchantUserMapper merchantUserMapper;
    @Autowired private MerchantMapper merchantMapper;
    @Autowired private OrderMapper orderMapper;
    @Autowired private KybApplicationMapper kybApplicationMapper;
    @Autowired private OnboardingApplicationMapper onboardingMapper;
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
    private Long adminUserId;

    @BeforeEach
    void setUp() throws Exception {
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

        MvcResult regResult = registerAndLogin();
        token = objectMapper.readTree(regResult.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
        adminUserId = objectMapper.readTree(regResult.getResponse().getContentAsString())
                .path("data").path("userId").asLong();
    }

    private MvcResult registerAndLogin() throws Exception {
        RegisterRequest reg = new RegisterRequest();
        reg.setEmail("admin@member.com");
        reg.setPassword("Test1234");
        reg.setConfirmPassword("Test1234");
        reg.setCompanyName("Member Corp");
        reg.setContactName("管理员");
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)));
        Set<String> verifyKeys = redis.keys("auth:verify:*");
        for (String key : verifyKeys) {
            mockMvc.perform(get("/api/v1/auth/verify-email")
                    .param("token", key.replace("auth:verify:", "")));
        }
        LoginRequest login = new LoginRequest();
        login.setEmail("admin@member.com");
        login.setPassword("Test1234");
        return mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn();
    }

    @Test
    @DisplayName("成员列表 → 返回当前商户成员（至少包含自己）")
    void should_listMembers() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/members")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andReturn();

        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
        assertThat(data.size()).isGreaterThanOrEqualTo(1);
        assertThat(data.get(0).path("email").asText()).isEqualTo("admin@member.com");
    }

    @Test
    @DisplayName("邀请成员 → 200，列表增加一人，状态 PENDING")
    void should_inviteMember() throws Exception {
        mockMvc.perform(post("/api/v1/members/invite")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "tech@member.com",
                                "role", "TECH",
                                "contactName", "技术小王"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("tech@member.com"))
                .andExpect(jsonPath("$.data.role").value("TECH"))
                .andExpect(jsonPath("$.data.status").value("PENDING"));

        // List should have 2 members
        MvcResult result = mockMvc.perform(get("/api/v1/members")
                        .header("Authorization", "Bearer " + token))
                .andReturn();
        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
        assertThat(data.size()).isEqualTo(2);
    }

    @Test
    @DisplayName("重复邀请 → 400 '该邮箱已在团队中'")
    void should_rejectDuplicateInvite() throws Exception {
        mockMvc.perform(post("/api/v1/members/invite")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("email", "dup@member.com", "role", "BUSINESS"))));

        mockMvc.perform(post("/api/v1/members/invite")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "dup@member.com", "role", "TECH"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("该邮箱已在团队中"));
    }

    @Test
    @DisplayName("移除成员（需 2FA 验证） → 200，列表减少一人")
    void should_removeMember() throws Exception {
        // Invite first
        MvcResult inviteResult = mockMvc.perform(post("/api/v1/members/invite")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("email", "rm@member.com", "role", "TECH"))))
                .andReturn();
        Long memberId = objectMapper.readTree(inviteResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // Prepare email verification code for the admin (no OTP bound)
        authRedis.saveEmailCode(adminUserId, "123456");

        mockMvc.perform(post("/api/v1/members/" + memberId + "/remove")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("emailCode", "123456"))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("移除自己 → 400 '无法移除自己的账号'")
    void should_rejectRemoveSelf() throws Exception {
        authRedis.saveEmailCode(adminUserId, "123456");

        mockMvc.perform(post("/api/v1/members/" + adminUserId + "/remove")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("emailCode", "123456"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("无法移除自己的账号"));
    }

    @Test
    @DisplayName("未认证 → 403")
    void should_return403() throws Exception {
        mockMvc.perform(get("/api/v1/members")).andExpect(status().isForbidden());
    }
}
