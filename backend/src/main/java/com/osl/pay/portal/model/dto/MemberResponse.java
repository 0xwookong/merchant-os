package com.osl.pay.portal.model.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MemberResponse {
    private Long id;
    private String contactName;
    private String email;
    private String role;
    private String status; // ACTIVE, PENDING (invited but not verified)
    private boolean otpEnabled;
    private LocalDateTime createdAt;
}
