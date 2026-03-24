package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SignVerifyRequest {

    @NotBlank(message = "appId 不能为空")
    @Size(max = 200, message = "appId 长度不能超过 200")
    private String appId;

    @NotBlank(message = "timestamp 不能为空")
    @Size(max = 20, message = "timestamp 长度不能超过 20")
    private String timestamp;

    @NotBlank(message = "签名值不能为空")
    @Size(max = 2000, message = "签名值长度不能超过 2000")
    private String signature;

    @NotBlank(message = "公钥不能为空")
    @Size(max = 5000, message = "公钥长度不能超过 5000")
    private String publicKey;
}
