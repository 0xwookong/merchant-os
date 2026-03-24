package com.osl.pay.portal.service;

import com.osl.pay.portal.model.dto.ApiRequestLogResponse;

import java.util.List;

public interface ApiRequestLogService {
    /** Get latest 10 API request logs for the merchant in current environment */
    List<ApiRequestLogResponse> getLatest(Long merchantId);
}
