package com.osl.pay.portal.controller.developer;

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
    @Autowired private KybApplicationMapper kybApplicationMapper;
    @Autowired private OnboardingApplicationMapper onboardingMapper;
    @Autowired private ApiCredentialMapper apiCredentialMapper;
    @Autowired private WebhookConfigMapper webhookConfigMapper;
    @Autowired private WebhookLogMapper webhookLogMapper;
    @Autowired private DomainWhitelistMapper domainWhitelistMapper;
    @Autowired private AuditLogMapper auditLogMapper;
    @Autowired private StringRedisTemplate redis;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        auditLogMapper.delete(null);
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

        token = registerVerifyAndLogin();
    }

    private String registerVerifyAndLogin() throws Exception {
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
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Test
    @DisplayName("添加域名 → 200，返回 id + domain")
    void should_addDomain() throws Exception {
        mockMvc.perform(post("/api/v1/domains")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("domain", "https://example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.domain").value("https://example.com"));
    }

    @Test
    @DisplayName("重复添加 → 400 '该域名已存在'")
    void should_reject_duplicate() throws Exception {
        mockMvc.perform(post("/api/v1/domains")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("domain", "https://dup.com"))));

        mockMvc.perform(post("/api/v1/domains")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("domain", "https://dup.com"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("该域名已存在"));
    }

    @Test
    @DisplayName("无效格式（无协议）→ 400")
    void should_reject_noProtocol() throws Exception {
        mockMvc.perform(post("/api/v1/domains")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("domain", "example.com"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("列表 + 删除")
    void should_listAndDelete() throws Exception {
        // Add
        MvcResult addResult = mockMvc.perform(post("/api/v1/domains")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("domain", "https://list.com"))))
                .andReturn();
        Long id = objectMapper.readTree(addResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // List
        mockMvc.perform(get("/api/v1/domains").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].domain").value("https://list.com"));

        // Delete
        mockMvc.perform(delete("/api/v1/domains/" + id).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        assertThat(domainWhitelistMapper.selectCount(null)).isEqualTo(0);
    }

    @Test
    @DisplayName("未认证 → 403")
    void should_return403() throws Exception {
        mockMvc.perform(get("/api/v1/domains")).andExpect(status().isForbidden());
    }
}
