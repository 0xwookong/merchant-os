package com.osl.pay.portal.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_domain_whitelist")
public class DomainWhitelist {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long merchantId;
    private String environment;
    private String domain;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
