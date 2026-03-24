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
