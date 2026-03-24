package com.osl.pay.portal.controller;

import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.*;
import com.osl.pay.portal.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public Result<RegisterResponse> register(@Valid @RequestBody RegisterRequest request,
                                             HttpServletRequest httpRequest) {
        return Result.ok(authService.register(request, httpRequest));
    }

    @GetMapping("/verify-email")
    public Result<String> verifyEmail(@RequestParam String token,
                                      HttpServletRequest httpRequest) {
        authService.verifyEmail(token, httpRequest);
        return Result.ok("邮箱验证成功");
    }

    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request,
                                       HttpServletRequest httpRequest,
                                       HttpServletResponse httpResponse) {
        return Result.ok(authService.login(request, httpRequest, httpResponse));
    }

    @PostMapping("/refresh")
    public Result<LoginResponse> refresh(@RequestBody(required = false) RefreshRequest body,
                                         HttpServletRequest httpRequest,
                                         HttpServletResponse httpResponse) {
        // Try body first (localStorage dev flow), then cookie (production httpOnly flow)
        String refreshToken = (body != null && body.getRefreshToken() != null)
                ? body.getRefreshToken()
                : extractRefreshTokenFromCookie(httpRequest);
        return Result.ok(authService.refreshToken(refreshToken, httpRequest, httpResponse));
    }

    @PostMapping("/logout")
    public Result<String> logout(HttpServletRequest httpRequest,
                                 HttpServletResponse httpResponse) {
        authService.logout(httpRequest, httpResponse);
        return Result.ok("已登出");
    }

    @PostMapping("/forgot-password")
    public Result<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request,
                                         HttpServletRequest httpRequest) {
        authService.forgotPassword(request, httpRequest);
        return Result.ok("如果该邮箱已注册，您将收到密码重置邮件");
    }

    @PostMapping("/reset-password")
    public Result<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request,
                                        HttpServletRequest httpRequest) {
        authService.resetPassword(request, httpRequest);
        return Result.ok("密码重置成功，请使用新密码登录");
    }

    @PostMapping("/change-password")
    public Result<String> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                         HttpServletRequest httpRequest) {
        authService.changePassword(request, httpRequest);
        return Result.ok("密码修改成功，请重新登录");
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> "refresh_token".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
