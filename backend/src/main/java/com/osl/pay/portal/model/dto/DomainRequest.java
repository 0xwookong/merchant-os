package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DomainRequest {

    @NotBlank(message = "域名不能为空")
    @Size(max = 500, message = "域名长度不能超过 500")
    private String domain;
}
