package com.osl.pay.portal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MerchantSelectItem {
    private Long merchantId;
    private String companyName;
    private String role;
}
