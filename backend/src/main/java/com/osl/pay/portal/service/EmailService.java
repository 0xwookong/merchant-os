package com.osl.pay.portal.service;

import java.util.Map;

public interface EmailService {

    void sendVerificationEmail(String to, String token);

    /**
     * Send password reset email. Each entry in resetTokens maps companyName to its reset token.
     */
    void sendPasswordResetEmail(String to, Map<String, String> resetTokens);
}
