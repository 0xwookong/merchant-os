package com.osl.pay.portal.security;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Authenticated user context, stored in SecurityContext.
 * Use SecurityContextHolder.getContext().getAuthentication().getPrincipal() to retrieve.
 */
@Getter
@AllArgsConstructor
public class AuthUserDetails {
    private final Long userId;
    private final Long merchantId;
    private final String email;
    private final String role;
}
