package com.osl.pay.portal.model.dto;

import lombok.Data;

@Data
public class SignVerifyResponse {
    private boolean valid;
    private String signatureString;
}
