package com.osl.pay.portal.service.impl;

import com.osl.pay.portal.model.dto.DashboardMetricsResponse;
import com.osl.pay.portal.model.dto.DashboardMetricsResponse.MetricCard;
import com.osl.pay.portal.model.dto.DashboardPaymentMethodResponse;
import com.osl.pay.portal.model.dto.DashboardPaymentMethodResponse.PaymentMethodItem;
import com.osl.pay.portal.model.dto.DashboardTrendResponse;
import com.osl.pay.portal.model.dto.DashboardTrendResponse.TrendPoint;
import com.osl.pay.portal.service.DashboardService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Dashboard service.
 * Currently returns mock data with realistic structure.
 * TODO: Replace with real data from OSLPay OpenAPI or aggregated from t_order when available.
 */
@Slf4j
@Service
public class DashboardServiceImpl implements DashboardService {

    private static final Set<String> VALID_RANGES = Set.of("today", "7d", "30d");

    @Override
    public DashboardMetricsResponse getMetrics(Long merchantId, String range) {
        range = normalizeRange(range);
        log.info("getMetrics merchantId={} range={}", merchantId, range);

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
            default -> List.of(
                    new MetricCard("totalAmount", "交易总额", "89,350.00", "USD", new BigDecimal("8.3")),
                    new MetricCard("successRate", "成功率", "97.2", "%", new BigDecimal("0.5")),
                    new MetricCard("orderCount", "订单数量", "365", "笔", new BigDecimal("11.2")),
                    new MetricCard("activeUsers", "活跃用户", "128", "人", new BigDecimal("-3.4"))
            );
        };

        return new DashboardMetricsResponse(metrics, range);
    }

    @Override
    public DashboardTrendResponse getTrend(Long merchantId, String range) {
        range = normalizeRange(range);
        log.info("getTrend merchantId={} range={}", merchantId, range);

        String granularity;
        List<TrendPoint> points;

        switch (range) {
            case "today" -> {
                granularity = "hour";
                points = generateHourlyPoints();
            }
            case "30d" -> {
                granularity = "day";
                points = generateDailyPoints(30);
            }
            default -> {
                granularity = "day";
                points = generateDailyPoints(7);
            }
        }

        return new DashboardTrendResponse(range, granularity, points);
    }

    @Override
    public DashboardPaymentMethodResponse getPaymentMethods(Long merchantId, String range) {
        range = normalizeRange(range);
        log.info("getPaymentMethods merchantId={} range={}", merchantId, range);

        // Mock: distribution varies slightly by range
        List<PaymentMethodItem> methods = switch (range) {
            case "today" -> List.of(
                    new PaymentMethodItem("CARD", "Card", new BigDecimal("8177.00"), 31, new BigDecimal("65.0")),
                    new PaymentMethodItem("GOOGLEPAY", "Google Pay", new BigDecimal("3145.00"), 12, new BigDecimal("25.0")),
                    new PaymentMethodItem("APPLEPAY", "Apple Pay", new BigDecimal("1258.00"), 5, new BigDecimal("10.0"))
            );
            case "30d" -> List.of(
                    new PaymentMethodItem("CARD", "Card", new BigDecimal("246784.80"), 999, new BigDecimal("63.9")),
                    new PaymentMethodItem("GOOGLEPAY", "Google Pay", new BigDecimal("100139.20"), 406, new BigDecimal("25.9")),
                    new PaymentMethodItem("APPLEPAY", "Apple Pay", new BigDecimal("38996.00"), 157, new BigDecimal("10.1"))
            );
            default -> List.of(
                    new PaymentMethodItem("CARD", "Card", new BigDecimal("58077.50"), 237, new BigDecimal("65.0")),
                    new PaymentMethodItem("GOOGLEPAY", "Google Pay", new BigDecimal("22337.50"), 91, new BigDecimal("25.0")),
                    new PaymentMethodItem("APPLEPAY", "Apple Pay", new BigDecimal("8935.00"), 37, new BigDecimal("10.0"))
            );
        };

        return new DashboardPaymentMethodResponse(range, methods);
    }

    private String normalizeRange(String range) {
        if (range == null || !VALID_RANGES.contains(range)) {
            return "7d";
        }
        return range;
    }

    /** Generate hourly mock points for "today" (0:00 ~ current hour). */
    private List<TrendPoint> generateHourlyPoints() {
        ThreadLocalRandom rng = ThreadLocalRandom.current();
        List<TrendPoint> points = new ArrayList<>();
        int hours = java.time.LocalTime.now().getHour() + 1;
        for (int h = 0; h < hours; h++) {
            String time = String.format("%02d:00", h);
            BigDecimal amount = BigDecimal.valueOf(rng.nextInt(200, 1200));
            int count = rng.nextInt(1, 8);
            points.add(new TrendPoint(time, amount, count));
        }
        return points;
    }

    /** Generate daily mock points for N days ending today. */
    private List<TrendPoint> generateDailyPoints(int days) {
        ThreadLocalRandom rng = ThreadLocalRandom.current();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MM/dd");
        LocalDate today = LocalDate.now();
        List<TrendPoint> points = new ArrayList<>();
        for (int i = days - 1; i >= 0; i--) {
            String time = today.minusDays(i).format(fmt);
            BigDecimal amount = BigDecimal.valueOf(rng.nextInt(8000, 22000));
            int count = rng.nextInt(30, 80);
            points.add(new TrendPoint(time, amount, count));
        }
        return points;
    }
}
