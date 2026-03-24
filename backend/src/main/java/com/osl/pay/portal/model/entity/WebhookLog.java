package com.osl.pay.portal.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_webhook_log")
public class WebhookLog {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long webhookId;
    private Long merchantId;
    private String eventType;
    private String status;
    private Integer httpStatus;
    private Integer retryCount;
    private String requestBody;
    private String responseBody;
    private String errorMessage;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
