package com.osl.pay.portal.model.dto;

import lombok.Data;

@Data
public class OnboardingResponse {
    private Long id;
    private String status;
    private Integer currentStep;

    private String companyName;
    private String companyAddress;
    private String contactName;
    private String contactPhone;
    private String contactEmail;

    private String businessType;
    private String monthlyVolume;
    private String supportedFiat;
    private String supportedCrypto;
    private String businessDesc;

    private String rejectReason;
}
