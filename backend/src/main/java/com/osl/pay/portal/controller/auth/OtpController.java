package com.osl.pay.portal.controller.auth;

import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.*;
import com.osl.pay.portal.security.AuthUserDetails;
import com.osl.pay.portal.service.EmailCodeService;
import com.osl.pay.portal.service.OtpService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/security")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;
    private final EmailCodeService emailCodeService;

    // ===== OTP =====

    @GetMapping("/otp/status")
    public Result<OtpStatusResponse> otpStatus(@AuthenticationPrincipal AuthUserDetails user) {
        return Result.ok(otpService.getStatus(user.getUserId()));
    }

    @PostMapping("/otp/setup")
    public Result<OtpSetupResponse> otpSetup(@AuthenticationPrincipal AuthUserDetails user,
                                              HttpServletRequest httpRequest) {
        return Result.ok(otpService.setup(user.getUserId(), httpRequest));
    }

    @PostMapping("/otp/verify-bind")
    public Result<OtpBindResponse> otpVerifyBind(@AuthenticationPrincipal AuthUserDetails user,
                                                  @Valid @RequestBody OtpVerifyRequest request,
                                                  HttpServletRequest httpRequest) {
        return Result.ok(otpService.verifyAndBind(user.getUserId(), request.getCode(), httpRequest));
    }

    @PostMapping("/otp/unbind")
    public Result<String> otpUnbind(@AuthenticationPrincipal AuthUserDetails user,
                                     @Valid @RequestBody OtpVerifyRequest request,
                                     HttpServletRequest httpRequest) {
        otpService.verifyAndUnbind(user.getUserId(), request.getCode(), httpRequest);
        return Result.ok("OTP 已解绑");
    }

    // ===== Email Verification Code =====

    @PostMapping("/email-code/send")
    public Result<String> sendEmailCode(@AuthenticationPrincipal AuthUserDetails user,
                                         HttpServletRequest httpRequest) {
        emailCodeService.sendCode(user.getUserId(), httpRequest);
        return Result.ok("验证码已发送");
    }

    @PostMapping("/email-code/verify")
    public Result<Map<String, String>> verifyEmailCode(@AuthenticationPrincipal AuthUserDetails user,
                                                        @Valid @RequestBody EmailCodeRequest request,
                                                        HttpServletRequest httpRequest) {
        String actionToken = emailCodeService.verifyCode(user.getUserId(), request.getCode(), httpRequest);
        return Result.ok(Map.of("actionToken", actionToken));
    }
}
