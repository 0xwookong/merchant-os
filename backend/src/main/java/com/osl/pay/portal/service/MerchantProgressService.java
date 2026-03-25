package com.osl.pay.portal.service;

import com.osl.pay.portal.model.dto.MerchantProgressResponse;

public interface MerchantProgressService {

    /**
     * Aggregate onboarding progress for the given merchant.
     * Collects KYB status, onboarding status, and tech integration readiness.
     *
     * @param merchantId the authenticated merchant's ID
     * @return aggregated progress
     */
    MerchantProgressResponse getProgress(Long merchantId);
}
