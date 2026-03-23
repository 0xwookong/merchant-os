package com.osl.pay.portal.model.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;

@Getter
public enum UserStatus {
    ACTIVE("ACTIVE"),
    LOCKED("LOCKED"),
    DISABLED("DISABLED");

    @EnumValue
    private final String value;

    UserStatus(String value) {
        this.value = value;
    }
}
