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
    private String counterpartyType;
    private Integer currentStep;

    // Section A: Company info
    private String companyName;
    private String companyNameEn;
    private String regCountry;
    private String regNumber;
    private String taxIdNumber;
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

    // Section A: Legal rep + UBOs + Directors + Authorized Persons
    private Map<String, Object> legalRep;
    private List<Map<String, Object>> ubos;
    private Boolean noUboDeclaration;
    private String controlStructureDesc;
    private List<Map<String, Object>> directors;
    private List<Map<String, Object>> authorizedPersons;

    // Section B: Business info
    private String businessType;
    private String website;
    private String purposeOfAccount;
    private String sourceOfIncome;
    private String estAmountPerTxFrom;
    private String estAmountPerTxTo;
    private String estTxPerYear;
    private String monthlyVolume;
    private String monthlyTxCount;
    private String supportedFiat;
    private String supportedCrypto;
    private String useCases;
    private String businessDesc;

    // Section C: Licence info
    private Map<String, Object> licenceInfo;

    // Compliance declarations
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
