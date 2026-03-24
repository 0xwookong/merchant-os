package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @NotBlank(message = "密码不能为空")
    @Size(max = 72, message = "密码长度不能超过 72 个字符")
    private String password;

    /** If the email matches multiple merchants, specify which one to login. Null for first attempt. */
    private Long merchantId;
}
