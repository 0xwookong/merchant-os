package com.osl.pay.portal.model.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class ApplicationResponse {

    private Long id;
    private String status;
    private Integer currentStep;

    // Step 1: Company info
    private String companyName;
    private String companyNameEn;
    private String regCountry;
    private String regNumber;
    private String businessLicenseNo;
    private String companyType;
    private LocalDate incorporationDate;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String stateProvince;
    private String postalCode;
    private String country;
    private String contactName;
    private String contactTitle;
    private String contactEmail;
    private String contactPhone;

    // Step 2: Legal rep + UBOs
    private Map<String, Object> legalRep;
    private List<Map<String, Object>> ubos;
    private Boolean noUboDeclaration;
    private String controlStructureDesc;

    // Step 3: Business info
    private String businessType;
    private String website;
    private String monthlyVolume;
    private String monthlyTxCount;
    private String supportedFiat;
    private String supportedCrypto;
    private String useCases;
    private String businessDesc;

    // Step 5: Compliance declarations
    private Boolean infoAccuracyConfirmed;
    private Boolean sanctionsDeclared;
    private Boolean termsAccepted;

    // Review
    private String rejectReason;
    private List<String> needInfoDetails;

    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
