package com.osl.pay.portal.model.dto;

import lombok.Data;

@Data
public class ApplicationSubmitRequest {

    // Step 5: Compliance declarations
    private Boolean infoAccuracyConfirmed;
    private Boolean sanctionsDeclared;
    private Boolean termsAccepted;
}
