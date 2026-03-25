package com.osl.pay.portal.service;

import jakarta.servlet.http.HttpServletRequest;

public interface EmailCodeService {

    void sendCode(Long userId, HttpServletRequest httpRequest);

    /**
     * Verify the email code. Returns a one-time action token if valid.
     */
    String verifyCode(Long userId, String code, HttpServletRequest httpRequest);
}
