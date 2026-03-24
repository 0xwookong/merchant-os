package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.model.dto.WebhookCreateRequest;
import com.osl.pay.portal.model.dto.WebhookResponse;
import com.osl.pay.portal.model.entity.WebhookConfig;
import com.osl.pay.portal.repository.WebhookConfigMapper;
import com.osl.pay.portal.service.WebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookServiceImpl implements WebhookService {

    private final WebhookConfigMapper webhookConfigMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Override
    public List<WebhookResponse> list(Long merchantId) {
        List<WebhookConfig> configs = webhookConfigMapper.selectList(
                new LambdaQueryWrapper<WebhookConfig>()
                        .eq(WebhookConfig::getMerchantId, merchantId)
                        .orderByDesc(WebhookConfig::getCreatedAt));
        return configs.stream().map(this::toResponse).toList();
    }

    @Override
    public WebhookResponse create(Long merchantId, WebhookCreateRequest request) {
        validateUrl(request.getUrl());

        WebhookConfig config = new WebhookConfig();
        config.setMerchantId(merchantId);
        config.setUrl(request.getUrl());
        config.setSecret("whsec_" + UUID.randomUUID().toString().replace("-", ""));
        config.setEvents(String.join(",", request.getEvents()));
        config.setStatus("ACTIVE");
        webhookConfigMapper.insert(config);

        log.info("Webhook created: merchantId={}, url={}", merchantId, request.getUrl());
        return toResponse(config);
    }

    @Override
    public WebhookResponse update(Long merchantId, Long id, WebhookCreateRequest request) {
        WebhookConfig config = getOwnedConfig(merchantId, id);
        validateUrl(request.getUrl());

        config.setUrl(request.getUrl());
        config.setEvents(String.join(",", request.getEvents()));
        webhookConfigMapper.updateById(config);

        log.info("Webhook updated: id={}, merchantId={}", id, merchantId);
        return toResponse(config);
    }

    @Override
    public void delete(Long merchantId, Long id) {
        WebhookConfig config = getOwnedConfig(merchantId, id);
        webhookConfigMapper.deleteById(config.getId());
        log.info("Webhook deleted: id={}, merchantId={}", id, merchantId);
    }

    @Override
    public String testPush(Long merchantId, Long id) {
        WebhookConfig config = getOwnedConfig(merchantId, id);

        String testPayload = """
                {"event":"test.ping","timestamp":"%s","data":{"message":"Webhook test from OSLPay"}}
                """.formatted(Instant.now().toString()).trim();

        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(config.getUrl()))
                    .timeout(Duration.ofSeconds(5))
                    .header("Content-Type", "application/json")
                    .header("X-Webhook-Secret", config.getSecret())
                    .header("X-Webhook-Event", "test.ping")
                    .POST(HttpRequest.BodyPublishers.ofString(testPayload))
                    .build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            log.info("Webhook test push: id={}, status={}", id, resp.statusCode());
            return "测试推送完成，HTTP 状态码: " + resp.statusCode();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return "测试推送失败: 请求被中断";
        } catch (Exception e) {
            log.warn("Webhook test push failed: id={}, error={}", id, e.getMessage());
            return "测试推送失败: " + e.getMessage();
        }
    }

    private WebhookConfig getOwnedConfig(Long merchantId, Long id) {
        WebhookConfig config = webhookConfigMapper.selectById(id);
        if (config == null || !config.getMerchantId().equals(merchantId)) {
            throw new BizException(40400, "Webhook 配置不存在");
        }
        return config;
    }

    private void validateUrl(String url) {
        try {
            URI uri = URI.create(url);
            if (uri.getScheme() == null || (!uri.getScheme().equals("https") && !uri.getScheme().equals("http"))) {
                throw new BizException(40000, "URL 必须以 http:// 或 https:// 开头");
            }
        } catch (IllegalArgumentException e) {
            throw new BizException(40000, "URL 格式无效");
        }
    }

    private WebhookResponse toResponse(WebhookConfig config) {
        WebhookResponse resp = new WebhookResponse();
        resp.setId(config.getId());
        resp.setUrl(config.getUrl());
        resp.setSecret(config.getSecret());
        resp.setEvents(Arrays.asList(config.getEvents().split(",")));
        resp.setStatus(config.getStatus());
        resp.setCreatedAt(config.getCreatedAt());
        return resp;
    }
}
