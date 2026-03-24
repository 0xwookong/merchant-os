package com.osl.pay.portal.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_webhook_config")
public class WebhookConfig {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long merchantId;

    private String url;

    private String secret;

    /** Comma-separated event types */
    private String events;

    private String status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
