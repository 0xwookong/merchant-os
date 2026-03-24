package com.osl.pay.portal.service.impl;

import com.osl.pay.portal.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@Profile("prod")
public class SmtpEmailServiceImpl implements EmailService {

    @Value("${auth.verify-base-url}")
    private String verifyBaseUrl;

    @Value("${auth.reset-base-url}")
    private String resetBaseUrl;

    @Override
    public void sendVerificationEmail(String to, String token) {
        String verifyLink = verifyBaseUrl + "?token=" + token;
        // TODO: Implement actual SMTP sending
        log.warn("SMTP not configured. Verify link: {}", verifyLink);
    }

    @Override
    public void sendPasswordResetEmail(String to, Map<String, String> resetTokens) {
        // TODO: Implement actual SMTP sending
        resetTokens.forEach((companyName, token) -> {
            String resetLink = resetBaseUrl + "?token=" + token;
            log.warn("SMTP not configured. Company: {} → Reset link: {}", companyName, resetLink);
        });
    }
}
