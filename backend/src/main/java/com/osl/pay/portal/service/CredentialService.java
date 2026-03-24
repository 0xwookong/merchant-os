package com.osl.pay.portal.service;

import com.osl.pay.portal.model.dto.CredentialResponse;

public interface CredentialService {

    /**
     * Get (or lazily create) API credentials for the given merchant.
     * On first call, generates RSA key pairs and persists to DB.
     * Subsequent calls return the existing credentials.
     *
     * @param merchantId the authenticated merchant's ID
     * @return credential response (no private keys)
     */
    CredentialResponse getCredentials(Long merchantId);
}
