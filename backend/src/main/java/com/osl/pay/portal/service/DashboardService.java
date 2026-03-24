package com.osl.pay.portal.service;

import com.osl.pay.portal.model.dto.DashboardMetricsResponse;

public interface DashboardService {

    DashboardMetricsResponse getMetrics(Long merchantId, String range);
}
