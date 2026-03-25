package com.osl.pay.portal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OtpSetupResponse {
    private String secret;
    private String otpAuthUri;
}
