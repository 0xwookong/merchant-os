package com.osl.pay.portal.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("健康检查 + 环境切换接口")
class HealthApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Nested
    @DisplayName("健康检查")
    class Health {

        @Test
        @DisplayName("无认证访问 /api/v1/health → 返回 200 和成功响应")
        void should_returnOk_when_noAuth() throws Exception {
            mockMvc.perform(get("/api/v1/health"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0))
                    .andExpect(jsonPath("$.data.status").value("running"));
        }

        @Test
        @DisplayName("带 JWT 访问 /api/v1/health → 同样返回 200")
        void should_returnOk_when_withAuth() throws Exception {
            mockMvc.perform(get("/api/v1/health")
                            .header("Authorization", "Bearer fake-token"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0));
        }
    }

    @Nested
    @DisplayName("环境切换 — X-Environment 请求头")
    class EnvironmentSwitch {

        @Test
        @DisplayName("不带 X-Environment 头 → 默认返回 sandbox（安全默认值）")
        void should_defaultToSandbox_when_noHeader() throws Exception {
            mockMvc.perform(get("/api/v1/health"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.environment").value("sandbox"));
        }

        @Test
        @DisplayName("X-Environment: production → 返回 production")
        void should_returnProduction_when_headerIsProduction() throws Exception {
            mockMvc.perform(get("/api/v1/health")
                            .header("X-Environment", "production"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.environment").value("production"));
        }

        @Test
        @DisplayName("X-Environment: sandbox → 返回 sandbox")
        void should_returnSandbox_when_headerIsSandbox() throws Exception {
            mockMvc.perform(get("/api/v1/health")
                            .header("X-Environment", "sandbox"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.environment").value("sandbox"));
        }

        @Test
        @DisplayName("X-Environment 值非法（random）→ 降级为 sandbox")
        void should_fallbackToSandbox_when_invalidValue() throws Exception {
            mockMvc.perform(get("/api/v1/health")
                            .header("X-Environment", "invalid-env"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.environment").value("sandbox"));
        }

        @Test
        @DisplayName("连续两个请求不同环境 → 各自独立（ThreadLocal 正确隔离）")
        void should_isolateBetweenRequests() throws Exception {
            mockMvc.perform(get("/api/v1/health")
                            .header("X-Environment", "production"))
                    .andExpect(jsonPath("$.data.environment").value("production"));

            // Second request without header → should be sandbox, not carry over production
            mockMvc.perform(get("/api/v1/health"))
                    .andExpect(jsonPath("$.data.environment").value("sandbox"));
        }
    }
}
