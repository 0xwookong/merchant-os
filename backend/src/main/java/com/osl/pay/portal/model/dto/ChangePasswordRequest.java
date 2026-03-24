package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank(message = "旧密码不能为空")
    @Size(max = 72, message = "密码长度不能超过 72 个字符")
    private String oldPassword;

    @NotBlank(message = "新密码不能为空")
    @Size(min = 8, max = 72, message = "密码长度为 8-72 个字符")
    private String newPassword;

    @NotBlank(message = "确认密码不能为空")
    @Size(max = 72, message = "密码长度不能超过 72 个字符")
    private String confirmPassword;
}
