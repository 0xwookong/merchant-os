package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CredentialRotateRequest {
    @NotBlank(message = "keyType is required")
    @Pattern(regexp = "api|webhook", message = "keyType must be 'api' or 'webhook'")
    private String keyType;

    private String otpCode;
    private String emailCode;
}
