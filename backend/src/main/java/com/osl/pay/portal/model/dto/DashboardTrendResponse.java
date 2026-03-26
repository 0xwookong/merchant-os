package com.osl.pay.portal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardTrendResponse {

    private String range;
    /** hour | day | week */
    private String granularity;
    private List<TrendPoint> points;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendPoint {
        private String time;
        private BigDecimal amount;
        private int orderCount;
    }
}
