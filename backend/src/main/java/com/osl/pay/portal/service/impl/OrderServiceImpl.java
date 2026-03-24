package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.common.result.PageResult;
import com.osl.pay.portal.model.dto.OrderDetailResponse;
import com.osl.pay.portal.model.dto.OrderListResponse;
import com.osl.pay.portal.model.entity.Order;
import com.osl.pay.portal.repository.OrderMapper;
import com.osl.pay.portal.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderMapper orderMapper;

    private static final Set<String> VALID_STATUSES = Set.of(
            "CREATED", "PROCESSING", "SUCCESSED", "COMPLETED", "FAILED");
    private static final Set<String> VALID_PAYMENT_METHODS = Set.of(
            "CARD", "GOOGLEPAY", "APPLEPAY");

    @Override
    public PageResult<OrderListResponse> listOrders(Long merchantId, String status,
                                                     String paymentMethod, int page, int pageSize) {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        LambdaQueryWrapper<Order> query = new LambdaQueryWrapper<Order>()
                .eq(Order::getMerchantId, merchantId)
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
        if (order == null || !order.getMerchantId().equals(merchantId)) {
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
