package com.osl.pay.portal.model.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DocumentResponse {

    private Long id;
    private Long applicationId;
    private String docType;
    private String docName;
    private Long fileSize;
    private String mimeType;
    private Integer uboIndex;
    private String status;
    private LocalDateTime createdAt;
}
