package com.osl.pay.portal.controller.dashboard;

import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.DashboardMetricsResponse;
import com.osl.pay.portal.model.dto.DashboardPaymentMethodResponse;
import com.osl.pay.portal.model.dto.DashboardTrendResponse;
import com.osl.pay.portal.security.AuthUserDetails;
import com.osl.pay.portal.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/metrics")
    public Result<DashboardMetricsResponse> getMetrics(
            @AuthenticationPrincipal AuthUserDetails user,
            @RequestParam(defaultValue = "7d") String range) {
        log.info("GET /dashboard/metrics merchantId={} range={}", user.getMerchantId(), range);
        return Result.ok(dashboardService.getMetrics(user.getMerchantId(), range));
    }

    @GetMapping("/trend")
    public Result<DashboardTrendResponse> getTrend(
            @AuthenticationPrincipal AuthUserDetails user,
            @RequestParam(defaultValue = "7d") String range) {
        log.info("GET /dashboard/trend merchantId={} range={}", user.getMerchantId(), range);
        return Result.ok(dashboardService.getTrend(user.getMerchantId(), range));
    }

    @GetMapping("/payment-methods")
    public Result<DashboardPaymentMethodResponse> getPaymentMethods(
            @AuthenticationPrincipal AuthUserDetails user,
            @RequestParam(defaultValue = "7d") String range) {
        log.info("GET /dashboard/payment-methods merchantId={} range={}", user.getMerchantId(), range);
        return Result.ok(dashboardService.getPaymentMethods(user.getMerchantId(), range));
    }
}
