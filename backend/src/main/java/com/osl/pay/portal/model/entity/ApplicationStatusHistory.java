package com.osl.pay.portal.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_application_status_history")
public class ApplicationStatusHistory {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long applicationId;
    private Long merchantId;
    private String fromStatus;
    private String toStatus;
    private String remark;
    private String operator;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
