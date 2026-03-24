package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class InviteMemberRequest {

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Size(max = 200, message = "邮箱长度不能超过 200")
    private String email;

    @NotBlank(message = "角色不能为空")
    private String role; // ADMIN, BUSINESS, TECH

    @Size(max = 100, message = "联系人姓名长度不能超过 100")
    private String contactName;
}
