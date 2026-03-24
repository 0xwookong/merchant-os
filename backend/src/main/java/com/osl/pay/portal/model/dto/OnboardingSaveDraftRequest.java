package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OnboardingSaveDraftRequest {

    /** true = submit (validate all fields), false = save draft (partial ok) */
    private boolean submit;

    private Integer currentStep;

    // Step 1
    @Size(max = 200, message = "公司名称不能超过 200 字符")
    private String companyName;

    @Size(max = 500, message = "公司地址不能超过 500 字符")
    private String companyAddress;

    @Size(max = 100, message = "联系人姓名不能超过 100 字符")
    private String contactName;

    @Size(max = 50, message = "联系电话不能超过 50 字符")
    private String contactPhone;

    @Size(max = 200, message = "联系邮箱不能超过 200 字符")
    private String contactEmail;

    // Step 2
    @Size(max = 50, message = "业务类型不能超过 50 字符")
    private String businessType;

    @Size(max = 50, message = "月交易量不能超过 50 字符")
    private String monthlyVolume;

    @Size(max = 200, message = "法币列表不能超过 200 字符")
    private String supportedFiat;

    @Size(max = 200, message = "加密货币列表不能超过 200 字符")
    private String supportedCrypto;

    @Size(max = 2000, message = "业务描述不能超过 2000 字符")
    private String businessDesc;
}
