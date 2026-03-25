package com.osl.pay.portal.service;

import com.osl.pay.portal.model.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {

    RegisterResponse register(RegisterRequest request, HttpServletRequest httpRequest);

    void verifyEmail(String token, HttpServletRequest httpRequest);

    LoginResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse);

    LoginResponse verifyLoginOtp(String otpToken, String code, HttpServletRequest httpRequest, HttpServletResponse httpResponse);

    LoginResponse refreshToken(String refreshToken, HttpServletRequest httpRequest, HttpServletResponse httpResponse);

    void logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse);

    void forgotPassword(ForgotPasswordRequest request, HttpServletRequest httpRequest);

    void resetPassword(ResetPasswordRequest request, HttpServletRequest httpRequest);

    /**
     * Change password for the currently authenticated user.
     * Requires valid old password. Revokes refresh token after success.
     */
    void changePassword(ChangePasswordRequest request, HttpServletRequest httpRequest);
}
