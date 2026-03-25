package com.osl.pay.portal.model.dto;

import lombok.Data;

import java.util.Map;

@Data
public class ApplicationSubmitRequest {

    private Boolean infoAccuracyConfirmed;
    private Boolean sanctionsDeclared;
    private Boolean termsAccepted;

    // Signatures: { director: {name, title, email}, cco: {name, title, email} }
    private Map<String, Object> signatures;
}
