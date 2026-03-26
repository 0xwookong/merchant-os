package com.osl.pay.portal.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Authenticates /api/internal/** requests using a shared API key in X-Internal-Key header.
 * Skips all other paths (handled by JWT filter instead).
 */
@Slf4j
@Component
public class InternalApiKeyFilter extends OncePerRequestFilter {

    private static final String HEADER = "X-Internal-Key";
    private static final String PATH_PREFIX = "/api/internal/";

    @Value("${oslpay.internal.api-key}")
    private String expectedKey;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith(PATH_PREFIX);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String key = request.getHeader(HEADER);

        if (key == null || !key.equals(expectedKey)) {
            log.warn("Internal API key rejected: path={}, ip={}", request.getRequestURI(), request.getRemoteAddr());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"code\":40100,\"message\":\"Invalid internal API key\",\"data\":null}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
