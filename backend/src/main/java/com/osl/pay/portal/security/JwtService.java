package com.osl.pay.portal.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;
    private final Duration accessExpire;
    private final Duration refreshExpire;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-expire-hours}") int accessExpireHours,
            @Value("${jwt.refresh-expire-days}") int refreshExpireDays) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpire = Duration.ofHours(accessExpireHours);
        this.refreshExpire = Duration.ofDays(refreshExpireDays);
    }

    public String generateAccessToken(Long userId, Long merchantId, String email, String role) {
        return buildToken(userId, merchantId, email, role, "access", accessExpire);
    }

    public String generateRefreshToken(Long userId, Long merchantId, String email, String role) {
        return buildToken(userId, merchantId, email, role, "refresh", refreshExpire);
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public long getRefreshExpireSeconds() {
        return refreshExpire.getSeconds();
    }

    private String buildToken(Long userId, Long merchantId, String email, String role,
                              String type, Duration expire) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expire.toMillis());

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(userId.toString())
                .claim("userId", userId)
                .claim("merchantId", merchantId)
                .claim("email", email)
                .claim("role", role)
                .claim("type", type)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }
}
