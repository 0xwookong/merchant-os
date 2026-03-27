package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.osl.pay.portal.common.context.EnvironmentContext;
import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.common.result.PageResult;
import com.osl.pay.portal.model.dto.OrderDetailResponse;
import com.osl.pay.portal.model.dto.OrderListResponse;
import com.osl.pay.portal.model.entity.Order;
import com.osl.pay.portal.repository.OrderMapper;
import com.osl.pay.portal.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    /** Orders older than 30 days are not queryable via portal; contact support for bulk export. */
    private static final int DATA_WINDOW_DAYS = 30;

    private final OrderMapper orderMapper;

    private static final Set<String> VALID_STATUSES = Set.of(
            "CREATED", "PROCESSING", "SUCCESSED", "COMPLETED", "FAILED");
    private static final Set<String> VALID_PAYMENT_METHODS = Set.of(
            "CARD", "GOOGLEPAY", "APPLEPAY");

    @Override
    public PageResult<OrderListResponse> listOrders(Long merchantId, String status,
                                                     String paymentMethod, String startDate,
                                                     String endDate, int page, int pageSize) {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 150) pageSize = 20;

        // Hard floor: never older than DATA_WINDOW_DAYS
        LocalDateTime hardEarliest = LocalDateTime.now().minusDays(DATA_WINDOW_DAYS);

        // Parse optional date range from client (yyyy-MM-dd), clamp to hard floor
        LocalDateTime rangeStart = hardEarliest;
        LocalDateTime rangeEnd = LocalDateTime.now();
        try {
            if (startDate != null && !startDate.isBlank()) {
                LocalDateTime parsed = LocalDate.parse(startDate).atStartOfDay();
                rangeStart = parsed.isBefore(hardEarliest) ? hardEarliest : parsed;
            }
            if (endDate != null && !endDate.isBlank()) {
                LocalDateTime parsed = LocalDate.parse(endDate).atTime(LocalTime.MAX);
                rangeEnd = parsed.isAfter(LocalDateTime.now()) ? LocalDateTime.now() : parsed;
            }
        } catch (Exception e) {
            log.warn("Invalid date params startDate={} endDate={}, using defaults", startDate, endDate);
        }

        log.info("listOrders merchantId={} status={} payment={} range=[{}, {}] page={} pageSize={}",
                merchantId, status, paymentMethod, rangeStart, rangeEnd, page, pageSize);

        LambdaQueryWrapper<Order> query = new LambdaQueryWrapper<Order>()
                .eq(Order::getMerchantId, merchantId)
                .eq(Order::getEnvironment, EnvironmentContext.current())
                .ge(Order::getCreatedAt, rangeStart)
                .le(Order::getCreatedAt, rangeEnd)
                .orderByDesc(Order::getCreatedAt);

        if (status != null && VALID_STATUSES.contains(status)) {
            query.eq(Order::getStatus, status);
        }
        if (paymentMethod != null && VALID_PAYMENT_METHODS.contains(paymentMethod)) {
            query.eq(Order::getPaymentMethod, paymentMethod);
        }

        Page<Order> pageResult = orderMapper.selectPage(new Page<>(page, pageSize), query);

        List<OrderListResponse> list = pageResult.getRecords().stream()
                .map(this::toListResponse)
                .toList();

        return new PageResult<>(list, pageResult.getTotal(), page, pageSize);
    }

    private OrderListResponse toListResponse(Order order) {
        return new OrderListResponse(
                order.getId(),
                order.getOrderNo(),
                order.getFiatAmount(),
                order.getFiatCurrency(),
                order.getCryptoAmount(),
                order.getCryptoCurrency(),
                order.getCryptoNetwork(),
                order.getPaymentMethod(),
                order.getStatus(),
                order.getCreatedAt()
        );
    }

    @Override
    public OrderDetailResponse getDetail(Long merchantId, Long orderId) {
        Order order = orderMapper.selectById(orderId);
        if (order == null || !order.getMerchantId().equals(merchantId)
                || !EnvironmentContext.current().equals(order.getEnvironment())) {
            throw new BizException(40400, "订单不存在");
        }

        OrderDetailResponse resp = new OrderDetailResponse();
        resp.setId(order.getId());
        resp.setOrderNo(order.getOrderNo());
        resp.setFiatAmount(order.getFiatAmount());
        resp.setFiatCurrency(order.getFiatCurrency());
        resp.setCryptoAmount(order.getCryptoAmount());
        resp.setCryptoCurrency(order.getCryptoCurrency());
        resp.setCryptoNetwork(order.getCryptoNetwork());
        resp.setWalletAddress(order.getWalletAddress());
        resp.setPaymentMethod(order.getPaymentMethod());
        resp.setStatus(order.getStatus());
        resp.setTxHash(order.getTxHash());
        resp.setBlockHeight(order.getBlockHeight());
        resp.setConfirmations(order.getConfirmations());
        resp.setCreatedAt(order.getCreatedAt());
        resp.setUpdatedAt(order.getUpdatedAt());
        return resp;
    }
}
