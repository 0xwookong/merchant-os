package com.osl.pay.portal.docengine;

import lombok.Data;

@Data
public class EndpointSummary {
    private String operationId;
    private String method;
    private String path;
    private String summary;
    private String category;
    private String tag;
}
