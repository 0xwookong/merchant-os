package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.osl.pay.portal.common.audit.AuditService;
import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.model.dto.OtpSetupResponse;
import com.osl.pay.portal.model.dto.OtpStatusResponse;
import com.osl.pay.portal.model.entity.MerchantUser;
import com.osl.pay.portal.repository.MerchantUserMapper;
import com.osl.pay.portal.security.AuthRedisService;
import com.osl.pay.portal.security.TotpService;
import com.osl.pay.portal.service.OtpService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private final MerchantUserMapper merchantUserMapper;
    private final TotpService totpService;
    private final AuthRedisService authRedis;
    private final AuditService auditService;

    @Override
    public OtpSetupResponse setup(Long userId, HttpServletRequest httpRequest) {
        MerchantUser user = merchantUserMapper.selectById(userId);
        if (user == null) throw new BizException(40400, "用户不存在");

        if (Boolean.TRUE.equals(user.getOtpEnabled())) {
            throw new BizException(40000, "OTP 已绑定，请先解绑后再重新设置");
        }

        String secret = totpService.generateSecret();
        authRedis.saveOtpSetupSecret(userId, secret);

        String otpAuthUri = totpService.generateOtpAuthUri(secret, user.getEmail());

        log.info("OTP setup initiated for userId={}", userId);
        return new OtpSetupResponse(secret, otpAuthUri);
    }

    @Override
    @Transactional
    public void verifyAndBind(Long userId, String code, HttpServletRequest httpRequest) {
        MerchantUser user = merchantUserMapper.selectById(userId);
        if (user == null) throw new BizException(40400, "用户不存在");

        if (Boolean.TRUE.equals(user.getOtpEnabled())) {
            throw new BizException(40000, "OTP 已绑定");
        }

        String secret = authRedis.getAndDeleteOtpSetupSecret(userId);
        if (secret == null) {
            throw new BizException(40000, "请先调用 setup 接口获取二维码");
        }

        if (!totpService.verify(secret, code)) {
            // Put secret back so user can retry
            authRedis.saveOtpSetupSecret(userId, secret);
            throw new BizException(40000, "验证码错误，请重试");
        }

        merchantUserMapper.update(new LambdaUpdateWrapper<MerchantUser>()
                .eq(MerchantUser::getId, userId)
                .set(MerchantUser::getOtpSecret, secret)
                .set(MerchantUser::getOtpEnabled, true));

        auditService.log("OTP_BOUND", userId, user.getMerchantId(),
                user.getEmail(), httpRequest, true, null);

        log.info("OTP bound for userId={}", userId);
    }

    @Override
    @Transactional
    public void verifyAndUnbind(Long userId, String code, HttpServletRequest httpRequest) {
        MerchantUser user = merchantUserMapper.selectById(userId);
        if (user == null) throw new BizException(40400, "用户不存在");

        if (!Boolean.TRUE.equals(user.getOtpEnabled())) {
            throw new BizException(40000, "OTP 未绑定");
        }

        if (!totpService.verify(user.getOtpSecret(), code)) {
            throw new BizException(40000, "验证码错误");
        }

        merchantUserMapper.update(new LambdaUpdateWrapper<MerchantUser>()
                .eq(MerchantUser::getId, userId)
                .set(MerchantUser::getOtpSecret, null)
                .set(MerchantUser::getOtpEnabled, false));

        auditService.log("OTP_UNBOUND", userId, user.getMerchantId(),
                user.getEmail(), httpRequest, true, null);

        log.info("OTP unbound for userId={}", userId);
    }

    @Override
    public OtpStatusResponse getStatus(Long userId) {
        MerchantUser user = merchantUserMapper.selectById(userId);
        if (user == null) throw new BizException(40400, "用户不存在");
        return new OtpStatusResponse(Boolean.TRUE.equals(user.getOtpEnabled()));
    }
}
