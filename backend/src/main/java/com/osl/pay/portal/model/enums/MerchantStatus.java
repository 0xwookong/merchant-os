package com.osl.pay.portal.model.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;

@Getter
public enum MerchantStatus {
    ACTIVE("ACTIVE"),
    SUSPENDED("SUSPENDED"),
    DISABLED("DISABLED");

    @EnumValue
    private final String value;

    MerchantStatus(String value) {
        this.value = value;
    }
}
