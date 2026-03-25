package com.osl.pay.portal.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_application_document")
public class ApplicationDocument {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long applicationId;
    private Long merchantId;

    private String docType;
    private String docName;
    private String filePath;
    private Long fileSize;
    private String mimeType;
    private Integer uboIndex;

    private String status;
    private String rejectReason;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
