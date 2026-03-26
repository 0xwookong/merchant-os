package com.osl.pay.portal.controller.dashboard;

import com.osl.pay.portal.common.result.PageResult;
import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.OrderDetailResponse;
import com.osl.pay.portal.model.dto.OrderListResponse;
import com.osl.pay.portal.security.AuthUserDetails;
import com.osl.pay.portal.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public Result<PageResult<OrderListResponse>> listOrders(
            @AuthenticationPrincipal AuthUserDetails user,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        log.info("GET /orders merchantId={} status={} payment={} date={}/{} page={} size={}",
                user.getMerchantId(), status, paymentMethod, startDate, endDate, page, pageSize);
        return Result.ok(orderService.listOrders(
                user.getMerchantId(), status, paymentMethod, startDate, endDate, page, pageSize));
    }

    @GetMapping("/{id}")
    public Result<OrderDetailResponse> getDetail(
            @AuthenticationPrincipal AuthUserDetails user,
            @PathVariable Long id) {
        return Result.ok(orderService.getDetail(user.getMerchantId(), id));
    }
}
