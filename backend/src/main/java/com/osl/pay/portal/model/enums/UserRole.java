package com.osl.pay.portal.model.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;

@Getter
public enum UserRole {
    ADMIN("ADMIN"),
    BUSINESS("BUSINESS"),
    TECH("TECH");

    @EnumValue
    private final String value;

    UserRole(String value) {
        this.value = value;
    }
}
