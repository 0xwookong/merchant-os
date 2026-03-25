package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.osl.pay.portal.common.audit.AuditService;
import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.model.dto.OtpBindResponse;
import com.osl.pay.portal.model.dto.OtpSetupResponse;
import com.osl.pay.portal.model.dto.OtpStatusResponse;
import com.osl.pay.portal.model.entity.MerchantUser;
import com.osl.pay.portal.repository.MerchantUserMapper;
import com.osl.pay.portal.security.AuthRedisService;
import com.osl.pay.portal.security.TotpService;
import com.osl.pay.portal.service.OtpService;
import jakarta.servlet.http.HttpServletRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private final MerchantUserMapper merchantUserMapper;
    private final TotpService totpService;
    private final AuthRedisService authRedis;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    private static final int RECOVERY_CODE_COUNT = 8;
    private static final SecureRandom RANDOM = new SecureRandom();

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
    public OtpBindResponse verifyAndBind(Long userId, String code, HttpServletRequest httpRequest) {
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
            authRedis.saveOtpSetupSecret(userId, secret);
            throw new BizException(40000, "验证码错误，请重试");
        }

        // Generate recovery codes
        List<String> plainCodes = new ArrayList<>();
        List<String> hashedCodes = new ArrayList<>();
        for (int i = 0; i < RECOVERY_CODE_COUNT; i++) {
            String rc = String.format("%04d-%04d", RANDOM.nextInt(10000), RANDOM.nextInt(10000));
            plainCodes.add(rc);
            hashedCodes.add(passwordEncoder.encode(rc));
        }

        String recoveryCodesJson;
        try {
            recoveryCodesJson = objectMapper.writeValueAsString(hashedCodes);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize recovery codes", e);
        }

        merchantUserMapper.update(new LambdaUpdateWrapper<MerchantUser>()
                .eq(MerchantUser::getId, userId)
                .set(MerchantUser::getOtpSecret, secret)
                .set(MerchantUser::getOtpEnabled, true)
                .set(MerchantUser::getOtpRecoveryCodes, recoveryCodesJson));

        auditService.log("OTP_BOUND", userId, user.getMerchantId(),
                user.getEmail(), httpRequest, true, null);

        log.info("OTP bound for userId={}, recoveryCodes={} generated", userId, RECOVERY_CODE_COUNT);
        return new OtpBindResponse(plainCodes);
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
                .set(MerchantUser::getOtpEnabled, false)
                .set(MerchantUser::getOtpRecoveryCodes, null));

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
