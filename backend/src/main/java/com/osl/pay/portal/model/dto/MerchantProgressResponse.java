package com.osl.pay.portal.model.dto;

import lombok.Data;

@Data
public class MerchantProgressResponse {

    private boolean accountCreated;
    private String kybStatus;
    private String onboardingStatus;
    private boolean hasCredentials;
    private boolean hasWebhooks;
    private boolean hasDomains;
}
