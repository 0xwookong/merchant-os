package com.osl.pay.portal.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_email_template")
public class EmailTemplate {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String code;

    private String locale;

    private String subject;

    private String bodyHtml;

    private String description;

    private String status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
