package com.osl.pay.portal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class OtpBindResponse {
    /** Recovery codes — shown once, user must save them */
    private List<String> recoveryCodes;
}
