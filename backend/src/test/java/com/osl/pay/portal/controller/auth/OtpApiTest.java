package com.osl.pay.portal.controller.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.model.dto.LoginRequest;
import com.osl.pay.portal.model.dto.RegisterRequest;
import com.osl.pay.portal.repository.*;
import com.osl.pay.portal.security.TotpService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("OTP 与邮件验证码接口")
class OtpApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private MerchantUserMapper merchantUserMapper;
    @Autowired private MerchantMapper merchantMapper;
    @Autowired private OrderMapper orderMapper;
    @Autowired private KybApplicationMapper kybApplicationMapper;
    @Autowired private OnboardingApplicationMapper onboardingMapper;
    @Autowired private ApiCredentialMapper apiCredentialMapper;
    @Autowired private AuditLogMapper auditLogMapper;
    @Autowired private ApiRequestLogMapper apiRequestLogMapper;
    @Autowired private WebhookLogMapper webhookLogMapper;
    @Autowired private DomainWhitelistMapper domainWhitelistMapper;
    @Autowired private WebhookConfigMapper webhookConfigMapper;
    @Autowired private StringRedisTemplate redis;
    @Autowired private TotpService totpService;

    @BeforeEach
    void cleanUp() {
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
        merchantMapper.delete(null);
        Set<String> keys = redis.keys("auth:*");
        if (keys != null && !keys.isEmpty()) redis.delete(keys);
        Set<String> rateKeys = redis.keys("rate:*");
        if (rateKeys != null && !rateKeys.isEmpty()) redis.delete(rateKeys);
    }

    private String registerVerifyAndLogin() throws Exception {
        RegisterRequest reg = new RegisterRequest();
        reg.setEmail("otp@test.com");
        reg.setPassword("Test1234");
        reg.setConfirmPassword("Test1234");
        reg.setCompanyName("OTP Test Corp");
        reg.setContactName("OTP User");
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)));

        Set<String> verifyKeys = redis.keys("auth:verify:*");
        for (String key : verifyKeys) {
            mockMvc.perform(get("/api/v1/auth/verify-email")
                    .param("token", key.replace("auth:verify:", "")));
        }

        LoginRequest login = new LoginRequest();
        login.setEmail("otp@test.com");
        login.setPassword("Test1234");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Nested
    @DisplayName("OTP 绑定流程")
    class OtpBinding {

        @Test
        @DisplayName("setup → 返回 secret 和 otpauth URI")
        void should_returnSecretAndUri_when_setup() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(post("/api/v1/security/otp/setup")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0))
                    .andExpect(jsonPath("$.data.secret").exists())
                    .andExpect(jsonPath("$.data.otpAuthUri").value(org.hamcrest.Matchers.startsWith("otpauth://totp/")));
        }

        @Test
        @DisplayName("setup → verify-bind(正确码) → otp_enabled 变为 true")
        void should_bindOtp_when_correctCode() throws Exception {
            String token = registerVerifyAndLogin();

            // Setup
            MvcResult setupResult = mockMvc.perform(post("/api/v1/security/otp/setup")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn();

            String secret = objectMapper.readTree(setupResult.getResponse().getContentAsString())
                    .path("data").path("secret").asText();

            // Generate valid TOTP code
            String validCode = generateValidCode(secret);

            // Bind
            mockMvc.perform(post("/api/v1/security/otp/verify-bind")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"code\":\"" + validCode + "\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0));

            // Verify status
            mockMvc.perform(get("/api/v1/security/otp/status")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.otpEnabled").value(true));
        }

        @Test
        @DisplayName("verify-bind(错误码) → 400 错误，otp_enabled 不变")
        void should_rejectBind_when_wrongCode() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(post("/api/v1/security/otp/setup")
                    .header("Authorization", "Bearer " + token));

            mockMvc.perform(post("/api/v1/security/otp/verify-bind")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"code\":\"000000\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40000));

            // Still not enabled
            mockMvc.perform(get("/api/v1/security/otp/status")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(jsonPath("$.data.otpEnabled").value(false));
        }

        @Test
        @DisplayName("已绑定用户重复 setup → 400 错误")
        void should_rejectSetup_when_alreadyBound() throws Exception {
            String token = registerVerifyAndLogin();

            // Bind first
            MvcResult setupResult = mockMvc.perform(post("/api/v1/security/otp/setup")
                            .header("Authorization", "Bearer " + token))
                    .andReturn();
            String secret = objectMapper.readTree(setupResult.getResponse().getContentAsString())
                    .path("data").path("secret").asText();
            String validCode = generateValidCode(secret);
            mockMvc.perform(post("/api/v1/security/otp/verify-bind")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"code\":\"" + validCode + "\"}"));

            // Try setup again
            mockMvc.perform(post("/api/v1/security/otp/setup")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40000));
        }
    }

    @Nested
    @DisplayName("OTP 解绑流程")
    class OtpUnbinding {

        @Test
        @DisplayName("unbind(正确码) → otp_enabled 变为 false")
        void should_unbind_when_correctCode() throws Exception {
            String token = registerVerifyAndLogin();

            // Bind first
            MvcResult setupResult = mockMvc.perform(post("/api/v1/security/otp/setup")
                            .header("Authorization", "Bearer " + token))
                    .andReturn();
            String secret = objectMapper.readTree(setupResult.getResponse().getContentAsString())
                    .path("data").path("secret").asText();
            String validCode = generateValidCode(secret);
            mockMvc.perform(post("/api/v1/security/otp/verify-bind")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"code\":\"" + validCode + "\"}"));

            // Unbind with fresh code
            String unbindCode = generateValidCode(secret);
            mockMvc.perform(post("/api/v1/security/otp/unbind")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"code\":\"" + unbindCode + "\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0));

            // Verify status
            mockMvc.perform(get("/api/v1/security/otp/status")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(jsonPath("$.data.otpEnabled").value(false));
        }

        @Test
        @DisplayName("未绑定用户 unbind → 400 错误")
        void should_rejectUnbind_when_notBound() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(post("/api/v1/security/otp/unbind")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"code\":\"123456\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40000));
        }
    }

    @Nested
    @DisplayName("邮件验证码")
    class EmailCode {

        @Test
        @DisplayName("发送验证码 → 成功返回")
        void should_sendCode_when_requested() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(post("/api/v1/security/email-code/send")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0));
        }

        @Test
        @DisplayName("重复发送 → 429 频率限制")
        void should_rateLimit_when_sendTwice() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(post("/api/v1/security/email-code/send")
                    .header("Authorization", "Bearer " + token));

            mockMvc.perform(post("/api/v1/security/email-code/send")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isTooManyRequests())
                    .andExpect(jsonPath("$.code").value(42900));
        }

        @Test
        @DisplayName("错误验证码 → 400 错误")
        void should_rejectVerify_when_wrongCode() throws Exception {
            String token = registerVerifyAndLogin();

            mockMvc.perform(post("/api/v1/security/email-code/send")
                    .header("Authorization", "Bearer " + token));

            mockMvc.perform(post("/api/v1/security/email-code/verify")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"code\":\"000000\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40000));
        }
    }

    @Nested
    @DisplayName("安全测试")
    class Security {

        @Test
        @DisplayName("未认证访问 → 403")
        void should_return403_when_noAuth() throws Exception {
            mockMvc.perform(get("/api/v1/security/otp/status"))
                    .andExpect(status().isForbidden());

            mockMvc.perform(post("/api/v1/security/otp/setup"))
                    .andExpect(status().isForbidden());

            mockMvc.perform(post("/api/v1/security/email-code/send"))
                    .andExpect(status().isForbidden());
        }
    }

    /**
     * Generate a valid TOTP code for testing. Uses TotpService directly.
     */
    private String generateValidCode(String secret) {
        // Use reflection or direct TOTP computation
        // For simplicity, we use the same TotpService logic
        long timeStep = System.currentTimeMillis() / 1000 / 30;
        byte[] keyBytes = base32Decode(secret);
        return generateCode(keyBytes, timeStep);
    }

    private String generateCode(byte[] keyBytes, long timeStep) {
        byte[] timeBytes = new byte[8];
        for (int i = 7; i >= 0; i--) {
            timeBytes[i] = (byte) (timeStep & 0xFF);
            timeStep >>= 8;
        }
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA1");
            mac.init(new javax.crypto.spec.SecretKeySpec(keyBytes, "HmacSHA1"));
            byte[] hash = mac.doFinal(timeBytes);
            int offset = hash[hash.length - 1] & 0x0F;
            int truncated = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);
            int otp = truncated % 1_000_000;
            return String.format("%06d", otp);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private byte[] base32Decode(String encoded) {
        encoded = encoded.toUpperCase().replaceAll("[^A-Z2-7]", "");
        int outLen = encoded.length() * 5 / 8;
        byte[] result = new byte[outLen];
        int buffer = 0, bitsLeft = 0, index = 0;
        for (char c : encoded.toCharArray()) {
            int val = (c >= 'A' && c <= 'Z') ? c - 'A' : c - '2' + 26;
            buffer = (buffer << 5) | val;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                result[index++] = (byte) (buffer >> (bitsLeft - 8));
                bitsLeft -= 8;
            }
        }
        return result;
    }
}
