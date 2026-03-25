package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class OtpLoginRequest {

    @NotBlank(message = "OTP token 不能为空")
    private String otpToken;

    @NotBlank(message = "验证码不能为空")
    @Pattern(regexp = "^(\\d{6}|\\d{4}-\\d{4})$", message = "请输入 6 位验证码或恢复码")
    private String code;
}
