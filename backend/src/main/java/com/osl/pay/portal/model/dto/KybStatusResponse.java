package com.osl.pay.portal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KybStatusResponse {
    private String kybStatus;
    private String rejectReason;
}
