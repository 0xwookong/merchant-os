package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.osl.pay.portal.common.context.EnvironmentContext;
import com.osl.pay.portal.model.dto.MerchantProgressResponse;
import com.osl.pay.portal.model.entity.*;
import com.osl.pay.portal.repository.*;
import com.osl.pay.portal.service.MerchantProgressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MerchantProgressServiceImpl implements MerchantProgressService {

    private final MerchantApplicationMapper applicationMapper;
    private final ApiCredentialMapper credentialMapper;
    private final WebhookConfigMapper webhookMapper;
    private final DomainWhitelistMapper domainMapper;

    @Override
    public MerchantProgressResponse getProgress(Long merchantId) {
        log.debug("getProgress merchantId={}", merchantId);

        MerchantProgressResponse response = new MerchantProgressResponse();
        response.setAccountCreated(true);

        String status = applicationMapper.selectStatusByMerchantId(merchantId);
        response.setApplicationStatus(status);

        String env = EnvironmentContext.current();

        response.setHasCredentials(credentialMapper.selectCount(
                new LambdaQueryWrapper<ApiCredential>()
                        .eq(ApiCredential::getMerchantId, merchantId)
                        .eq(ApiCredential::getEnvironment, env)) > 0);

        response.setHasWebhooks(webhookMapper.selectCount(
                new LambdaQueryWrapper<WebhookConfig>()
                        .eq(WebhookConfig::getMerchantId, merchantId)
                        .eq(WebhookConfig::getEnvironment, env)) > 0);

        response.setHasDomains(domainMapper.selectCount(
                new LambdaQueryWrapper<DomainWhitelist>()
                        .eq(DomainWhitelist::getMerchantId, merchantId)
                        .eq(DomainWhitelist::getEnvironment, env)) > 0);

        log.debug("getProgress merchantId={} result: status={} cred={} webhook={} domain={}",
                merchantId, status, response.isHasCredentials(), response.isHasWebhooks(), response.isHasDomains());

        return response;
    }
}
