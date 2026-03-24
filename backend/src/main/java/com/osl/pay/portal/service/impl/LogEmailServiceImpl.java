package com.osl.pay.portal.service.impl;

import com.osl.pay.portal.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@Profile("dev")
public class LogEmailServiceImpl implements EmailService {

    @Value("${auth.verify-base-url}")
    private String verifyBaseUrl;

    @Value("${auth.reset-base-url}")
    private String resetBaseUrl;

    @Override
    public void sendVerificationEmail(String to, String token) {
        String verifyLink = verifyBaseUrl + "?token=" + token;
        log.info("========== EMAIL VERIFICATION ==========");
        log.info("To: {}", to);
        log.info("Verify Link: {}", verifyLink);
        log.info("=========================================");
    }

    @Override
    public void sendPasswordResetEmail(String to, Map<String, String> resetTokens) {
        log.info("========== PASSWORD RESET ==========");
        log.info("To: {}", to);
        resetTokens.forEach((companyName, token) -> {
            String resetLink = resetBaseUrl + "?token=" + token;
            log.info("Company: {} → Reset Link: {}", companyName, resetLink);
        });
        log.info("====================================");
    }
}
