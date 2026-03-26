package com.osl.pay.portal.service;

import com.osl.pay.portal.common.result.PageResult;
import com.osl.pay.portal.model.dto.OrderDetailResponse;
import com.osl.pay.portal.model.dto.OrderListResponse;

public interface OrderService {

    PageResult<OrderListResponse> listOrders(Long merchantId, String status,
                                              String paymentMethod, String startDate,
                                              String endDate, int page, int pageSize);

    OrderDetailResponse getDetail(Long merchantId, Long orderId);
}
