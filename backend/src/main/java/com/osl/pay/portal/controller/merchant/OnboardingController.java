package com.osl.pay.portal.controller.merchant;

import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.OnboardingResponse;
import com.osl.pay.portal.model.dto.OnboardingSaveDraftRequest;
import com.osl.pay.portal.security.AuthUserDetails;
import com.osl.pay.portal.service.OnboardingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService onboardingService;

    @GetMapping("/current")
    public Result<OnboardingResponse> getCurrent(@AuthenticationPrincipal AuthUserDetails user) {
        return Result.ok(onboardingService.getCurrent(user.getMerchantId()));
    }

    @PostMapping("/save-draft")
    public Result<OnboardingResponse> saveDraft(@Valid @RequestBody OnboardingSaveDraftRequest request,
                                                @AuthenticationPrincipal AuthUserDetails user,
                                                HttpServletRequest httpRequest) {
        return Result.ok(onboardingService.saveDraft(request, user.getMerchantId(), httpRequest));
    }
}
