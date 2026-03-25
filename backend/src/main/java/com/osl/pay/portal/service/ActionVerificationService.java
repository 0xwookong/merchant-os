package com.osl.pay.portal.service;

import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.model.entity.MerchantUser;
import com.osl.pay.portal.repository.MerchantUserMapper;
import com.osl.pay.portal.security.AuthRedisService;
import com.osl.pay.portal.security.TotpService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Verifies sensitive actions using OTP (if bound) or email verification code.
 * Call this before executing any destructive/privileged operation.
 */
@Service
@RequiredArgsConstructor
public class ActionVerificationService {

    private final MerchantUserMapper merchantUserMapper;
    private final TotpService totpService;
    private final AuthRedisService authRedis;

    /**
     * Verify the user's identity for a sensitive action.
     *
     * @param userId   the user performing the action
     * @param otpCode  OTP code (if user has OTP enabled). Null if using email code.
     * @param emailCode email verification code (if user has no OTP). Null if using OTP.
     * @throws BizException if verification fails
     */
    public void verify(Long userId, String otpCode, String emailCode) {
        MerchantUser user = merchantUserMapper.selectById(userId);
        if (user == null) throw new BizException(40400, "用户不存在");

        if (Boolean.TRUE.equals(user.getOtpEnabled())) {
            // OTP is enabled — must use OTP code
            if (otpCode == null || otpCode.isBlank()) {
                throw new BizException(40000, "请输入 OTP 验证码");
            }
            if (!totpService.verify(user.getOtpSecret(), otpCode)) {
                throw new BizException(40000, "OTP 验证码错误");
            }
        } else {
            // No OTP — must use email verification code
            if (emailCode == null || emailCode.isBlank()) {
                throw new BizException(40000, "请输入邮件验证码");
            }
            if (!authRedis.verifyEmailCode(userId, emailCode)) {
                throw new BizException(40000, "邮件验证码错误或已过期");
            }
        }
    }
}
