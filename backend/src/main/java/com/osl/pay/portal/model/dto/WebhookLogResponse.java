package com.osl.pay.portal.model.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class WebhookLogResponse {
    private Long id;
    private String eventType;
    private String status;
    private Integer httpStatus;
    private Integer retryCount;
    private String requestBody;
    private String responseBody;
    private String errorMessage;
    private LocalDateTime createdAt;
}
