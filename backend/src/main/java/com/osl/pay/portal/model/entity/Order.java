package com.osl.pay.portal.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("t_order")
public class Order {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long merchantId;
    private String orderNo;
    private BigDecimal fiatAmount;
    private String fiatCurrency;
    private BigDecimal cryptoAmount;
    private String cryptoCurrency;
    private String cryptoNetwork;
    private String walletAddress;
    private String paymentMethod;
    private String status;
    private String txHash;
    private Long blockHeight;
    private Integer confirmations;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
