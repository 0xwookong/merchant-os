package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Size(max = 200, message = "邮箱长度不能超过 200 字符")
    private String email;

    @NotBlank(message = "密码不能为空")
    @Size(min = 8, max = 72, message = "密码长度为 8-72 个字符")
    private String password;

    @NotBlank(message = "确认密码不能为空")
    @Size(max = 72, message = "密码长度不能超过 72 个字符")
    private String confirmPassword;

    /** Optional — auto-generated if not provided */
    @Size(max = 200, message = "公司名称不能超过 200 字符")
    private String companyName;

    /** Optional — defaults to email prefix if not provided */
    @Size(max = 100, message = "联系人姓名不能超过 100 字符")
    private String contactName;
}
