package com.osl.pay.portal.mcp;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("MCP Server 接口")
class McpApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Test
    @DisplayName("工具列表 → 200，返回 6 个工具定义（无需认证）")
    void should_returnToolList_withoutAuth() throws Exception {
        mockMvc.perform(get("/api/v1/mcp/tools"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(6))
                .andExpect(jsonPath("$.data[0].name").value("oslpay_get_quote"))
                .andExpect(jsonPath("$.data[0].inputSchema").exists());
    }

    @Test
    @DisplayName("获取报价工具 → 返回 quoteId 和 exchangeRate")
    void should_executeGetQuote() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "name", "oslpay_get_quote",
                "arguments", Map.of("fiatCurrency", "USD", "fiatAmount", 100, "cryptoCurrency", "USDT")));

        mockMvc.perform(post("/api/v1/mcp/tools/call")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.result.quoteId").exists())
                .andExpect(jsonPath("$.data.result.exchangeRate").exists());
    }

    @Test
    @DisplayName("生成签名工具 → 返回 signature 和 timestamp")
    void should_executeGenerateSignature() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "name", "oslpay_generate_signature",
                "arguments", Map.of("appId", "test_app_001")));

        mockMvc.perform(post("/api/v1/mcp/tools/call")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.result.signature").exists())
                .andExpect(jsonPath("$.data.result.timestamp").exists());
    }

    @Test
    @DisplayName("获取货币列表工具 → 返回 fiatCurrencies 和 cryptoCurrencies")
    void should_executeGetCurrencyList() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("name", "oslpay_get_currency_list"));

        mockMvc.perform(post("/api/v1/mcp/tools/call")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.result.fiatCurrencies").isArray())
                .andExpect(jsonPath("$.data.result.cryptoCurrencies").isArray());
    }

    @Test
    @DisplayName("获取指南工具 → 返回 steps 数组")
    void should_executeGetGuide() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("name", "oslpay_get_guide"));

        mockMvc.perform(post("/api/v1/mcp/tools/call")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.result.steps").isArray());
    }

    @Test
    @DisplayName("未知工具 → success=false，返回错误信息")
    void should_failForUnknownTool() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("name", "unknown_tool"));

        mockMvc.perform(post("/api/v1/mcp/tools/call")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.success").value(false))
                .andExpect(jsonPath("$.data.error").value("Unknown tool: unknown_tool"));
    }

    @Test
    @DisplayName("创建订单缺少参数 → success=false，提示 quoteId required")
    void should_failCreateOrder_withoutQuoteId() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "name", "oslpay_create_order",
                "arguments", Map.of("walletAddress", "0x123")));

        mockMvc.perform(post("/api/v1/mcp/tools/call")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.success").value(false))
                .andExpect(jsonPath("$.data.error").value("quoteId is required. Get one from oslpay_get_quote first."));
    }
}
