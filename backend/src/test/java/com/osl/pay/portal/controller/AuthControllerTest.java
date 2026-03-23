package com.osl.pay.portal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.model.dto.RegisterRequest;
import com.osl.pay.portal.model.entity.MerchantUser;
import com.osl.pay.portal.repository.MerchantMapper;
import com.osl.pay.portal.repository.MerchantUserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MerchantUserMapper merchantUserMapper;

    @Autowired
    private MerchantMapper merchantMapper;

    @BeforeEach
    void cleanUp() {
        merchantUserMapper.delete(null);
        merchantMapper.delete(null);
    }

    private RegisterRequest validRequest() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("test@example.com");
        req.setPassword("Test1234");
        req.setConfirmPassword("Test1234");
        req.setCompanyName("Test Corp");
        req.setContactName("John Doe");
        return req;
    }

    @Test
    void registerSuccess() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.email").value("test@example.com"))
                .andExpect(jsonPath("$.data.merchantId").isNumber())
                .andExpect(jsonPath("$.data.userId").isNumber());

        // Verify DB state
        MerchantUser user = merchantUserMapper.selectList(null).get(0);
        assertThat(user.getEmail()).isEqualTo("test@example.com");
        assertThat(user.getEmailVerified()).isFalse();
        assertThat(user.getVerifyToken()).isNotBlank();
        assertThat(user.getMerchantId()).isNotNull();
    }

    @Test
    void registerDuplicateEmailSameCompany() throws Exception {
        // First registration
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));

        // Same email + same company → blocked
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(40002))
                .andExpect(jsonPath("$.message").value("该邮箱已在此公司下注册"));
    }

    @Test
    void registerSameEmailDifferentCompany() throws Exception {
        // First registration: Test Corp
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));

        // Same email, different company → allowed
        RegisterRequest req2 = validRequest();
        req2.setCompanyName("Another Corp");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));

        // Verify 2 merchants, 2 users
        assertThat(merchantMapper.selectCount(null)).isEqualTo(2);
        assertThat(merchantUserMapper.selectCount(null)).isEqualTo(2);
    }

    @Test
    void registerPasswordMismatch() throws Exception {
        RegisterRequest req = validRequest();
        req.setConfirmPassword("Different1");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(40001));
    }

    @Test
    void registerWeakPassword() throws Exception {
        RegisterRequest req = validRequest();
        req.setPassword("abcdefgh");
        req.setConfirmPassword("abcdefgh");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(40001));
    }

    @Test
    void verifyEmailSuccess() throws Exception {
        // Register first
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isOk());

        MerchantUser user = merchantUserMapper.selectList(null).get(0);
        String token = user.getVerifyToken();

        // Verify email
        mockMvc.perform(get("/api/v1/auth/verify-email").param("token", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));

        // Check DB
        MerchantUser verified = merchantUserMapper.selectById(user.getId());
        assertThat(verified.getEmailVerified()).isTrue();
        assertThat(verified.getVerifyToken()).isNull();
    }

    @Test
    void verifyEmailInvalidToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/verify-email").param("token", "invalid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(40003));
    }

    @Test
    void registerMissingFields() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40000));
    }
}
