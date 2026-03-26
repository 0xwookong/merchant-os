package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.osl.pay.portal.common.audit.AuditEventType;
import com.osl.pay.portal.common.audit.AuditService;
import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.model.dto.*;
import com.osl.pay.portal.model.entity.Merchant;
import com.osl.pay.portal.model.entity.MerchantUser;
import com.osl.pay.portal.model.enums.*;
import com.osl.pay.portal.repository.MerchantMapper;
import com.osl.pay.portal.repository.MerchantUserMapper;
import com.osl.pay.portal.security.AuthRedisService;
import com.osl.pay.portal.security.AuthUserDetails;
import com.osl.pay.portal.security.JwtService;
import com.osl.pay.portal.service.AuthService;
import com.osl.pay.portal.service.EmailService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final MerchantMapper merchantMapper;
    private final MerchantUserMapper merchantUserMapper;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final AuthRedisService authRedis;
    private final AuditService auditService;
    private final com.osl.pay.portal.security.TotpService totpService;

    @Value("${server.ssl.enabled:false}")
    private boolean sslEnabled;

    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern DIGIT = Pattern.compile("[0-9]");

    /** Precomputed BCrypt hash for dummy password comparison (timing attack mitigation) */
    private static final String DUMMY_HASH = "$2a$10$dummyHashForTimingAttackMitigationXXXXXXXXXXXXXXXXXX";

    // ===== Register =====

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BizException(40001, "注册信息有误，请检查后重试");
        }

        validatePassword(request.getPassword(), request.getEmail());

        // Check email uniqueness (company name is auto-generated, always unique)
        Long existingUserCount = merchantUserMapper.selectCount(
                new LambdaQueryWrapper<MerchantUser>()
                        .eq(MerchantUser::getEmail, request.getEmail()));

        if (existingUserCount > 0) {
            auditService.log(AuditEventType.REGISTER, httpRequest, false, "duplicate email");
            throw new BizException(40002, "注册信息有误，请检查后重试或联系客服");
        }

        // Auto-generate company name if not provided (Stripe-like minimal registration)
        String companyName = (request.getCompanyName() != null && !request.getCompanyName().isBlank())
                ? request.getCompanyName()
                : "M-" + UUID.randomUUID().toString().substring(0, 8);

        // Check company name uniqueness (only if user provided one)
        if (request.getCompanyName() != null && !request.getCompanyName().isBlank()) {
            Long existingMerchantCount = merchantMapper.selectCount(
                    new LambdaQueryWrapper<Merchant>()
                            .eq(Merchant::getCompanyName, companyName));
            if (existingMerchantCount > 0) {
                throw new BizException(40002, "注册信息有误，请检查后重试或联系客服");
            }
        }

        Merchant merchant = new Merchant();
        merchant.setCompanyName(companyName);
        merchant.setStatus(MerchantStatus.ACTIVE);
        merchantMapper.insert(merchant);

        // Default contact name to email prefix if not provided
        String contactName = (request.getContactName() != null && !request.getContactName().isBlank())
                ? request.getContactName()
                : request.getEmail().split("@")[0];

        MerchantUser user = new MerchantUser();
        user.setMerchantId(merchant.getId());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setContactName(contactName);
        user.setRole(UserRole.ADMIN);
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerified(false);
        merchantUserMapper.insert(user);

        String verifyToken = generateToken();
        authRedis.saveVerifyToken(verifyToken, user.getId());
        emailService.sendVerificationEmail(request.getEmail(), verifyToken);

        auditService.log(AuditEventType.REGISTER, user.getId(), merchant.getId(),
                request.getEmail(), httpRequest, true, null);

        return new RegisterResponse(merchant.getId(), user.getId(), request.getEmail(),
                "注册成功，请查收验证邮件");
    }

    // ===== Verify Email =====

    @Override
    @Transactional
    public void verifyEmail(String token, HttpServletRequest httpRequest) {
        Long userId = authRedis.getAndDeleteVerifyToken(token);
        if (userId == null) {
            auditService.log(AuditEventType.EMAIL_VERIFIED, httpRequest, false, "invalid/expired token");
            throw new BizException(40003, "验证链接无效或已过期，如已验证请直接登录");
        }

        MerchantUser user = merchantUserMapper.selectById(userId);
        if (user == null) {
            throw new BizException(40003, "验证链接无效或已过期");
        }

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            merchantUserMapper.update(new LambdaUpdateWrapper<MerchantUser>()
                    .eq(MerchantUser::getId, user.getId())
                    .set(MerchantUser::getEmailVerified, true));
        }

        auditService.log(AuditEventType.EMAIL_VERIFIED, user.getId(), user.getMerchantId(),
                user.getEmail(), httpRequest, true, null);
    }

    // ===== Login =====

    @Override
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        List<MerchantUser> users = merchantUserMapper.selectList(
                new LambdaQueryWrapper<MerchantUser>()
                        .eq(MerchantUser::getEmail, request.getEmail()));

        if (users.isEmpty()) {
            // Timing attack mitigation: still run BCrypt comparison
            passwordEncoder.matches(request.getPassword(), DUMMY_HASH);
            auditService.log(AuditEventType.LOGIN_FAILED, httpRequest, false, "email not found");
            throw new BizException(40101, "账号或密码错误");
        }

        // Check lock (per-user, via Redis)
        for (MerchantUser u : users) {
            if (authRedis.isLocked(u.getId())) {
                auditService.log(AuditEventType.LOGIN_LOCKED, u.getId(), u.getMerchantId(),
                        u.getEmail(), httpRequest, false, null);
                throw new BizException(40102, "账号已锁定，请稍后重试");
            }
        }

        // Password match
        List<MerchantUser> matched = users.stream()
                .filter(u -> passwordEncoder.matches(request.getPassword(), u.getPasswordHash()))
                .toList();

        if (matched.isEmpty()) {
            for (MerchantUser u : users) {
                authRedis.incrementFailCount(u.getId());
            }
            auditService.log(AuditEventType.LOGIN_FAILED, httpRequest, false, "wrong password");
            throw new BizException(40101, "账号或密码错误");
        }

        // Narrow by merchantId if specified
        if (request.getMerchantId() != null) {
            matched = matched.stream()
                    .filter(u -> u.getMerchantId().equals(request.getMerchantId()))
                    .toList();
            if (matched.isEmpty()) {
                throw new BizException(40101, "账号或密码错误");
            }
        }

        // Multiple merchants → selection list
        if (matched.size() > 1) {
            List<Long> merchantIds = matched.stream().map(MerchantUser::getMerchantId).toList();
            Map<Long, Merchant> merchantMap = merchantMapper.selectBatchIds(merchantIds)
                    .stream().collect(Collectors.toMap(Merchant::getId, m -> m));
            List<MerchantSelectItem> items = matched.stream()
                    .map(u -> new MerchantSelectItem(u.getMerchantId(),
                            merchantMap.get(u.getMerchantId()).getCompanyName(),
                            u.getRole().getValue()))
                    .toList();
            return LoginResponse.selectMerchant(items);
        }

        // Single match → final checks
        MerchantUser user = matched.get(0);

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BizException(40103, "请先验证邮箱");
        }

        Merchant merchant = merchantMapper.selectById(user.getMerchantId());
        if (merchant == null || merchant.getStatus() != MerchantStatus.ACTIVE) {
            throw new BizException(40104, "商户已停用");
        }

        // OTP check — if enabled, don't issue tokens yet
        if (Boolean.TRUE.equals(user.getOtpEnabled())) {
            authRedis.resetFailCount(user.getId());
            String otpToken = generateToken();
            authRedis.saveOtpLoginToken(otpToken, user.getId());
            auditService.log(AuditEventType.LOGIN_OTP_REQUIRED, user.getId(), user.getMerchantId(),
                    user.getEmail(), httpRequest, true, null);
            return LoginResponse.requireOtp(otpToken);
        }

        // Success — no OTP required
        return issueTokens(user, merchant, httpRequest, httpResponse);
    }

    /**
     * Verify OTP code during login and issue tokens.
     */
    public LoginResponse verifyLoginOtp(String otpToken, String code,
                                         HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        Long userId = authRedis.getAndDeleteOtpLoginToken(otpToken);
        if (userId == null) {
            throw new BizException(40101, "验证已过期，请重新登录");
        }

        MerchantUser user = merchantUserMapper.selectById(userId);
        if (user == null || !Boolean.TRUE.equals(user.getOtpEnabled())) {
            throw new BizException(40101, "验证失败");
        }

        // Try TOTP code first, then recovery code
        boolean verified = totpService.verify(user.getOtpSecret(), code);
        if (!verified) {
            verified = tryRecoveryCode(user, code);
        }

        if (!verified) {
            // Put token back so user can retry
            String newOtpToken = generateToken();
            authRedis.saveOtpLoginToken(newOtpToken, userId);
            auditService.log(AuditEventType.LOGIN_FAILED, userId, user.getMerchantId(),
                    user.getEmail(), httpRequest, false, "wrong OTP");
            throw new BizException(40106, "验证码错误");
        }

        Merchant merchant = merchantMapper.selectById(user.getMerchantId());
        if (merchant == null || merchant.getStatus() != MerchantStatus.ACTIVE) {
            throw new BizException(40104, "商户已停用");
        }

        return issueTokens(user, merchant, httpRequest, httpResponse);
    }

    private LoginResponse issueTokens(MerchantUser user, Merchant merchant,
                                       HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        authRedis.resetFailCount(user.getId());
        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getMerchantId(), user.getEmail(), user.getRole().getValue());
        String refreshToken = jwtService.generateRefreshToken(
                user.getId(), user.getMerchantId(), user.getEmail(), user.getRole().getValue());
        authRedis.saveRefreshToken(user.getId(), user.getMerchantId(), refreshToken);
        setRefreshTokenCookie(httpResponse, refreshToken);

        auditService.log(AuditEventType.LOGIN_SUCCESS, user.getId(), user.getMerchantId(),
                user.getEmail(), httpRequest, true, null);

        LoginResponse resp = LoginResponse.success(accessToken, user.getId(), user.getMerchantId(),
                user.getEmail(), user.getRole().getValue(), merchant.getCompanyName());
        resp.setRefreshToken(refreshToken); // TODO: remove before production (TD-003)
        return resp;
    }

    // ===== Refresh Token (with rotation) =====

    @Override
    public LoginResponse refreshToken(String refreshToken, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        if (refreshToken == null || !jwtService.validateToken(refreshToken)) {
            throw new BizException(40105, "刷新令牌无效或已过期");
        }

        var claims = jwtService.parseToken(refreshToken);
        if (!"refresh".equals(claims.get("type", String.class))) {
            throw new BizException(40105, "刷新令牌无效或已过期");
        }

        Long userId = claims.get("userId", Long.class);
        Long merchantId = claims.get("merchantId", Long.class);
        String email = claims.get("email", String.class);
        String role = claims.get("role", String.class);

        if (!authRedis.isRefreshTokenValid(userId, merchantId, refreshToken)) {
            throw new BizException(40105, "刷新令牌无效或已过期");
        }

        MerchantUser user = merchantUserMapper.selectById(userId);
        if (user == null || user.getStatus() != UserStatus.ACTIVE) {
            throw new BizException(40105, "刷新令牌无效或已过期");
        }

        Merchant merchant = merchantMapper.selectById(merchantId);
        String companyName = merchant != null ? merchant.getCompanyName() : "";

        // Rotation: issue new tokens, invalidate old
        String newAccessToken = jwtService.generateAccessToken(userId, merchantId, email, role);
        String newRefreshToken = jwtService.generateRefreshToken(userId, merchantId, email, role);
        authRedis.saveRefreshToken(userId, merchantId, newRefreshToken);
        setRefreshTokenCookie(httpResponse, newRefreshToken);

        auditService.log(AuditEventType.TOKEN_REFRESH, userId, merchantId, email, httpRequest, true, null);

        LoginResponse resp = LoginResponse.success(newAccessToken, userId, merchantId, email, role, companyName);
        resp.setRefreshToken(newRefreshToken); // TODO: remove before production (TD-003)
        return resp;
    }

    // ===== Logout =====

    @Override
    public void logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        // Try to get user context from JWT
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthUserDetails userDetails) {
            authRedis.revokeRefreshToken(userDetails.getUserId(), userDetails.getMerchantId());
            auditService.log(AuditEventType.LOGOUT, userDetails.getUserId(), userDetails.getMerchantId(),
                    userDetails.getEmail(), httpRequest, true, null);
        }

        // Clear cookie regardless
        Cookie cookie = new Cookie("refresh_token", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(sslEnabled);
        cookie.setPath("/api/v1/auth/refresh");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", sslEnabled ? "Strict" : "Lax");
        httpResponse.addCookie(cookie);

        SecurityContextHolder.clearContext();
    }

    // ===== Forgot Password =====

    @Override
    public void forgotPassword(ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        List<MerchantUser> users = merchantUserMapper.selectList(
                new LambdaQueryWrapper<MerchantUser>()
                        .eq(MerchantUser::getEmail, request.getEmail()));

        // Always log, but do NOT reveal whether email exists
        auditService.log(AuditEventType.PASSWORD_RESET_REQUEST, httpRequest, users.isEmpty(),
                "email_exists=" + !users.isEmpty());

        if (users.isEmpty()) {
            return; // Silent: don't reveal email existence
        }

        Map<String, String> resetTokens = new LinkedHashMap<>();
        for (MerchantUser user : users) {
            String resetToken = generateToken();
            authRedis.saveResetToken(resetToken, user.getId());
            Merchant merchant = merchantMapper.selectById(user.getMerchantId());
            String companyName = merchant != null ? merchant.getCompanyName() : "Unknown";
            resetTokens.put(companyName, resetToken);
        }

        emailService.sendPasswordResetEmail(request.getEmail(), resetTokens);
    }

    // ===== Reset Password =====

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request, HttpServletRequest httpRequest) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BizException(40001, "两次密码不一致");
        }

        Long userId = authRedis.getAndDeleteResetToken(request.getToken());
        if (userId == null) {
            auditService.log(AuditEventType.PASSWORD_RESET, httpRequest, false, "invalid/expired token");
            throw new BizException(40003, "重置链接无效或已过期");
        }

        MerchantUser user = merchantUserMapper.selectById(userId);
        if (user == null) {
            throw new BizException(40003, "重置链接无效或已过期");
        }

        validatePassword(request.getNewPassword(), user.getEmail());

        LambdaUpdateWrapper<MerchantUser> updateWrapper = new LambdaUpdateWrapper<MerchantUser>()
                .eq(MerchantUser::getId, user.getId())
                .set(MerchantUser::getPasswordHash, passwordEncoder.encode(request.getNewPassword()));

        // Also activate email if not yet verified (handles invited member activation)
        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            updateWrapper.set(MerchantUser::getEmailVerified, true);
        }

        merchantUserMapper.update(updateWrapper);

        authRedis.revokeRefreshToken(user.getId(), user.getMerchantId());
        authRedis.resetFailCount(user.getId());

        auditService.log(AuditEventType.PASSWORD_RESET, user.getId(), user.getMerchantId(),
                user.getEmail(), httpRequest, true, null);
    }

    // ===== Private helpers =====

    private void validatePassword(String password, String email) {
        if (password.length() < 8 || password.length() > 72) {
            throw new BizException(40001, "密码长度为 8-72 个字符");
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

    // ===== Change Password =====

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request, HttpServletRequest httpRequest) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BizException(40001, "两次密码不一致");
        }

        // Get current user from SecurityContext
        var auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthUserDetails userDetails)) {
            throw new BizException(40101, "未登录");
        }

        MerchantUser user = merchantUserMapper.selectById(userDetails.getUserId());
        if (user == null) {
            throw new BizException(40101, "用户不存在");
        }

        // Verify old password
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            auditService.log(AuditEventType.PASSWORD_CHANGE, user.getId(), user.getMerchantId(),
                    user.getEmail(), httpRequest, false, "wrong old password");
            throw new BizException(40101, "旧密码错误");
        }

        // Check new password != old password
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BizException(40001, "新密码不能与旧密码相同");
        }

        validatePassword(request.getNewPassword(), user.getEmail());

        merchantUserMapper.update(new LambdaUpdateWrapper<MerchantUser>()
                .eq(MerchantUser::getId, user.getId())
                .set(MerchantUser::getPasswordHash, passwordEncoder.encode(request.getNewPassword())));

        // Revoke refresh token → force re-login
        authRedis.revokeRefreshToken(user.getId(), user.getMerchantId());
        authRedis.resetFailCount(user.getId());

        auditService.log(AuditEventType.PASSWORD_CHANGE, user.getId(), user.getMerchantId(),
                user.getEmail(), httpRequest, true, null);
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie("refresh_token", refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(sslEnabled); // false in dev (HTTP), true in prod (HTTPS)
        cookie.setPath("/api/v1/auth/refresh");
        cookie.setMaxAge((int) jwtService.getRefreshExpireSeconds());
        cookie.setAttribute("SameSite", sslEnabled ? "Strict" : "Lax");
        response.addCookie(cookie);
    }

    /**
     * Try to match a recovery code. If matched, consume it (remove from DB).
     */
    private boolean tryRecoveryCode(MerchantUser user, String code) {
        if (user.getOtpRecoveryCodes() == null) return false;

        try {
            com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.List<String> hashedCodes = om.readValue(user.getOtpRecoveryCodes(),
                    om.getTypeFactory().constructCollectionType(java.util.List.class, String.class));

            for (int i = 0; i < hashedCodes.size(); i++) {
                if (passwordEncoder.matches(code, hashedCodes.get(i))) {
                    // Consume this recovery code
                    hashedCodes.remove(i);
                    String updated = om.writeValueAsString(hashedCodes);
                    merchantUserMapper.update(new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<MerchantUser>()
                            .eq(MerchantUser::getId, user.getId())
                            .set(MerchantUser::getOtpRecoveryCodes, hashedCodes.isEmpty() ? null : updated));
                    log.info("Recovery code used for userId={}, remaining={}", user.getId(), hashedCodes.size());
                    return true;
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse recovery codes for userId={}", user.getId(), e);
        }
        return false;
    }

    private String generateToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
