package com.osl.pay.portal.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_api_credential")
public class ApiCredential {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long merchantId;

    private String appId;

    private String apiPublicKey;

    private String apiPrivateKey;

    private String webhookPublicKey;

    private String webhookPrivateKey;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
