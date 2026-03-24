package com.osl.pay.portal.model.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DomainResponse {
    private Long id;
    private String domain;
    private LocalDateTime createdAt;
}
