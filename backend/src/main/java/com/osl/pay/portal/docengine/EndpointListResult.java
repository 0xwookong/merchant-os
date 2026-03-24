package com.osl.pay.portal.docengine;

import lombok.Data;

import java.util.List;

@Data
public class EndpointListResult {
    private List<CategoryInfo> categories;
    private List<EndpointSummary> endpoints;
}
