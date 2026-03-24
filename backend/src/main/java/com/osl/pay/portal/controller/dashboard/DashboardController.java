package com.osl.pay.portal.controller.dashboard;

import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.DashboardMetricsResponse;
import com.osl.pay.portal.security.AuthUserDetails;
import com.osl.pay.portal.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/metrics")
    public Result<DashboardMetricsResponse> getMetrics(
            @AuthenticationPrincipal AuthUserDetails user,
            @RequestParam(defaultValue = "7d") String range) {
        return Result.ok(dashboardService.getMetrics(user.getMerchantId(), range));
    }
}
