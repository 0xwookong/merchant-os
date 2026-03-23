package com.osl.pay.portal.model.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;

@Getter
public enum KybStatus {
    NOT_STARTED("NOT_STARTED"),
    PENDING("PENDING"),
    APPROVED("APPROVED"),
    REJECTED("REJECTED"),
    NEED_MORE_INFO("NEED_MORE_INFO");

    @EnumValue
    private final String value;

    KybStatus(String value) {
        this.value = value;
    }
}
