package com.osl.pay.portal.model.dto;

import lombok.Data;

@Data
public class ResetOtpRequest {
    /** Admin's OTP code (if admin has OTP enabled) */
    private String otpCode;
    /** Admin's email verification code (if admin has no OTP) */
    private String emailCode;
}
