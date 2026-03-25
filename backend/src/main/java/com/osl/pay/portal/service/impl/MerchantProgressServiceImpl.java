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

    private final MerchantApplicationMapper applicationMapper;
    private final ApiCredentialMapper credentialMapper;
    private final WebhookConfigMapper webhookMapper;
    private final DomainWhitelistMapper domainMapper;

    @Override
    public MerchantProgressResponse getProgress(Long merchantId) {
        MerchantProgressResponse response = new MerchantProgressResponse();

        // Account always created (user is authenticated)
        response.setAccountCreated(true);

        // Application status from unified t_merchant_application
        MerchantApplication app = applicationMapper.selectOne(
                new LambdaQueryWrapper<MerchantApplication>()
                        .eq(MerchantApplication::getMerchantId, merchantId)
                        .orderByDesc(MerchantApplication::getId)
                        .last("LIMIT 1"));
        response.setApplicationStatus(app != null ? app.getStatus() : null);

        // Tech integration checks
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
