package com.osl.pay.portal.controller.developer;

import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.ApiRequestLogResponse;
import com.osl.pay.portal.security.AuthUserDetails;
import com.osl.pay.portal.service.ApiRequestLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/logs")
@RequiredArgsConstructor
public class LogController {

    private final ApiRequestLogService logService;

    @GetMapping
    public Result<List<ApiRequestLogResponse>> getLatest(
            @AuthenticationPrincipal AuthUserDetails user) {
        return Result.ok(logService.getLatest(user.getMerchantId()));
    }
}
