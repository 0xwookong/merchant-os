package com.osl.pay.portal.controller;

import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.RegisterRequest;
import com.osl.pay.portal.model.dto.RegisterResponse;
import com.osl.pay.portal.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public Result<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return Result.ok(response);
    }

    @GetMapping("/verify-email")
    public Result<String> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return Result.ok("邮箱验证成功");
    }
}
