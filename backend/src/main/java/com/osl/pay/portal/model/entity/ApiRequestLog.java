package com.osl.pay.portal.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_api_request_log")
public class ApiRequestLog {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long merchantId;
    private String method;
    private String path;
    private Integer statusCode;
    private Integer durationMs;
    private String requestBody;
    private String responseBody;
    private String environment;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
