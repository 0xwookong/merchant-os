package com.osl.pay.portal.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_audit_log")
public class AuditLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String eventType;

    private Long userId;

    private Long merchantId;

    /** Masked email (e.g., u***@domain.com) */
    private String email;

    private String ipAddress;

    private String userAgent;

    private String detail;

    private Boolean success;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
