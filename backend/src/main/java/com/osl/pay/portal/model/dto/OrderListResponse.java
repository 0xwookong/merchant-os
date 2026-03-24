package com.osl.pay.portal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderListResponse {
    private Long id;
    private String orderNo;
    private BigDecimal fiatAmount;
    private String fiatCurrency;
    private BigDecimal cryptoAmount;
    private String cryptoCurrency;
    private String cryptoNetwork;
    private String paymentMethod;
    private String status;
    private LocalDateTime createdAt;
}
