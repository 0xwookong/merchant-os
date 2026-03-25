package com.osl.pay.portal.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@TableName(value = "t_merchant_application", autoResultMap = true)
public class MerchantApplication {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long merchantId;

    private String status;
    private String counterpartyType; // MICAR_LICENSED, CASP, VASP, REFERRAL
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

    // Section A: Legal rep + UBOs + Directors + Authorized Persons (JSON)
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> legalRep;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<Map<String, Object>> ubos;

    private Boolean noUboDeclaration;
    private String controlStructureDesc;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<Map<String, Object>> directors;

    @TableField(typeHandler = JacksonTypeHandler.class)
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

    // Section C: Licence info (JSON)
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> licenceInfo;

    // Compliance declarations
    private Boolean infoAccuracyConfirmed;
    private Boolean sanctionsDeclared;
    private Boolean termsAccepted;

    // Review
    private String rejectReason;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> needInfoDetails;

    private String reviewerNotes;
    private LocalDateTime reviewedAt;
    private String reviewedBy;

    private LocalDateTime submittedAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
