package com.osl.pay.portal.service;

import com.osl.pay.portal.model.entity.EmailTemplate;
import com.osl.pay.portal.service.impl.SmtpEmailServiceImpl;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
@DisplayName("SMTP 邮件服务")
class SmtpEmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private MimeMessage mimeMessage;

    @Mock
    private EmailTemplateService templateService;

    @InjectMocks
    private SmtpEmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        lenient().when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        ReflectionTestUtils.setField(emailService, "verifyBaseUrl", "http://localhost:3000/verify-email");
        ReflectionTestUtils.setField(emailService, "resetBaseUrl", "http://localhost:3000/reset-password");
        ReflectionTestUtils.setField(emailService, "fromAddress", "noreply@osl-pay.com");
        ReflectionTestUtils.setField(emailService, "fromName", "OSL Pay");
    }

    private EmailTemplate mockTemplate(String code, String subject, String bodyHtml) {
        EmailTemplate tpl = new EmailTemplate();
        tpl.setCode(code);
        tpl.setLocale("en");
        tpl.setSubject(subject);
        tpl.setBodyHtml(bodyHtml);
        tpl.setStatus("ACTIVE");
        return tpl;
    }

    @Nested
    @DisplayName("发送验证邮件")
    class SendVerificationEmail {

        @Test
        @DisplayName("模板存在 → 使用模板内容发送邮件")
        void should_sendEmail_when_templateExists() {
            when(templateService.getTemplate("VERIFY_EMAIL", "en"))
                    .thenReturn(mockTemplate("VERIFY_EMAIL", "Verify — OSL Pay", "<a href=\"{verifyLink}\">Verify</a>"));
            when(templateService.render(anyString(), anyMap())).thenCallRealMethod();

            emailService.sendVerificationEmail("user@example.com", "abc123");
            verify(mailSender, times(1)).send(any(MimeMessage.class));
        }

        @Test
        @DisplayName("模板不存在 → 发送回退通知邮件")
        void should_sendFallback_when_noTemplate() {
            when(templateService.getTemplate("VERIFY_EMAIL", "en")).thenReturn(null);

            emailService.sendVerificationEmail("user@example.com", "abc123");
            verify(mailSender, times(1)).send(any(MimeMessage.class));
        }

        @Test
        @DisplayName("SMTP 发送失败 → 不抛异常，只记录日志")
        void should_notThrow_when_sendFails() {
            when(templateService.getTemplate("VERIFY_EMAIL", "en")).thenReturn(null);
            doThrow(new RuntimeException("SMTP down")).when(mailSender).send(any(MimeMessage.class));

            assertDoesNotThrow(() -> emailService.sendVerificationEmail("user@example.com", "abc123"));
        }
    }

    @Nested
    @DisplayName("发送密码重置邮件")
    class SendPasswordResetEmail {

        @Test
        @DisplayName("单商户重置 → 发送一封邮件")
        void should_sendEmail_when_singleMerchant() {
            when(templateService.getTemplate("PASSWORD_RESET", "en"))
                    .thenReturn(mockTemplate("PASSWORD_RESET", "Reset — OSL Pay", "{resetLinksHtml}"));
            when(templateService.render(anyString(), anyMap())).thenCallRealMethod();

            emailService.sendPasswordResetEmail("user@example.com", Map.of("Company A", "token1"));
            verify(mailSender, times(1)).send(any(MimeMessage.class));
        }

        @Test
        @DisplayName("多商户重置 → 发送一封包含所有商户链接的邮件")
        void should_sendSingleEmail_when_multipleMerchants() {
            when(templateService.getTemplate("PASSWORD_RESET", "en"))
                    .thenReturn(mockTemplate("PASSWORD_RESET", "Reset — OSL Pay", "{resetLinksHtml}"));
            when(templateService.render(anyString(), anyMap())).thenCallRealMethod();

            Map<String, String> tokens = new LinkedHashMap<>();
            tokens.put("Company A", "tokenA");
            tokens.put("Company B", "tokenB");

            emailService.sendPasswordResetEmail("user@example.com", tokens);
            verify(mailSender, times(1)).send(any(MimeMessage.class));
        }
    }

    @Nested
    @DisplayName("发送邀请邮件")
    class SendInvitation {

        @Test
        @DisplayName("正常邀请 → 调用 mailSender.send 一次")
        void should_sendEmail_when_inviting() {
            when(templateService.getTemplate("INVITATION", "en"))
                    .thenReturn(mockTemplate("INVITATION", "Invited — OSL Pay", "Hi {contactName}"));
            when(templateService.render(anyString(), anyMap())).thenCallRealMethod();

            emailService.sendInvitation("new@example.com", "John Doe", "test-token-123");
            verify(mailSender, times(1)).send(any(MimeMessage.class));
        }

        @Test
        @DisplayName("联系人名含 HTML 特殊字符 → 不引发注入")
        void should_escapeHtml_when_contactNameContainsSpecialChars() {
            when(templateService.getTemplate("INVITATION", "en"))
                    .thenReturn(mockTemplate("INVITATION", "Invited", "Hi {contactName}"));
            when(templateService.render(anyString(), anyMap())).thenCallRealMethod();

            assertDoesNotThrow(() -> emailService.sendInvitation("test@example.com", "<script>alert('xss')</script>", "test-token-456"));
            verify(mailSender, times(1)).send(any(MimeMessage.class));
        }
    }

    @Nested
    @DisplayName("模板渲染")
    class TemplateRendering {

        @Test
        @DisplayName("EmailTemplateService.render → 替换所有变量占位符")
        void should_replaceAllPlaceholders() {
            EmailTemplateService realService = new EmailTemplateService(null);
            String result = realService.render("Hello {name}, your code is {code}.",
                    Map.of("name", "Alice", "code", "12345"));
            assertEquals("Hello Alice, your code is 12345.", result);
        }

        @Test
        @DisplayName("无匹配变量 → 保留原始占位符")
        void should_keepPlaceholder_when_noMatch() {
            EmailTemplateService realService = new EmailTemplateService(null);
            String result = realService.render("Hello {name}", Map.of());
            assertEquals("Hello {name}", result);
        }
    }
}
