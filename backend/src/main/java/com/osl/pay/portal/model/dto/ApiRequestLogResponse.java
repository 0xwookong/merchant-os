package com.osl.pay.portal.model.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ApiRequestLogResponse {
    private Long id;
    private String method;
    private String path;
    private Integer statusCode;
    private Integer durationMs;
    private String requestBody;
    private String responseBody;
    private LocalDateTime createdAt;
}
