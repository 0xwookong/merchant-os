package com.osl.pay.portal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardPaymentMethodResponse {

    private String range;
    private List<PaymentMethodItem> methods;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentMethodItem {
        private String method;
        private String label;
        private BigDecimal amount;
        private int orderCount;
        private BigDecimal percentage;
    }
}
