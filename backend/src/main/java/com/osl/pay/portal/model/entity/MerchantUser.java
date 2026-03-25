package com.osl.pay.portal.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.osl.pay.portal.model.enums.UserRole;
import com.osl.pay.portal.model.enums.UserStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_merchant_user")
public class MerchantUser {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long merchantId;

    private String email;

    private String passwordHash;

    private String contactName;

    private UserRole role;

    private UserStatus status;

    private Boolean emailVerified;

    private String otpSecret;

    private Boolean otpEnabled;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
