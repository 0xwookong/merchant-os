package com.osl.pay.portal.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    /** True if login succeeded and tokens are issued. False if merchant selection is needed. */
    private boolean authenticated;

    /** Only set when authenticated=true */
    private String accessToken;

    private Long userId;
    private Long merchantId;
    private String email;
    private String role;
    private String companyName;

    /** Only set when authenticated=false, means user must pick a merchant */
    private List<MerchantSelectItem> merchants;

    /** Factory: successful login */
    public static LoginResponse success(String accessToken, Long userId, Long merchantId,
                                        String email, String role, String companyName) {
        LoginResponse r = new LoginResponse();
        r.authenticated = true;
        r.accessToken = accessToken;
        r.userId = userId;
        r.merchantId = merchantId;
        r.email = email;
        r.role = role;
        r.companyName = companyName;
        return r;
    }

    /** Factory: merchant selection required */
    public static LoginResponse selectMerchant(List<MerchantSelectItem> merchants) {
        LoginResponse r = new LoginResponse();
        r.authenticated = false;
        r.merchants = merchants;
        return r;
    }
}
