package com.osl.pay.portal.model.dto;

import lombok.Data;

/**
 * Request body for token refresh.
 * TODO: Remove before production — refresh token should come from httpOnly cookie only (TD-003).
 */
@Data
public class RefreshRequest {
    private String refreshToken;
}
