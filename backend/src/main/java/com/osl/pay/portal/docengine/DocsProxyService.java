package com.osl.pay.portal.docengine;

import com.osl.pay.portal.common.context.EnvironmentContext;
import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.model.dto.ProxyRequest;
import com.osl.pay.portal.model.dto.ProxyResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
public class DocsProxyService {

    private static final Set<String> ALLOWED_HOSTS = Set.of(
            "openapitest.osl-pay.com"
    );

    private static final Duration TIMEOUT = Duration.ofSeconds(15);

    @Value("${oslpay.api.sandbox-url:https://openapitest.osl-pay.com}")
    private String sandboxUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(TIMEOUT)
            .build();

    public ProxyResponse proxy(ProxyRequest request) {
        // Only sandbox
        if (EnvironmentContext.isProduction()) {
            throw new BizException(40000, "在线试用仅支持沙箱环境");
        }

        // Validate URL host (SSRF protection)
        URI uri;
        try {
            uri = URI.create(request.getUrl());
        } catch (Exception e) {
            throw new BizException(40000, "URL 格式无效");
        }

        if (uri.getHost() == null || !ALLOWED_HOSTS.contains(uri.getHost())) {
            throw new BizException(40000, "仅允许请求沙箱 API 端点");
        }

        // Build HTTP request
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(uri)
                .timeout(TIMEOUT);

        // Set method + body
        String method = request.getMethod().toUpperCase();
        HttpRequest.BodyPublisher bodyPublisher = (request.getBody() != null && !request.getBody().isBlank())
                ? HttpRequest.BodyPublishers.ofString(request.getBody())
                : HttpRequest.BodyPublishers.noBody();

        builder.method(method, bodyPublisher);

        // Set headers
        if (request.getHeaders() != null) {
            request.getHeaders().forEach((k, v) -> {
                if (k != null && v != null && !k.isBlank()) {
                    builder.header(k, v);
                }
            });
        }

        // Execute
        long start = System.currentTimeMillis();
        try {
            HttpResponse<String> resp = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            long duration = System.currentTimeMillis() - start;

            ProxyResponse proxyResp = new ProxyResponse();
            proxyResp.setStatusCode(resp.statusCode());
            proxyResp.setBody(resp.body());
            proxyResp.setDurationMs(duration);

            // Collect response headers (first value only)
            Map<String, String> respHeaders = new LinkedHashMap<>();
            resp.headers().map().forEach((k, values) -> {
                if (!values.isEmpty()) respHeaders.put(k, values.get(0));
            });
            proxyResp.setHeaders(respHeaders);

            return proxyResp;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BizException(50000, "请求被中断");
        } catch (Exception e) {
            log.warn("Proxy request failed: {}", e.getMessage());
            throw new BizException(50000, "请求失败: " + e.getMessage());
        }
    }
}
