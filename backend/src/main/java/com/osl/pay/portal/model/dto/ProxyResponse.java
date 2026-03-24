package com.osl.pay.portal.model.dto;

import lombok.Data;

import java.util.Map;

@Data
public class ProxyResponse {
    private int statusCode;
    private Map<String, String> headers;
    private String body;
    private long durationMs;
}
