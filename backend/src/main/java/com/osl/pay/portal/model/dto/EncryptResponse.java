package com.osl.pay.portal.model.dto;

import lombok.Data;

@Data
public class EncryptResponse {
    /** Base64-encoded RSA ciphertext */
    private String ciphertext;
}
