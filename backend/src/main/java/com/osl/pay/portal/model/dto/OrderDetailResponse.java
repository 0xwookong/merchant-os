package com.osl.pay.portal.model.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class OrderDetailResponse {
    private Long id;
    private String orderNo;

    // Fiat
    private BigDecimal fiatAmount;
    private String fiatCurrency;

    // Crypto
    private BigDecimal cryptoAmount;
    private String cryptoCurrency;
    private String cryptoNetwork;
    private String walletAddress;

    // Payment
    private String paymentMethod;
    private String status;

    // On-chain
    private String txHash;
    private Long blockHeight;
    private Integer confirmations;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
