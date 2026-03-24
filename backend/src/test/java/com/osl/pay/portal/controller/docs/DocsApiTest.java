package com.osl.pay.portal.controller.docs;

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

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("API 文档引擎接口")
class DocsApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private MerchantUserMapper merchantUserMapper;
    @Autowired private MerchantMapper merchantMapper;
    @Autowired private OrderMapper orderMapper;
    @Autowired private KybApplicationMapper kybApplicationMapper;
    @Autowired private OnboardingApplicationMapper onboardingMapper;
    @Autowired private ApiCredentialMapper apiCredentialMapper;
    @Autowired private AuditLogMapper auditLogMapper;
    @Autowired private StringRedisTemplate redis;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        auditLogMapper.delete(null);
        kybApplicationMapper.delete(null);
        onboardingMapper.delete(null);
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
        reg.setEmail("docs@test.com");
        reg.setPassword("Test1234");
        reg.setConfirmPassword("Test1234");
        reg.setCompanyName("Docs Test Corp");
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
        login.setEmail("docs@test.com");
        login.setPassword("Test1234");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Nested
    @DisplayName("端点列表")
    class ListEndpoints {

        @Test
        @DisplayName("获取全部端点 → 200，返回 categories 和 endpoints")
        void should_returnAllEndpoints() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/v1/docs/endpoints")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0))
                    .andExpect(jsonPath("$.data.categories").isArray())
                    .andExpect(jsonPath("$.data.endpoints").isArray())
                    .andReturn();

            JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
            assertThat(data.path("categories").size()).isGreaterThanOrEqualTo(6);
            assertThat(data.path("endpoints").size()).isGreaterThanOrEqualTo(14);
        }

        @Test
        @DisplayName("按分类筛选 → 仅返回对应分类的端点")
        void should_filterByCategory() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/v1/docs/endpoints")
                            .header("Authorization", "Bearer " + token)
                            .param("category", "order"))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode endpoints = objectMapper.readTree(result.getResponse().getContentAsString())
                    .path("data").path("endpoints");
            assertThat(endpoints.size()).isEqualTo(3);
            for (JsonNode ep : endpoints) {
                assertThat(ep.path("category").asText()).isEqualTo("order");
            }
        }
    }

    @Nested
    @DisplayName("端点详情")
    class GetDetail {

        @Test
        @DisplayName("有效 operationId → 200，返回完整详情 + AI Context Block")
        void should_returnDetail_when_validOperationId() throws Exception {
            mockMvc.perform(get("/api/v1/docs/endpoints/createOrder")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0))
                    .andExpect(jsonPath("$.data.operationId").value("createOrder"))
                    .andExpect(jsonPath("$.data.method").value("POST"))
                    .andExpect(jsonPath("$.data.path").value("/api/v1/orders"))
                    .andExpect(jsonPath("$.data.summary").exists())
                    .andExpect(jsonPath("$.data.description").exists())
                    .andExpect(jsonPath("$.data.parameters").isArray())
                    .andExpect(jsonPath("$.data.requestBody").exists())
                    .andExpect(jsonPath("$.data.responses").exists())
                    .andExpect(jsonPath("$.data.aiContextBlock").exists());
        }

        @Test
        @DisplayName("AI Context Block 包含结构化内容")
        void should_containStructuredAiContext() throws Exception {
            MvcResult result = mockMvc.perform(get("/api/v1/docs/endpoints/getQuote")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn();

            String aiBlock = objectMapper.readTree(result.getResponse().getContentAsString())
                    .path("data").path("aiContextBlock").asText();
            assertThat(aiBlock).contains("## API Endpoint:");
            assertThat(aiBlock).contains("**Method**:");
            assertThat(aiBlock).contains("**Path**:");
            assertThat(aiBlock).contains("### Authentication");
            assertThat(aiBlock).contains("SHA256withRSA");
        }

        @Test
        @DisplayName("不存在的 operationId → 404")
        void should_return404_when_notFound() throws Exception {
            mockMvc.perform(get("/api/v1/docs/endpoints/nonExistentEndpoint")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message").value("端点不存在"));
        }
    }

    @Nested
    @DisplayName("安全测试")
    class Security {

        @Test
        @DisplayName("未认证访问端点列表 → 403")
        void should_return403_when_noAuth() throws Exception {
            mockMvc.perform(get("/api/v1/docs/endpoints"))
                    .andExpect(status().isForbidden());
        }
    }
}
