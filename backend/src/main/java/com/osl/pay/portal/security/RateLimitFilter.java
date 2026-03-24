package com.osl.pay.portal.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.osl.pay.portal.common.result.Result;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * IP-based rate limiting for auth endpoints using Redis.
 * Does NOT write to DB (no audit log here — Redis counters are the evidence).
 * Two layers: per-endpoint limit + global per-IP limit.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    private static final String RATE_PREFIX = "rate:";

    private static final String LUA_INCR_EXPIRE = """
            local count = redis.call('INCR', KEYS[1])
            if count == 1 then
                redis.call('EXPIRE', KEYS[1], ARGV[1])
            end
            return count
            """;

    /** Per-endpoint rate limits: path → {max requests, window seconds} */
    private static final Map<String, int[]> ENDPOINT_RULES = Map.of(
        "/api/v1/auth/login",           new int[]{10, 60},
        "/api/v1/auth/register",        new int[]{5, 3600},
        "/api/v1/auth/forgot-password", new int[]{5, 3600},
        "/api/v1/auth/change-password", new int[]{5, 3600},
        "/api/v1/auth/reset-password",  new int[]{10, 3600},
        "/api/v1/auth/verify-email",    new int[]{10, 60},
        "/api/v1/auth/refresh",         new int[]{20, 60}
    );

    /** Global per-IP limit across all auth endpoints: 30 requests per minute */
    private static final int GLOBAL_MAX = 30;
    private static final int GLOBAL_WINDOW = 60;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        if (!path.startsWith("/api/v1/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);

        // Layer 1: Global per-IP limit (all auth endpoints combined)
        if (isOverLimit(RATE_PREFIX + "global:" + clientIp, GLOBAL_MAX, GLOBAL_WINDOW)) {
            writeRateLimitResponse(response);
            return;
        }

        // Layer 2: Per-endpoint limit
        int[] rule = findRule(path);
        if (rule != null) {
            String key = RATE_PREFIX + path + ":" + clientIp;
            if (isOverLimit(key, rule[0], rule[1])) {
                writeRateLimitResponse(response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isOverLimit(String key, int maxRequests, int windowSeconds) {
        Long count = redis.execute(
                RedisScript.of(LUA_INCR_EXPIRE, Long.class),
                List.of(key),
                String.valueOf(windowSeconds));
        return count != null && count > maxRequests;
    }

    private void writeRateLimitResponse(HttpServletResponse response) throws IOException {
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        Result<Void> result = Result.error(42900, "请求过于频繁，请稍后重试");
        response.getWriter().write(objectMapper.writeValueAsString(result));
    }

    private int[] findRule(String path) {
        for (var entry : ENDPOINT_RULES.entrySet()) {
            if (path.startsWith(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) return realIp;
        return request.getRemoteAddr();
    }
}
