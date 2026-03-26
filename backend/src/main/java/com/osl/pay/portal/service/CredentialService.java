package com.osl.pay.portal.service;

import com.osl.pay.portal.model.dto.CredentialResponse;

public interface CredentialService {

    /**
     * Get (or lazily create) API credentials for the given merchant.
     * On first call, generates RSA key pairs and persists to DB.
     * Subsequent calls return the existing credentials.
     */
    CredentialResponse getCredentials(Long merchantId);

    /**
     * Rotate API RSA key pair. AppId remains unchanged.
     */
    CredentialResponse rotateApiKeys(Long merchantId);

    /**
     * Rotate Webhook RSA key pair. AppId and API keys remain unchanged.
     */
    CredentialResponse rotateWebhookKeys(Long merchantId);
}
