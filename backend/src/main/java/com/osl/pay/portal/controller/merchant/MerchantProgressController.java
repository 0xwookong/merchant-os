package com.osl.pay.portal.controller.merchant;

import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.MerchantProgressResponse;
import com.osl.pay.portal.security.AuthUserDetails;
import com.osl.pay.portal.service.MerchantProgressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/merchant")
@RequiredArgsConstructor
public class MerchantProgressController {

    private final MerchantProgressService progressService;

    @GetMapping("/progress")
    public Result<MerchantProgressResponse> getProgress(
            @AuthenticationPrincipal AuthUserDetails user) {
        log.info("GET /merchant/progress merchantId={}", user.getMerchantId());
        return Result.ok(progressService.getProgress(user.getMerchantId()));
    }
}
