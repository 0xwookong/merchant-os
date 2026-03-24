package com.osl.pay.portal.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("t_kyb_application")
public class KybApplication {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long merchantId;

    private String companyRegCountry;
    private String companyRegNumber;
    private String businessLicenseNo;
    private String companyType;

    private String legalRepName;
    private String legalRepNationality;
    private String legalRepIdType;
    private String legalRepIdNumber;
    private BigDecimal legalRepSharePct;

    private String status;
    private String rejectReason;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
