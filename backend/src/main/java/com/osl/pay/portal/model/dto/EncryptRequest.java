package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class EncryptRequest {

    @NotBlank(message = "明文不能为空")
    @Size(max = 500, message = "明文长度不能超过 500")
    private String plaintext;

    @NotBlank(message = "公钥不能为空")
    @Size(max = 5000, message = "公钥长度不能超过 5000")
    private String publicKey;
}
