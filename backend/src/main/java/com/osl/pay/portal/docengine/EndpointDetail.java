package com.osl.pay.portal.docengine;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class EndpointDetail {
    private String operationId;
    private String method;
    private String path;
    private String summary;
    private String description;
    private String category;
    private String tag;
    private List<Map<String, Object>> parameters;
    private Map<String, Object> requestBody;
    private Map<String, Object> responses;
    private String aiContextBlock;
}
