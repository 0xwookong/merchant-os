package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class KybSubmitRequest {

    // Company info
    @NotBlank(message = "公司注册地不能为空")
    @Size(max = 100, message = "公司注册地不能超过 100 字符")
    private String companyRegCountry;

    @NotBlank(message = "公司注册号不能为空")
    @Size(max = 100, message = "公司注册号不能超过 100 字符")
    private String companyRegNumber;

    @NotBlank(message = "营业执照号不能为空")
    @Size(max = 100, message = "营业执照号不能超过 100 字符")
    private String businessLicenseNo;

    @NotBlank(message = "公司类型不能为空")
    @Size(max = 50, message = "公司类型不能超过 50 字符")
    private String companyType;

    // Legal representative info
    @NotBlank(message = "法人姓名不能为空")
    @Size(max = 100, message = "法人姓名不能超过 100 字符")
    private String legalRepName;

    @NotBlank(message = "法人国籍不能为空")
    @Size(max = 100, message = "法人国籍不能超过 100 字符")
    private String legalRepNationality;

    @NotBlank(message = "证件类型不能为空")
    @Size(max = 50, message = "证件类型不能超过 50 字符")
    private String legalRepIdType;

    @NotBlank(message = "证件号码不能为空")
    @Size(max = 100, message = "证件号码不能超过 100 字符")
    private String legalRepIdNumber;

    private BigDecimal legalRepSharePct;
}
