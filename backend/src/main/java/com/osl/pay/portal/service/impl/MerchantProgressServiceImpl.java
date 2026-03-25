package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.osl.pay.portal.model.dto.MerchantProgressResponse;
import com.osl.pay.portal.model.entity.*;
import com.osl.pay.portal.repository.*;
import com.osl.pay.portal.service.MerchantProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MerchantProgressServiceImpl implements MerchantProgressService {

    private final MerchantMapper merchantMapper;
    private final OnboardingApplicationMapper onboardingMapper;
    private final ApiCredentialMapper credentialMapper;
    private final WebhookConfigMapper webhookMapper;
    private final DomainWhitelistMapper domainMapper;

    @Override
    public MerchantProgressResponse getProgress(Long merchantId) {
        MerchantProgressResponse response = new MerchantProgressResponse();

        // Step 1: Account always created (user is authenticated)
        response.setAccountCreated(true);

        // Step 2: KYB status from merchant table
        Merchant merchant = merchantMapper.selectById(merchantId);
        if (merchant != null && merchant.getKybStatus() != null) {
            response.setKybStatus(merchant.getKybStatus().name());
        } else {
            response.setKybStatus("NOT_STARTED");
        }

        // Step 3: Onboarding status from latest application
        OnboardingApplication onboarding = onboardingMapper.selectOne(
                new LambdaQueryWrapper<OnboardingApplication>()
                        .eq(OnboardingApplication::getMerchantId, merchantId)
                        .orderByDesc(OnboardingApplication::getCreatedAt)
                        .last("LIMIT 1"));
        response.setOnboardingStatus(onboarding != null ? onboarding.getStatus() : null);

        // Step 4: Tech integration checks
        response.setHasCredentials(credentialMapper.selectCount(
                new LambdaQueryWrapper<ApiCredential>()
                        .eq(ApiCredential::getMerchantId, merchantId)) > 0);

        response.setHasWebhooks(webhookMapper.selectCount(
                new LambdaQueryWrapper<WebhookConfig>()
                        .eq(WebhookConfig::getMerchantId, merchantId)) > 0);

        response.setHasDomains(domainMapper.selectCount(
                new LambdaQueryWrapper<DomainWhitelist>()
                        .eq(DomainWhitelist::getMerchantId, merchantId)) > 0);

        return response;
    }
}
