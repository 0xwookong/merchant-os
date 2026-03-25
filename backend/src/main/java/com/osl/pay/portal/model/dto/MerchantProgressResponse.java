package com.osl.pay.portal.model.dto;

import lombok.Data;

@Data
public class MerchantProgressResponse {

    private boolean accountCreated;
    private String applicationStatus; // from t_merchant_application: null/DRAFT/SUBMITTED/APPROVED/etc.
    private boolean hasCredentials;
    private boolean hasWebhooks;
    private boolean hasDomains;
}
