package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class WebhookRemoveRequest {

    /** OTP code (if user has OTP enabled) */
    @Size(max = 6, message = "验证码最多 6 位")
    private String otpCode;

    /** Email verification code (if user has no OTP) */
    @Size(max = 6, message = "验证码最多 6 位")
    private String emailCode;
}
