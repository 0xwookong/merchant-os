package com.osl.pay.portal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RegisterResponse {
    private Long merchantId;
    private Long userId;
    private String email;
    private String message;
}
