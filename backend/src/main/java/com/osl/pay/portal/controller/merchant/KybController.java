package com.osl.pay.portal.controller.merchant;

import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.KybStatusResponse;
import com.osl.pay.portal.model.dto.KybSubmitRequest;
import com.osl.pay.portal.security.AuthUserDetails;
import com.osl.pay.portal.service.KybService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/kyb")
@RequiredArgsConstructor
public class KybController {

    private final KybService kybService;

    @GetMapping("/status")
    public Result<KybStatusResponse> getStatus(@AuthenticationPrincipal AuthUserDetails user) {
        return Result.ok(kybService.getStatus(user.getMerchantId()));
    }

    @PostMapping("/submit")
    public Result<String> submit(@Valid @RequestBody KybSubmitRequest request,
                                 @AuthenticationPrincipal AuthUserDetails user,
                                 HttpServletRequest httpRequest) {
        kybService.submit(request, user.getMerchantId(), httpRequest);
        return Result.ok("KYB 认证已提交，请等待审核");
    }
}
