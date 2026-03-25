package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChangeRoleRequest {

    @NotBlank(message = "角色不能为空")
    private String role;

    /** OTP code — required if user has OTP enabled */
    private String otpCode;

    /** Email verification code — required if user has no OTP */
    private String emailCode;
}
