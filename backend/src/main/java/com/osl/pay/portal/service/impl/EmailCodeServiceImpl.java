package com.osl.pay.portal.service.impl;

import com.osl.pay.portal.common.audit.AuditService;
import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.model.entity.MerchantUser;
import com.osl.pay.portal.repository.MerchantUserMapper;
import com.osl.pay.portal.security.AuthRedisService;
import com.osl.pay.portal.service.EmailCodeService;
import com.osl.pay.portal.service.EmailService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailCodeServiceImpl implements EmailCodeService {

    private final MerchantUserMapper merchantUserMapper;
    private final AuthRedisService authRedis;
    private final EmailService emailService;
    private final AuditService auditService;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    public void sendCode(Long userId, HttpServletRequest httpRequest) {
        MerchantUser user = merchantUserMapper.selectById(userId);
        if (user == null) throw new BizException(40400, "用户不存在");

        if (authRedis.hasRecentEmailCode(userId)) {
            throw new BizException(42900, "验证码已发送，请稍后重试");
        }

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        authRedis.saveEmailCode(userId, code);
        emailService.sendVerificationCode(user.getEmail(), code);

        auditService.log("EMAIL_CODE_SENT", userId, user.getMerchantId(),
                user.getEmail(), httpRequest, true, null);

        log.info("Email verification code sent to userId={}", userId);
    }

    @Override
    public String verifyCode(Long userId, String code, HttpServletRequest httpRequest) {
        MerchantUser user = merchantUserMapper.selectById(userId);
        if (user == null) throw new BizException(40400, "用户不存在");

        if (!authRedis.verifyEmailCode(userId, code)) {
            auditService.log("EMAIL_CODE_VERIFY_FAILED", userId, user.getMerchantId(),
                    user.getEmail(), httpRequest, false, null);
            throw new BizException(40000, "验证码错误或已过期");
        }

        // Return a one-time action token (for sensitive operations in iteration C)
        String actionToken = UUID.randomUUID().toString().replace("-", "");
        authRedis.saveResetToken(actionToken, userId);

        auditService.log("EMAIL_CODE_VERIFIED", userId, user.getMerchantId(),
                user.getEmail(), httpRequest, true, null);

        return actionToken;
    }
}
