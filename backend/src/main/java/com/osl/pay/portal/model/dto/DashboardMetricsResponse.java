package com.osl.pay.portal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardMetricsResponse {

    private List<MetricCard> metrics;
    private String range;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricCard {
        /** Metric key: totalAmount, successRate, orderCount, activeUsers */
        private String key;
        private String label;
        private String value;
        private String unit;
        /** Positive = up, negative = down, 0 = flat */
        private BigDecimal changeRate;
    }
}
