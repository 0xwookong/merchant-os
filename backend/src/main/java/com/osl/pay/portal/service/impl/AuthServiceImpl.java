package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.model.dto.RegisterRequest;
import com.osl.pay.portal.model.dto.RegisterResponse;
import com.osl.pay.portal.model.entity.Merchant;
import com.osl.pay.portal.model.entity.MerchantUser;
import com.osl.pay.portal.model.enums.*;
import com.osl.pay.portal.repository.MerchantMapper;
import com.osl.pay.portal.repository.MerchantUserMapper;
import com.osl.pay.portal.service.AuthService;
import com.osl.pay.portal.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final MerchantMapper merchantMapper;
    private final MerchantUserMapper merchantUserMapper;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${mail.verify-token-expire-minutes}")
    private int verifyTokenExpireMinutes;

    /**
     * Password must be at least 8 chars and contain at least 2 of: uppercase, lowercase, digits.
     */
    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern DIGIT = Pattern.compile("[0-9]");

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        // 1. Confirm password match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BizException(40001, "两次密码不一致");
        }

        // 2. Password rules
        validatePassword(request.getPassword(), request.getEmail());

        // 3. Check if same email + company already registered (prevent accidental double registration)
        // Query: find merchants with this company name, then check if email exists under any of them
        List<Long> existingMerchantIds = merchantMapper.selectList(
                new LambdaQueryWrapper<Merchant>()
                        .eq(Merchant::getCompanyName, request.getCompanyName())
                        .select(Merchant::getId))
                .stream().map(Merchant::getId).toList();

        if (!existingMerchantIds.isEmpty()) {
            Long duplicateCount = merchantUserMapper.selectCount(
                    new LambdaQueryWrapper<MerchantUser>()
                            .eq(MerchantUser::getEmail, request.getEmail())
                            .in(MerchantUser::getMerchantId, existingMerchantIds));
            if (duplicateCount > 0) {
                throw new BizException(40002, "该邮箱已在此公司下注册");
            }
        }

        // 4. Create merchant (tenant)
        Merchant merchant = new Merchant();
        merchant.setCompanyName(request.getCompanyName());
        merchant.setStatus(MerchantStatus.ACTIVE);
        merchant.setKybStatus(KybStatus.NOT_STARTED);
        merchantMapper.insert(merchant);

        // 5. Create admin user
        String verifyToken = UUID.randomUUID().toString().replace("-", "");
        LocalDateTime tokenExpire = LocalDateTime.now().plusMinutes(verifyTokenExpireMinutes);

        MerchantUser user = new MerchantUser();
        user.setMerchantId(merchant.getId());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setContactName(request.getContactName());
        user.setRole(UserRole.ADMIN);
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerified(false);
        user.setVerifyToken(verifyToken);
        user.setVerifyTokenExpire(tokenExpire);
        user.setFailedLoginCount(0);
        merchantUserMapper.insert(user);

        // 6. Send verification email
        emailService.sendVerificationEmail(request.getEmail(), verifyToken);

        log.info("Merchant registered: merchantId={}, userId={}, email={}",
                merchant.getId(), user.getId(), request.getEmail());

        return new RegisterResponse(
                merchant.getId(),
                user.getId(),
                request.getEmail(),
                "注册成功，请查收验证邮件"
        );
    }

    @Override
    @Transactional
    public void verifyEmail(String token) {
        MerchantUser user = merchantUserMapper.selectOne(
                new LambdaQueryWrapper<MerchantUser>()
                        .eq(MerchantUser::getVerifyToken, token));

        if (user == null) {
            throw new BizException(40003, "验证链接无效");
        }

        if (user.getVerifyTokenExpire().isBefore(LocalDateTime.now())) {
            throw new BizException(40004, "验证链接已过期");
        }

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BizException(40005, "邮箱已验证，无需重复操作");
        }

        merchantUserMapper.update(new LambdaUpdateWrapper<MerchantUser>()
                .eq(MerchantUser::getId, user.getId())
                .set(MerchantUser::getEmailVerified, true)
                .set(MerchantUser::getVerifyToken, null)
                .set(MerchantUser::getVerifyTokenExpire, null));

        log.info("Email verified: userId={}, email={}", user.getId(), user.getEmail());
    }

    private void validatePassword(String password, String email) {
        if (password.length() < 8) {
            throw new BizException(40001, "密码至少 8 个字符");
        }

        int typeCount = 0;
        if (UPPERCASE.matcher(password).find()) typeCount++;
        if (LOWERCASE.matcher(password).find()) typeCount++;
        if (DIGIT.matcher(password).find()) typeCount++;

        if (typeCount < 2) {
            throw new BizException(40001, "密码需包含大写字母、小写字母、数字中的至少两种");
        }

        if (password.equalsIgnoreCase(email)) {
            throw new BizException(40001, "密码不能与邮箱相同");
        }
    }
}
