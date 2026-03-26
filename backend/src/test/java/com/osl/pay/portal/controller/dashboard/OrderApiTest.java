package com.osl.pay.portal.controller.dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.model.dto.LoginRequest;
import com.osl.pay.portal.model.dto.RegisterRequest;
import com.osl.pay.portal.model.entity.Order;
import com.osl.pay.portal.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("订单列表接口")
class OrderApiTest {

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
    @Autowired private WebhookConfigMapper webhookConfigMapper;
    @Autowired private MerchantApplicationMapper merchantApplicationMapper;
    @Autowired private ApplicationDocumentMapper applicationDocumentMapper;
    @Autowired private StringRedisTemplate redis;

    private Long merchantId;

    @BeforeEach
    void cleanUp() throws Exception {
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
    }

    private String registerVerifyLoginAndSeedOrders() throws Exception {
        RegisterRequest reg = new RegisterRequest();
        reg.setEmail("order@test.com");
        reg.setPassword("Test1234");
        reg.setConfirmPassword("Test1234");
        reg.setCompanyName("Order Corp");
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
        login.setEmail("order@test.com");
        login.setPassword("Test1234");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn();
        String token = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
        merchantId = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("merchantId").asLong();

        // Seed 3 orders
        seedOrder("ORD001", 100.00, "USD", "CARD", "COMPLETED");
        seedOrder("ORD002", 250.00, "EUR", "GOOGLEPAY", "PROCESSING");
        seedOrder("ORD003", 50.00, "USD", "CARD", "FAILED");

        return token;
    }

    private void seedOrder(String orderNo, double amount, String currency,
                           String paymentMethod, String status) {
        Order order = new Order();
        order.setMerchantId(merchantId);
        order.setOrderNo(orderNo);
        order.setFiatAmount(BigDecimal.valueOf(amount));
        order.setFiatCurrency(currency);
        order.setPaymentMethod(paymentMethod);
        order.setStatus(status);
        order.setCreatedAt(java.time.LocalDateTime.now());
        orderMapper.insert(order);
    }

    @Nested
    @DisplayName("订单列表查询")
    class ListOrders {

        @Test
        @DisplayName("无筛选 → 返回全部订单，分页格式正确")
        void should_returnAllOrders_when_noFilter() throws Exception {
            String token = registerVerifyLoginAndSeedOrders();

            mockMvc.perform(get("/api/v1/orders")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.total").value(3))
                    .andExpect(jsonPath("$.data.page").value(1))
                    .andExpect(jsonPath("$.data.pageSize").value(20))
                    .andExpect(jsonPath("$.data.list").isArray())
                    .andExpect(jsonPath("$.data.list.length()").value(3));
        }

        @Test
        @DisplayName("按状态筛选 status=COMPLETED → 只返回 COMPLETED 订单")
        void should_filterByStatus_when_statusProvided() throws Exception {
            String token = registerVerifyLoginAndSeedOrders();

            mockMvc.perform(get("/api/v1/orders")
                            .header("Authorization", "Bearer " + token)
                            .param("status", "COMPLETED"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.total").value(1))
                    .andExpect(jsonPath("$.data.list[0].status").value("COMPLETED"));
        }

        @Test
        @DisplayName("按支付方式筛选 paymentMethod=CARD → 只返回 CARD 订单")
        void should_filterByPaymentMethod() throws Exception {
            String token = registerVerifyLoginAndSeedOrders();

            mockMvc.perform(get("/api/v1/orders")
                            .header("Authorization", "Bearer " + token)
                            .param("paymentMethod", "CARD"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.total").value(2));
        }

        @Test
        @DisplayName("分页 page=1&pageSize=2 → 返回 2 条，total 仍为 3")
        void should_paginate() throws Exception {
            String token = registerVerifyLoginAndSeedOrders();

            mockMvc.perform(get("/api/v1/orders")
                            .header("Authorization", "Bearer " + token)
                            .param("page", "1")
                            .param("pageSize", "2"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.total").value(3))
                    .andExpect(jsonPath("$.data.list.length()").value(2))
                    .andExpect(jsonPath("$.data.pageSize").value(2));
        }

        @Test
        @DisplayName("未认证 → HTTP 403")
        void should_return403_when_noAuth() throws Exception {
            mockMvc.perform(get("/api/v1/orders"))
                    .andExpect(status().isForbidden());
        }
    }
}
