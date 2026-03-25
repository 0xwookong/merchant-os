package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ApplicationSaveDraftRequest {

    private Integer currentStep;

    // Step 1: Company info
    @Size(max = 200) private String companyName;
    @Size(max = 200) private String companyNameEn;
    @Size(max = 100) private String regCountry;
    @Size(max = 100) private String regNumber;
    @Size(max = 100) private String businessLicenseNo;
    @Size(max = 50) private String companyType;
    private String incorporationDate; // YYYY-MM-DD
    @Size(max = 300) private String addressLine1;
    @Size(max = 300) private String addressLine2;
    @Size(max = 100) private String city;
    @Size(max = 100) private String stateProvince;
    @Size(max = 20) private String postalCode;
    @Size(max = 100) private String country;
    @Size(max = 100) private String contactName;
    @Size(max = 100) private String contactTitle;
    @Size(max = 200) private String contactEmail;
    @Size(max = 50) private String contactPhone;

    // Step 2: Legal rep + UBOs
    private Map<String, Object> legalRep;
    private List<Map<String, Object>> ubos;
    private Boolean noUboDeclaration;
    @Size(max = 2000) private String controlStructureDesc;

    // Step 3: Business info
    @Size(max = 50) private String businessType;
    @Size(max = 300) private String website;
    @Size(max = 50) private String monthlyVolume;
    @Size(max = 50) private String monthlyTxCount;
    @Size(max = 500) private String supportedFiat;
    @Size(max = 500) private String supportedCrypto;
    @Size(max = 500) private String useCases;
    @Size(max = 2000) private String businessDesc;
}
