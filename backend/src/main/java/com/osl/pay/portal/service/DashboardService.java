package com.osl.pay.portal.service;

import com.osl.pay.portal.model.dto.DashboardMetricsResponse;
import com.osl.pay.portal.model.dto.DashboardPaymentMethodResponse;
import com.osl.pay.portal.model.dto.DashboardTrendResponse;

public interface DashboardService {

    DashboardMetricsResponse getMetrics(Long merchantId, String range);

    DashboardTrendResponse getTrend(Long merchantId, String range);

    DashboardPaymentMethodResponse getPaymentMethods(Long merchantId, String range);
}
