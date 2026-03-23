package com.osl.pay.portal.service.impl;

import com.osl.pay.portal.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Profile("dev")
public class LogEmailServiceImpl implements EmailService {

    @Value("${mail.verify-base-url}")
    private String verifyBaseUrl;

    @Override
    public void sendVerificationEmail(String to, String token) {
        String verifyLink = verifyBaseUrl + "?token=" + token;
        log.info("========== EMAIL VERIFICATION ==========");
        log.info("To: {}", to);
        log.info("Verify Link: {}", verifyLink);
        log.info("=========================================");
    }
}
