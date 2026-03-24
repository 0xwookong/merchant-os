package com.osl.pay.portal.service;

import com.osl.pay.portal.model.dto.WebhookCreateRequest;
import com.osl.pay.portal.model.dto.WebhookLogResponse;
import com.osl.pay.portal.model.dto.WebhookResponse;

import java.util.List;

public interface WebhookService {

    List<WebhookResponse> list(Long merchantId);

    WebhookResponse create(Long merchantId, WebhookCreateRequest request);

    WebhookResponse update(Long merchantId, Long id, WebhookCreateRequest request);

    void delete(Long merchantId, Long id);

    String testPush(Long merchantId, Long id);

    List<WebhookLogResponse> getLogs(Long merchantId, Long webhookId);
}
