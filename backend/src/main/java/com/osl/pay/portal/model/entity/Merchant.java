package com.osl.pay.portal.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.osl.pay.portal.model.enums.KybStatus;
import com.osl.pay.portal.model.enums.MerchantStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_merchant")
public class Merchant {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String companyName;

    private MerchantStatus status;

    private KybStatus kybStatus;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
