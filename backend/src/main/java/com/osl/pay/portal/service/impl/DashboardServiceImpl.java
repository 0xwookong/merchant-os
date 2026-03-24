package com.osl.pay.portal.service.impl;

import com.osl.pay.portal.model.dto.DashboardMetricsResponse;
import com.osl.pay.portal.model.dto.DashboardMetricsResponse.MetricCard;
import com.osl.pay.portal.service.DashboardService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

/**
 * Dashboard metrics service.
 * Currently returns mock data with realistic structure.
 * TODO: Replace with real data from OSLPay OpenAPI or aggregated from t_order when available.
 */
@Service
public class DashboardServiceImpl implements DashboardService {

    private static final Set<String> VALID_RANGES = Set.of("today", "7d", "30d");

    @Override
    public DashboardMetricsResponse getMetrics(Long merchantId, String range) {
        // Normalize range
        if (range == null || !VALID_RANGES.contains(range)) {
            range = "7d";
        }

        // Mock data — varies slightly by range to demonstrate responsiveness
        List<MetricCard> metrics = switch (range) {
            case "today" -> List.of(
                    new MetricCard("totalAmount", "交易总额", "12,580.00", "USD", new BigDecimal("5.2")),
                    new MetricCard("successRate", "成功率", "96.8", "%", new BigDecimal("1.2")),
                    new MetricCard("orderCount", "订单数量", "48", "笔", new BigDecimal("8.5")),
                    new MetricCard("activeUsers", "活跃用户", "23", "人", new BigDecimal("-2.1"))
            );
            case "30d" -> List.of(
                    new MetricCard("totalAmount", "交易总额", "385,920.00", "USD", new BigDecimal("12.8")),
                    new MetricCard("successRate", "成功率", "97.5", "%", new BigDecimal("0.8")),
                    new MetricCard("orderCount", "订单数量", "1,562", "笔", new BigDecimal("15.3")),
                    new MetricCard("activeUsers", "活跃用户", "342", "人", new BigDecimal("6.7"))
            );
            default -> List.of( // 7d
                    new MetricCard("totalAmount", "交易总额", "89,350.00", "USD", new BigDecimal("8.3")),
                    new MetricCard("successRate", "成功率", "97.2", "%", new BigDecimal("0.5")),
                    new MetricCard("orderCount", "订单数量", "365", "笔", new BigDecimal("11.2")),
                    new MetricCard("activeUsers", "活跃用户", "128", "人", new BigDecimal("-3.4"))
            );
        };

        return new DashboardMetricsResponse(metrics, range);
    }
}
