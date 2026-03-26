package com.osl.pay.portal.model.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProfileResponse {
    private String companyName;
    private String contactName;
    private String email;
    private String role;
    private LocalDateTime createdAt;
}
