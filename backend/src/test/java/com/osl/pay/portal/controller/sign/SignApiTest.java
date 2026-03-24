package com.osl.pay.portal.controller.sign;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.model.dto.*;
import com.osl.pay.portal.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("签名工具接口")
class SignApiTest {

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

    private String token;
    private String testPublicKeyPem;
    private String testPrivateKeyPem;

    @BeforeEach
    void setUp() throws Exception {
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

        token = registerVerifyAndLogin();
        generateTestKeyPair();
    }

    private String registerVerifyAndLogin() throws Exception {
        RegisterRequest reg = new RegisterRequest();
        reg.setEmail("sign@test.com");
        reg.setPassword("Test1234");
        reg.setConfirmPassword("Test1234");
        reg.setCompanyName("Sign Test Corp");
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
        login.setEmail("sign@test.com");
        login.setPassword("Test1234");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    private void generateTestKeyPair() throws Exception {
        KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
        gen.initialize(2048);
        KeyPair pair = gen.generateKeyPair();

        String pubBase64 = Base64.getMimeEncoder(64, "\n".getBytes())
                .encodeToString(pair.getPublic().getEncoded());
        testPublicKeyPem = "-----BEGIN PUBLIC KEY-----\n" + pubBase64 + "\n-----END PUBLIC KEY-----";

        String privBase64 = Base64.getMimeEncoder(64, "\n".getBytes())
                .encodeToString(pair.getPrivate().getEncoded());
        testPrivateKeyPem = "-----BEGIN PRIVATE KEY-----\n" + privBase64 + "\n-----END PRIVATE KEY-----";
    }

    @Nested
    @DisplayName("生成签名")
    class Generate {

        @Test
        @DisplayName("有效私钥 + appId + timestamp → 200，返回签名字符串和 Base64 签名")
        void should_generateSignature_when_validInput() throws Exception {
            SignGenerateRequest req = new SignGenerateRequest();
            req.setAppId("demo_app_001");
            req.setTimestamp("1711234567");
            req.setPrivateKey(testPrivateKeyPem);

            MvcResult result = mockMvc.perform(post("/api/v1/sign/generate")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0))
                    .andExpect(jsonPath("$.data.signatureString").value("appId=demo_app_001&timestamp=1711234567"))
                    .andExpect(jsonPath("$.data.signature").exists())
                    .andExpect(jsonPath("$.data.headerValue").exists())
                    .andReturn();

            String sig = objectMapper.readTree(result.getResponse().getContentAsString())
                    .path("data").path("signature").asText();
            assertThat(sig).isNotBlank();
            // Verify it's valid Base64
            assertThat(Base64.getDecoder().decode(sig)).isNotEmpty();
        }

        @Test
        @DisplayName("无效私钥格式 → 400，明确错误消息")
        void should_return400_when_invalidPrivateKey() throws Exception {
            SignGenerateRequest req = new SignGenerateRequest();
            req.setAppId("demo_app_001");
            req.setTimestamp("1711234567");
            req.setPrivateKey("not-a-valid-key");

            mockMvc.perform(post("/api/v1/sign/generate")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("私钥格式错误，请使用 PKCS#8 PEM 格式"));
        }

        @Test
        @DisplayName("appId 为空 → 400")
        void should_return400_when_missingAppId() throws Exception {
            SignGenerateRequest req = new SignGenerateRequest();
            req.setAppId("");
            req.setTimestamp("1711234567");
            req.setPrivateKey(testPrivateKeyPem);

            mockMvc.perform(post("/api/v1/sign/generate")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("验证签名")
    class Verify {

        @Test
        @DisplayName("正确签名 → valid=true")
        void should_returnValid_when_correctSignature() throws Exception {
            // First generate a signature
            SignGenerateRequest genReq = new SignGenerateRequest();
            genReq.setAppId("demo_app_001");
            genReq.setTimestamp("1711234567");
            genReq.setPrivateKey(testPrivateKeyPem);

            MvcResult genResult = mockMvc.perform(post("/api/v1/sign/generate")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(genReq)))
                    .andReturn();

            String signature = objectMapper.readTree(genResult.getResponse().getContentAsString())
                    .path("data").path("signature").asText();

            // Now verify it
            SignVerifyRequest verReq = new SignVerifyRequest();
            verReq.setAppId("demo_app_001");
            verReq.setTimestamp("1711234567");
            verReq.setSignature(signature);
            verReq.setPublicKey(testPublicKeyPem);

            mockMvc.perform(post("/api/v1/sign/verify")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(verReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.valid").value(true))
                    .andExpect(jsonPath("$.data.signatureString").value("appId=demo_app_001&timestamp=1711234567"));
        }

        @Test
        @DisplayName("错误签名 → valid=false")
        void should_returnInvalid_when_wrongSignature() throws Exception {
            SignVerifyRequest req = new SignVerifyRequest();
            req.setAppId("demo_app_001");
            req.setTimestamp("1711234567");
            req.setSignature(Base64.getEncoder().encodeToString("fake-signature".getBytes()));
            req.setPublicKey(testPublicKeyPem);

            mockMvc.perform(post("/api/v1/sign/verify")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.valid").value(false));
        }

        @Test
        @DisplayName("无效公钥格式 → 400")
        void should_return400_when_invalidPublicKey() throws Exception {
            SignVerifyRequest req = new SignVerifyRequest();
            req.setAppId("demo_app_001");
            req.setTimestamp("1711234567");
            req.setSignature("dGVzdA==");
            req.setPublicKey("invalid-public-key");

            mockMvc.perform(post("/api/v1/sign/verify")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("公钥格式错误，请使用 X.509 PEM 格式"));
        }
    }

    @Nested
    @DisplayName("加密数据")
    class Encrypt {

        @Test
        @DisplayName("有效公钥 + 明文 → 200，返回 Base64 密文")
        void should_encrypt_when_validInput() throws Exception {
            EncryptRequest req = new EncryptRequest();
            req.setPlaintext("Hello OSLpay!");
            req.setPublicKey(testPublicKeyPem);

            MvcResult result = mockMvc.perform(post("/api/v1/sign/encrypt")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(0))
                    .andExpect(jsonPath("$.data.ciphertext").exists())
                    .andReturn();

            String ciphertext = objectMapper.readTree(result.getResponse().getContentAsString())
                    .path("data").path("ciphertext").asText();
            assertThat(ciphertext).isNotBlank();
            assertThat(Base64.getDecoder().decode(ciphertext)).isNotEmpty();
        }

        @Test
        @DisplayName("无效公钥格式 → 400")
        void should_return400_when_invalidPublicKey() throws Exception {
            EncryptRequest req = new EncryptRequest();
            req.setPlaintext("Hello");
            req.setPublicKey("not-a-key");

            mockMvc.perform(post("/api/v1/sign/encrypt")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("安全测试")
    class Security {

        @Test
        @DisplayName("未认证访问 → 403")
        void should_return403_when_noAuth() throws Exception {
            mockMvc.perform(post("/api/v1/sign/generate")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isForbidden());
        }
    }
}
