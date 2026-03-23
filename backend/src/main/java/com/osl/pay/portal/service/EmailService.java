package com.osl.pay.portal.service;

public interface EmailService {

    /**
     * Send email verification link to the user.
     *
     * @param to    recipient email address
     * @param token verification token
     */
    void sendVerificationEmail(String to, String token);
}
