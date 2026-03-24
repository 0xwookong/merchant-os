package com.osl.pay.portal.model.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class WebhookResponse {
    private Long id;
    private String url;
    private String secret;
    private List<String> events;
    private String status;
    private LocalDateTime createdAt;
}
