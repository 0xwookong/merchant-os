package com.osl.pay.portal.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Redis-backed storage for auth temporary state:
 * - Email verification tokens
 * - Password reset tokens
 * - Login failure counters + account lock
 * - Refresh token storage (for revocation)
 */
@Service
@RequiredArgsConstructor
public class AuthRedisService {

    private final StringRedisTemplate redis;

    @Value("${auth.verify-token-expire-minutes}")
    private int verifyExpireMinutes;

    @Value("${auth.reset-token-expire-minutes}")
    private int resetExpireMinutes;

    @Value("${auth.login-max-fail-count}")
    private int maxFailCount;

    @Value("${auth.login-lock-minutes}")
    private int lockMinutes;

    @Value("${jwt.refresh-expire-days}")
    private int refreshExpireDays;

    // ===== Verification Token =====

    private static final String VERIFY_PREFIX = "auth:verify:";

    public void saveVerifyToken(String token, Long userId) {
        redis.opsForValue().set(
                VERIFY_PREFIX + token,
                userId.toString(),
                Duration.ofMinutes(verifyExpireMinutes));
    }

    /** Returns userId if token is valid, null otherwise */
    public Long getAndDeleteVerifyToken(String token) {
        String userId = redis.opsForValue().getAndDelete(VERIFY_PREFIX + token);
        return userId != null ? Long.valueOf(userId) : null;
    }

    // ===== Reset Token =====

    private static final String RESET_PREFIX = "auth:reset:";

    public void saveResetToken(String token, Long userId) {
        redis.opsForValue().set(
                RESET_PREFIX + token,
                userId.toString(),
                Duration.ofMinutes(resetExpireMinutes));
    }

    /** Returns userId if token is valid, null otherwise */
    public Long getAndDeleteResetToken(String token) {
        String userId = redis.opsForValue().getAndDelete(RESET_PREFIX + token);
        return userId != null ? Long.valueOf(userId) : null;
    }

    // ===== Email Verification Code =====

    private static final String EMAIL_CODE_PREFIX = "auth:email-code:";
    private static final int EMAIL_CODE_EXPIRE_MINUTES = 5;
    private static final int EMAIL_CODE_MAX_ATTEMPTS = 5;

    public void saveEmailCode(Long userId, String code) {
        // Store as "code:0" (code + attempt counter)
        redis.opsForValue().set(
                EMAIL_CODE_PREFIX + userId,
                code + ":0",
                Duration.ofMinutes(EMAIL_CODE_EXPIRE_MINUTES));
    }

    /**
     * Verify email code. Returns true if valid. Consumes the code on success.
     * Increments attempt counter on failure. Returns false if expired, wrong, or max attempts.
     */
    public boolean verifyEmailCode(Long userId, String code) {
        String key = EMAIL_CODE_PREFIX + userId;
        String stored = redis.opsForValue().get(key);
        if (stored == null) return false;

        String[] parts = stored.split(":");
        if (parts.length != 2) return false;

        int attempts = Integer.parseInt(parts[1]);
        if (attempts >= EMAIL_CODE_MAX_ATTEMPTS) {
            redis.delete(key);
            return false;
        }

        if (parts[0].equals(code)) {
            redis.delete(key);
            return true;
        }

        // Wrong code — increment attempts
        redis.opsForValue().set(key, parts[0] + ":" + (attempts + 1),
                Duration.ofMinutes(EMAIL_CODE_EXPIRE_MINUTES));
        return false;
    }

    /** Check if a code was recently sent (rate limit: 1 per minute) */
    public boolean hasRecentEmailCode(Long userId) {
        return redis.hasKey(EMAIL_CODE_PREFIX + userId) == Boolean.TRUE;
    }

    // ===== OTP Setup (temporary secret before binding) =====

    private static final String OTP_SETUP_PREFIX = "auth:otp-setup:";
    private static final int OTP_SETUP_EXPIRE_MINUTES = 10;

    public void saveOtpSetupSecret(Long userId, String secret) {
        redis.opsForValue().set(
                OTP_SETUP_PREFIX + userId,
                secret,
                Duration.ofMinutes(OTP_SETUP_EXPIRE_MINUTES));
    }

    public String getAndDeleteOtpSetupSecret(Long userId) {
        return redis.opsForValue().getAndDelete(OTP_SETUP_PREFIX + userId);
    }

    // ===== Login Failure Counter =====

    private static final String FAIL_PREFIX = "auth:login-fail:";

    /**
     * Atomically increment login failure count and set TTL.
     * Uses Lua script to ensure increment + expire are atomic (no race condition).
     * Returns the new count.
     */
    public long incrementFailCount(Long merchantUserId) {
        String key = FAIL_PREFIX + merchantUserId;
        // Lua script: INCR + set expire only if key is new (TTL = -1 means no expiry set)
        String luaScript = """
                local count = redis.call('INCR', KEYS[1])
                if count == 1 then
                    redis.call('EXPIRE', KEYS[1], ARGV[1])
                end
                return count
                """;
        Long count = redis.execute(
                org.springframework.data.redis.core.script.RedisScript.of(luaScript, Long.class),
                java.util.List.of(key),
                String.valueOf(lockMinutes * 60));
        return count != null ? count : 0;
    }

    /** Returns current failure count (0 if key doesn't exist = not locked) */
    public int getFailCount(Long merchantUserId) {
        String val = redis.opsForValue().get(FAIL_PREFIX + merchantUserId);
        return val != null ? Integer.parseInt(val) : 0;
    }

    /** Check if account is locked (fail count >= max) */
    public boolean isLocked(Long merchantUserId) {
        return getFailCount(merchantUserId) >= maxFailCount;
    }

    /** Reset failure counter on successful login */
    public void resetFailCount(Long merchantUserId) {
        redis.delete(FAIL_PREFIX + merchantUserId);
    }

    // ===== Refresh Token =====

    private static final String REFRESH_PREFIX = "auth:refresh:";

    /** Store refresh token for revocation support */
    public void saveRefreshToken(Long userId, Long merchantId, String refreshToken) {
        redis.opsForValue().set(
                REFRESH_PREFIX + userId + ":" + merchantId,
                refreshToken,
                Duration.ofDays(refreshExpireDays));
    }

    /** Validate that the refresh token matches what's stored (not revoked) */
    public boolean isRefreshTokenValid(Long userId, Long merchantId, String refreshToken) {
        String stored = redis.opsForValue().get(REFRESH_PREFIX + userId + ":" + merchantId);
        return refreshToken.equals(stored);
    }

    /** Revoke refresh token (on logout or password change) */
    public void revokeRefreshToken(Long userId, Long merchantId) {
        redis.delete(REFRESH_PREFIX + userId + ":" + merchantId);
    }
}
