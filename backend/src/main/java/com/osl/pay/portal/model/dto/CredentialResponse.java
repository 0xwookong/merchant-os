package com.osl.pay.portal.model.dto;

import lombok.Data;

@Data
public class CredentialResponse {
    private String appId;
    private String apiEndpoint;
    private String apiPublicKey;
    private String webhookPublicKey;
}
