package com.osl.pay.portal.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_onboarding_application")
public class OnboardingApplication {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long merchantId;
    private String status;
    private Integer currentStep;

    // Step 1: Company info
    private String companyName;
    private String companyAddress;
    private String contactName;
    private String contactPhone;
    private String contactEmail;

    // Step 2: Business info
    private String businessType;
    private String monthlyVolume;
    private String supportedFiat;
    private String supportedCrypto;
    private String businessDesc;

    private String rejectReason;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
