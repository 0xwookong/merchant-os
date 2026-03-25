package com.osl.pay.portal.service.impl;

import com.osl.pay.portal.model.entity.EmailTemplate;
import com.osl.pay.portal.service.EmailService;
import com.osl.pay.portal.service.EmailTemplateService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@Profile("prod")
@RequiredArgsConstructor
public class SmtpEmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final EmailTemplateService templateService;

    @Value("${auth.verify-base-url}")
    private String verifyBaseUrl;

    @Value("${auth.reset-base-url}")
    private String resetBaseUrl;

    @Value("${email.from}")
    private String fromAddress;

    @Value("${email.from-name}")
    private String fromName;

    /** Default locale for emails (can be extended to per-user locale later) */
    private static final String DEFAULT_LOCALE = "en";

    @Override
    @Async
    public void sendVerificationEmail(String to, String token) {
        String verifyLink = verifyBaseUrl + "?token=" + token;
        Map<String, String> vars = Map.of("verifyLink", verifyLink);
        sendTemplated("VERIFY_EMAIL", DEFAULT_LOCALE, to, vars);
    }

    @Override
    @Async
    public void sendPasswordResetEmail(String to, Map<String, String> resetTokens) {
        String resetLinksHtml = buildResetLinksHtml(resetTokens);
        Map<String, String> vars = Map.of("resetLinksHtml", resetLinksHtml);
        sendTemplated("PASSWORD_RESET", DEFAULT_LOCALE, to, vars);
    }

    @Override
    @Async
    public void sendInvitation(String to, String contactName, String activateToken) {
        String activateLink = resetBaseUrl + "?token=" + activateToken + "&invite=true";
        Map<String, String> vars = Map.of(
                "contactName", escapeHtml(contactName),
                "activateLink", activateLink);
        sendTemplated("INVITATION", DEFAULT_LOCALE, to, vars);
    }

    /**
     * Load template from DB, render variables, wrap in brand layout, and send.
     * Falls back to a plain-text notification if no template found.
     */
    private void sendTemplated(String templateCode, String locale, String to, Map<String, String> variables) {
        EmailTemplate template = templateService.getTemplate(templateCode, locale);
        if (template == null) {
            log.warn("Email template not found: code={}, locale={}. Sending plain fallback to: {}", templateCode, locale, to);
            send(to, "Notification from OSL Pay", wrapLayout("Notification",
                    "<p style=\"color:#4b5563;font-size:14px\">You have a notification from OSL Pay. Please log in to your account for details.</p>"));
            return;
        }

        String subject = templateService.render(template.getSubject(), variables);
        String bodyHtml = templateService.render(template.getBodyHtml(), variables);
        send(to, subject, wrapLayout(extractHeading(templateCode), bodyHtml));
    }

    private void send(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Email sent to: {}, subject: {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to: {}, subject: {}", to, subject, e);
        }
    }

    // ===== Helpers =====

    private String buildResetLinksHtml(Map<String, String> resetTokens) {
        if (resetTokens.size() == 1) {
            Map.Entry<String, String> entry = resetTokens.entrySet().iterator().next();
            String resetLink = resetBaseUrl + "?token=" + entry.getValue();
            return """
                <div style="text-align:center;margin:32px 0">
                  <a href="%s" style="display:inline-block;background:#000;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 32px;border-radius:8px">Reset Password</a>
                </div>
                """.formatted(resetLink);
        }

        String rows = resetTokens.entrySet().stream().map(entry -> {
            String resetLink = resetBaseUrl + "?token=" + entry.getValue();
            return """
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#1f2937">%s</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;text-align:right">
                    <a href="%s" style="color:#2563eb;font-size:14px;font-weight:500;text-decoration:none">Reset →</a>
                  </td>
                </tr>
                """.formatted(escapeHtml(entry.getKey()), resetLink);
        }).collect(Collectors.joining());

        return """
            <p style="color:#4b5563;font-size:14px;margin:0 0 16px">Your email is linked to multiple merchants:</p>
            <table style="width:100%%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">%s</table>
            """.formatted(rows);
    }

    private String extractHeading(String templateCode) {
        return switch (templateCode) {
            case "VERIFY_EMAIL" -> "Verify Your Email";
            case "PASSWORD_RESET" -> "Reset Your Password";
            case "INVITATION" -> "You're Invited";
            default -> "Notification";
        };
    }

    /** Brand layout wrapper — consistent header/footer for all emails */
    private String wrapLayout(String heading, String bodyContent) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
            <body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
              <table role="presentation" style="width:100%%;max-width:600px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
                <tr>
                  <td style="background:#000;padding:24px 32px">
                    <table role="presentation" style="width:100%%">
                      <tr>
                        <td>
                          <span style="display:inline-block;width:32px;height:32px;background:rgba(255,255,255,0.1);border-radius:6px;text-align:center;line-height:32px;font-weight:700;color:#c4ff0d;font-size:14px">O</span>
                          <span style="color:#fff;font-size:18px;font-weight:600;vertical-align:middle;margin-left:10px">OSL Pay</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 32px 16px">
                    <h1 style="font-size:24px;font-weight:700;color:#1f2937;margin:0 0 24px">%s</h1>
                    %s
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 32px;border-top:1px solid #f3f4f6">
                    <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center">
                      &copy; 2026 OSL Group. All rights reserved.<br/>
                      <a href="mailto:support@osl-pay.com" style="color:#9ca3af">support@osl-pay.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(heading, bodyContent);
    }

    private static String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
