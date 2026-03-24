package com.osl.pay.portal.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("健康检查接口")
class HealthApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("无认证访问 /api/v1/health → 返回 200 和成功响应")
    void should_returnOk_when_noAuth() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data").isString());
    }

    @Test
    @DisplayName("带 JWT 访问 /api/v1/health → 同样返回 200（公开端点不拒绝认证请求）")
    void should_returnOk_when_withAuth() throws Exception {
        mockMvc.perform(get("/api/v1/health")
                        .header("Authorization", "Bearer fake-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }
}
