package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.osl.pay.portal.common.context.EnvironmentContext;
import com.osl.pay.portal.model.dto.CredentialResponse;
import com.osl.pay.portal.model.entity.ApiCredential;
import com.osl.pay.portal.repository.ApiCredentialMapper;
import com.osl.pay.portal.service.CredentialService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CredentialServiceImpl implements CredentialService {

    private final ApiCredentialMapper credentialMapper;

    @Value("${oslpay.api.production-url:https://openapi.osl-pay.com}")
    private String productionUrl;

    @Value("${oslpay.api.sandbox-url:https://openapitest.osl-pay.com}")
    private String sandboxUrl;

    @Override
    @Transactional
    public CredentialResponse getCredentials(Long merchantId) {
        ApiCredential credential = credentialMapper.selectOne(
                new LambdaQueryWrapper<ApiCredential>()
                        .eq(ApiCredential::getMerchantId, merchantId));

        if (credential == null) {
            credential = generateCredentials(merchantId);
            log.info("Generated API credentials for merchant={}, appId={}", merchantId, credential.getAppId());
        }

        return toResponse(credential);
    }

    private ApiCredential generateCredentials(Long merchantId) {
        KeyPair apiKeyPair = generateRsaKeyPair();
        KeyPair webhookKeyPair = generateRsaKeyPair();

        ApiCredential credential = new ApiCredential();
        credential.setMerchantId(merchantId);
        credential.setAppId("osl_app_" + UUID.randomUUID().toString().replace("-", ""));
        credential.setApiPublicKey(toPem("PUBLIC KEY", apiKeyPair.getPublic().getEncoded()));
        credential.setApiPrivateKey(toPem("PRIVATE KEY", apiKeyPair.getPrivate().getEncoded()));
        credential.setWebhookPublicKey(toPem("PUBLIC KEY", webhookKeyPair.getPublic().getEncoded()));
        credential.setWebhookPrivateKey(toPem("PRIVATE KEY", webhookKeyPair.getPrivate().getEncoded()));

        credentialMapper.insert(credential);
        return credential;
    }

    @Override
    @Transactional
    public CredentialResponse rotateApiKeys(Long merchantId) {
        ApiCredential credential = getOrFail(merchantId);
        KeyPair newApiKeyPair = generateRsaKeyPair();
        credential.setApiPublicKey(toPem("PUBLIC KEY", newApiKeyPair.getPublic().getEncoded()));
        credential.setApiPrivateKey(toPem("PRIVATE KEY", newApiKeyPair.getPrivate().getEncoded()));
        credentialMapper.updateById(credential);
        log.info("Rotated API keys for merchant={}, appId={}", merchantId, credential.getAppId());
        return toResponse(credential);
    }

    @Override
    @Transactional
    public CredentialResponse rotateWebhookKeys(Long merchantId) {
        ApiCredential credential = getOrFail(merchantId);
        KeyPair newWebhookKeyPair = generateRsaKeyPair();
        credential.setWebhookPublicKey(toPem("PUBLIC KEY", newWebhookKeyPair.getPublic().getEncoded()));
        credential.setWebhookPrivateKey(toPem("PRIVATE KEY", newWebhookKeyPair.getPrivate().getEncoded()));
        credentialMapper.updateById(credential);
        log.info("Rotated Webhook keys for merchant={}, appId={}", merchantId, credential.getAppId());
        return toResponse(credential);
    }

    private ApiCredential getOrFail(Long merchantId) {
        ApiCredential credential = credentialMapper.selectOne(
                new LambdaQueryWrapper<ApiCredential>()
                        .eq(ApiCredential::getMerchantId, merchantId));
        if (credential == null) {
            throw new com.osl.pay.portal.common.exception.BizException(40400, "API credentials not found");
        }
        return credential;
    }

    private CredentialResponse toResponse(ApiCredential credential) {
        CredentialResponse response = new CredentialResponse();
        response.setAppId(credential.getAppId());
        response.setApiPublicKey(credential.getApiPublicKey());
        response.setWebhookPublicKey(credential.getWebhookPublicKey());
        response.setApiEndpoint(EnvironmentContext.isProduction() ? productionUrl : sandboxUrl);
        return response;
    }

    private KeyPair generateRsaKeyPair() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        } catch (NoSuchAlgorithmException e) {
            // RSA is always available in standard JDK
            throw new RuntimeException("RSA algorithm not available", e);
        }
    }

    private String toPem(String type, byte[] encoded) {
        String base64 = Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(encoded);
        return "-----BEGIN " + type + "-----\n" + base64 + "\n-----END " + type + "-----";
    }
}
