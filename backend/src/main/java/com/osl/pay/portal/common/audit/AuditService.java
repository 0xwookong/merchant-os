package com.osl.pay.portal.common.audit;

import com.osl.pay.portal.model.entity.AuditLog;
import com.osl.pay.portal.repository.AuditLogMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogMapper auditLogMapper;

    /**
     * Record a security audit event. Runs async to not block the request.
     */
    @Async
    public void log(String eventType, Long userId, Long merchantId,
                    String email, HttpServletRequest request,
                    boolean success, String detail) {
        try {
            AuditLog entry = new AuditLog();
            entry.setEventType(eventType);
            entry.setUserId(userId);
            entry.setMerchantId(merchantId);
            entry.setEmail(maskEmail(email));
            entry.setIpAddress(getClientIp(request));
            entry.setUserAgent(truncate(request.getHeader("User-Agent"), 500));
            entry.setSuccess(success);
            entry.setDetail(truncate(detail, 1000));
            auditLogMapper.insert(entry);
        } catch (Exception e) {
            // Audit failure must never break the main flow
            log.error("Failed to write audit log: eventType={}, detail={}", eventType, detail, e);
        }
    }

    /** Convenience: log with HttpServletRequest, no user context */
    public void log(String eventType, HttpServletRequest request, boolean success, String detail) {
        log(eventType, null, null, null, request, success, detail);
    }

    /**
     * Mask email: "user@domain.com" → "u***@domain.com"
     */
    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        int atIdx = email.indexOf("@");
        if (atIdx <= 1) return "***" + email.substring(atIdx);
        return email.charAt(0) + "***" + email.substring(atIdx);
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp;
        }
        return request.getRemoteAddr();
    }

    private String truncate(String value, int maxLen) {
        if (value == null) return null;
        return value.length() > maxLen ? value.substring(0, maxLen) : value;
    }
}
