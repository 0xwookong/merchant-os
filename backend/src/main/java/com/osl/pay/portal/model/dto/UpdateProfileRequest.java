package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @NotBlank(message = "联系人姓名不能为空")
    @Size(max = 100, message = "联系人姓名不能超过 100 个字符")
    private String contactName;
}
