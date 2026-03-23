package com.osl.pay.portal.service.impl;

import com.osl.pay.portal.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Profile("prod")
public class SmtpEmailServiceImpl implements EmailService {

    @Value("${mail.verify-base-url}")
    private String verifyBaseUrl;

    // TODO: Inject JavaMailSender when SMTP is configured
    // @Autowired private JavaMailSender mailSender;

    @Override
    public void sendVerificationEmail(String to, String token) {
        String verifyLink = verifyBaseUrl + "?token=" + token;
        // TODO: Implement actual SMTP sending
        log.warn("SMTP email service not yet configured. Verify link: {}", verifyLink);
    }
}
