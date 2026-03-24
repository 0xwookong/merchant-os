package com.osl.pay.portal.controller.webhook;

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

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Webhook 配置接口")
class WebhookApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private MerchantUserMapper merchantUserMapper;
    @Autowired private MerchantMapper merchantMapper;
    @Autowired private OrderMapper orderMapper;
    @Autowired private KybApplicationMapper kybApplicationMapper;
    @Autowired private OnboardingApplicationMapper onboardingMapper;
    @Autowired private ApiCredentialMapper apiCredentialMapper;
    @Autowired private WebhookConfigMapper webhookConfigMapper;
    @Autowired private AuditLogMapper auditLogMapper;
    @Autowired private StringRedisTemplate redis;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        auditLogMapper.delete(null);
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

        token = registerVerifyAndLogin("wh@test.com", "Webhook Corp");
    }

    private String registerVerifyAndLogin(String email, String company) throws Exception {
        RegisterRequest reg = new RegisterRequest();
        reg.setEmail(email);
        reg.setPassword("Test1234");
        reg.setConfirmPassword("Test1234");
        reg.setCompanyName(company);
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
        login.setEmail(email);
        login.setPassword("Test1234");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    private Long createWebhook(String accessToken) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "url", "https://example.com/webhook",
                "events", List.of("order.created", "order.completed")));

        MvcResult result = mockMvc.perform(post("/api/v1/webhooks")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asLong();
    }

    @Nested
    @DisplayName("创建 Webhook")
    class Create {

        @Test
        @DisplayName("有效 URL + 事件 → 200，自动生成 secret")
        void should_createWithSecret() throws Exception {
            String body = objectMapper.writeValueAsString(Map.of(
                    "url", "https://example.com/webhook",
                    "events", List.of("order.created", "payment.success")));

            MvcResult result = mockMvc.perform(post("/api/v1/webhooks")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").exists())
                    .andExpect(jsonPath("$.data.url").value("https://example.com/webhook"))
                    .andExpect(jsonPath("$.data.secret").exists())
                    .andExpect(jsonPath("$.data.events").isArray())
                    .andReturn();

            String secret = objectMapper.readTree(result.getResponse().getContentAsString())
                    .path("data").path("secret").asText();
            assertThat(secret).startsWith("whsec_");
        }

        @Test
        @DisplayName("无效 URL → 400")
        void should_return400_when_invalidUrl() throws Exception {
            String body = objectMapper.writeValueAsString(Map.of(
                    "url", "not-a-url",
                    "events", List.of("order.created")));

            mockMvc.perform(post("/api/v1/webhooks")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("列表 + 更新 + 删除")
    class CRUD {

        @Test
        @DisplayName("列表返回当前商户的配置")
        void should_listConfigs() throws Exception {
            createWebhook(token);
            createWebhook(token);

            MvcResult result = mockMvc.perform(get("/api/v1/webhooks")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
            assertThat(data.size()).isEqualTo(2);
        }

        @Test
        @DisplayName("更新 URL 和事件 → 200")
        void should_update() throws Exception {
            Long id = createWebhook(token);

            String body = objectMapper.writeValueAsString(Map.of(
                    "url", "https://new-url.com/hook",
                    "events", List.of("kyc.approved")));

            mockMvc.perform(put("/api/v1/webhooks/" + id)
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.url").value("https://new-url.com/hook"));
        }

        @Test
        @DisplayName("删除后列表不包含")
        void should_delete() throws Exception {
            Long id = createWebhook(token);

            mockMvc.perform(delete("/api/v1/webhooks/" + id)
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk());

            assertThat(webhookConfigMapper.selectCount(null)).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("安全测试")
    class Security {

        @Test
        @DisplayName("未认证 → 403")
        void should_return403() throws Exception {
            mockMvc.perform(get("/api/v1/webhooks"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("租户隔离: 商户 A 不能删除商户 B 的配置")
        void should_isolateTenants() throws Exception {
            Long whId = createWebhook(token);

            String tokenB = registerVerifyAndLogin("wh2@test.com", "Other Corp");

            mockMvc.perform(delete("/api/v1/webhooks/" + whId)
                            .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isNotFound());
        }
    }
}
