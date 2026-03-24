package com.osl.pay.portal.model.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
public class KybStatusResponse {
    private String kybStatus;
    private String rejectReason;

    // Previous application data (for APPROVED display and REJECTED re-edit)
    private String companyRegCountry;
    private String companyRegNumber;
    private String businessLicenseNo;
    private String companyType;
    private String legalRepName;
    private String legalRepNationality;
    private String legalRepIdType;
    private String legalRepIdNumber;
    private BigDecimal legalRepSharePct;

    public KybStatusResponse(String kybStatus, String rejectReason) {
        this.kybStatus = kybStatus;
        this.rejectReason = rejectReason;
    }
}
