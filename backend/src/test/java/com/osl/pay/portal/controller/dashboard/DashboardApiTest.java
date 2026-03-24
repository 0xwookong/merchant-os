package com.osl.pay.portal.controller.dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.model.dto.LoginRequest;
import com.osl.pay.portal.model.dto.RegisterRequest;
import com.osl.pay.portal.repository.ApiCredentialMapper;
import com.osl.pay.portal.repository.AuditLogMapper;
import com.osl.pay.portal.repository.MerchantMapper;
import com.osl.pay.portal.repository.OrderMapper;
import com.osl.pay.portal.repository.MerchantUserMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("仪表盘指标接口")
class DashboardApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private MerchantUserMapper merchantUserMapper;
    @Autowired private MerchantMapper merchantMapper;
    @Autowired private OrderMapper orderMapper;
    @Autowired private ApiCredentialMapper apiCredentialMapper;
    @Autowired private AuditLogMapper auditLogMapper;
    @Autowired private StringRedisTemplate redis;

    @BeforeEach
    void cleanUp() {
        auditLogMapper.delete(null);
        apiCredentialMapper.delete(null);
        orderMapper.delete(null);
        merchantUserMapper.delete(null);
        merchantMapper.delete(null);
        Set<String> keys = redis.keys("auth:*");
        if (keys != null && !keys.isEmpty()) redis.delete(keys);
        Set<String> rateKeys = redis.keys("rate:*");
        if (rateKeys != null && !rateKeys.isEmpty()) redis.delete(rateKeys);
    }

    private String registerVerifyAndLogin() throws Exception {
        RegisterRequest reg = new RegisterRequest();
        reg.setEmail("dash@test.com");
        reg.setPassword("Test1234");
        reg.setConfirmPassword("Test1234");
        reg.setCompanyName("Dashboard Corp");
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
        login.setEmail("dash@test.com");
        login.setPassword("Test1234");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Nested
    @DisplayName("查询指标")
    class GetMetrics {

        @Test
        @DisplayName("默认 range=7d → 返回 4 个指标卡片，range=7d")
        void should_returnMetrics_when_defaultRange() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(get("/api/v1/dashboard/metrics")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.range").value("7d"))
                    .andExpect(jsonPath("$.data.metrics").isArray())
                    .andExpect(jsonPath("$.data.metrics.length()").value(4))
                    .andExpect(jsonPath("$.data.metrics[0].key").value("totalAmount"))
                    .andExpect(jsonPath("$.data.metrics[0].label").value("交易总额"))
                    .andExpect(jsonPath("$.data.metrics[0].value").isNotEmpty())
                    .andExpect(jsonPath("$.data.metrics[0].changeRate").isNumber());
        }

        @Test
        @DisplayName("range=today → 返回今日指标数据")
        void should_returnTodayMetrics_when_rangeToday() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(get("/api/v1/dashboard/metrics")
                            .header("Authorization", "Bearer " + token)
                            .param("range", "today"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.range").value("today"));
        }

        @Test
        @DisplayName("range=30d → 返回 30 天指标数据")
        void should_return30dMetrics_when_range30d() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(get("/api/v1/dashboard/metrics")
                            .header("Authorization", "Bearer " + token)
                            .param("range", "30d"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.range").value("30d"));
        }

        @Test
        @DisplayName("range 非法值 → 降级为 7d")
        void should_fallbackTo7d_when_invalidRange() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(get("/api/v1/dashboard/metrics")
                            .header("Authorization", "Bearer " + token)
                            .param("range", "invalid"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.range").value("7d"));
        }

        @Test
        @DisplayName("未认证 → HTTP 403")
        void should_return403_when_noAuth() throws Exception {
            mockMvc.perform(get("/api/v1/dashboard/metrics"))
                    .andExpect(status().isForbidden());
        }
    }
}
