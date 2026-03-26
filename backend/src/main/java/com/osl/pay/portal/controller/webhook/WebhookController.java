package com.osl.pay.portal.controller.webhook;

import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.WebhookCreateRequest;
import com.osl.pay.portal.model.dto.WebhookLogResponse;
import com.osl.pay.portal.model.dto.WebhookRemoveRequest;
import com.osl.pay.portal.model.dto.WebhookResponse;
import com.osl.pay.portal.security.AuthUserDetails;
import com.osl.pay.portal.service.ActionVerificationService;
import com.osl.pay.portal.service.WebhookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final WebhookService webhookService;
    private final ActionVerificationService actionVerification;

    @GetMapping
    public Result<List<WebhookResponse>> list(@AuthenticationPrincipal AuthUserDetails user) {
        return Result.ok(webhookService.list(user.getMerchantId()));
    }

    @PostMapping
    public Result<WebhookResponse> create(@AuthenticationPrincipal AuthUserDetails user,
                                          @Valid @RequestBody WebhookCreateRequest request) {
        return Result.ok(webhookService.create(user.getMerchantId(), request));
    }

    @PutMapping("/{id}")
    public Result<WebhookResponse> update(@AuthenticationPrincipal AuthUserDetails user,
                                          @PathVariable Long id,
                                          @Valid @RequestBody WebhookCreateRequest request) {
        return Result.ok(webhookService.update(user.getMerchantId(), id, request));
    }

    @DeleteMapping("/{id}")
    public Result<String> delete(@AuthenticationPrincipal AuthUserDetails user,
                                 @PathVariable Long id) {
        webhookService.delete(user.getMerchantId(), id);
        return Result.ok("已删除");
    }

    @PostMapping("/{id}/remove")
    public Result<String> remove(@AuthenticationPrincipal AuthUserDetails user,
                                 @PathVariable Long id,
                                 @Valid @RequestBody WebhookRemoveRequest request) {
        actionVerification.verify(user.getUserId(), request.getOtpCode(), request.getEmailCode());
        webhookService.delete(user.getMerchantId(), id);
        return Result.ok("已删除");
    }

    @PostMapping("/{id}/test")
    public Result<String> testPush(@AuthenticationPrincipal AuthUserDetails user,
                                   @PathVariable Long id) {
        return Result.ok(webhookService.testPush(user.getMerchantId(), id));
    }

    @GetMapping("/{id}/logs")
    public Result<List<WebhookLogResponse>> getLogs(@AuthenticationPrincipal AuthUserDetails user,
                                                    @PathVariable Long id) {
        return Result.ok(webhookService.getLogs(user.getMerchantId(), id));
    }
}
