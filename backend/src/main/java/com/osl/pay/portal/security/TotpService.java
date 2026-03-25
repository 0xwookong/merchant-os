package com.osl.pay.portal.security;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * TOTP (RFC 6238) implementation using JDK crypto.
 * Compatible with Google Authenticator, Authy, etc.
 */
@Service
public class TotpService {

    private static final int SECRET_BYTES = 20;
    private static final int CODE_DIGITS = 6;
    private static final int TIME_STEP_SECONDS = 30;
    private static final int ALLOWED_DRIFT = 1; // allow ±1 time step (90s window)
    private static final String ISSUER = "OSL Pay";

    private static final char[] BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".toCharArray();

    /**
     * Generate a new random TOTP secret (Base32 encoded).
     */
    public String generateSecret() {
        byte[] bytes = new byte[SECRET_BYTES];
        new SecureRandom().nextBytes(bytes);
        return base32Encode(bytes);
    }

    /**
     * Generate otpauth:// URI for QR code scanning.
     */
    public String generateOtpAuthUri(String secret, String accountEmail) {
        return "otpauth://totp/" + ISSUER + ":" + urlEncode(accountEmail)
                + "?secret=" + secret
                + "&issuer=" + urlEncode(ISSUER)
                + "&algorithm=SHA1"
                + "&digits=" + CODE_DIGITS
                + "&period=" + TIME_STEP_SECONDS;
    }

    /**
     * Verify a TOTP code with allowed time drift.
     */
    public boolean verify(String secret, String code) {
        if (secret == null || code == null || code.length() != CODE_DIGITS) {
            return false;
        }

        long currentTimeStep = System.currentTimeMillis() / 1000 / TIME_STEP_SECONDS;
        byte[] keyBytes = base32Decode(secret);

        for (int i = -ALLOWED_DRIFT; i <= ALLOWED_DRIFT; i++) {
            String expected = generateCode(keyBytes, currentTimeStep + i);
            if (timeSafeEquals(expected, code)) {
                return true;
            }
        }
        return false;
    }

    // ===== Internal =====

    private String generateCode(byte[] keyBytes, long timeStep) {
        byte[] timeBytes = new byte[8];
        for (int i = 7; i >= 0; i--) {
            timeBytes[i] = (byte) (timeStep & 0xFF);
            timeStep >>= 8;
        }

        byte[] hash;
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(keyBytes, "HmacSHA1"));
            hash = mac.doFinal(timeBytes);
        } catch (Exception e) {
            throw new RuntimeException("HMAC-SHA1 computation failed", e);
        }

        int offset = hash[hash.length - 1] & 0x0F;
        int truncated = ((hash[offset] & 0x7F) << 24)
                | ((hash[offset + 1] & 0xFF) << 16)
                | ((hash[offset + 2] & 0xFF) << 8)
                | (hash[offset + 3] & 0xFF);

        int otp = truncated % (int) Math.pow(10, CODE_DIGITS);
        return String.format("%0" + CODE_DIGITS + "d", otp);
    }

    private boolean timeSafeEquals(String a, String b) {
        if (a.length() != b.length()) return false;
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }

    // ===== Base32 =====

    private String base32Encode(byte[] data) {
        StringBuilder sb = new StringBuilder();
        int buffer = 0, bitsLeft = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xFF);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                sb.append(BASE32_CHARS[(buffer >> (bitsLeft - 5)) & 0x1F]);
                bitsLeft -= 5;
            }
        }
        if (bitsLeft > 0) {
            sb.append(BASE32_CHARS[(buffer << (5 - bitsLeft)) & 0x1F]);
        }
        return sb.toString();
    }

    private byte[] base32Decode(String encoded) {
        encoded = encoded.toUpperCase().replaceAll("[^A-Z2-7]", "");
        int outLen = encoded.length() * 5 / 8;
        byte[] result = new byte[outLen];
        int buffer = 0, bitsLeft = 0, index = 0;
        for (char c : encoded.toCharArray()) {
            int val = (c >= 'A' && c <= 'Z') ? c - 'A' : c - '2' + 26;
            buffer = (buffer << 5) | val;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                result[index++] = (byte) (buffer >> (bitsLeft - 8));
                bitsLeft -= 8;
            }
        }
        return result;
    }

    private String urlEncode(String s) {
        try {
            return java.net.URLEncoder.encode(s, "UTF-8").replace("+", "%20");
        } catch (Exception e) {
            return s;
        }
    }
}
