package com.osl.pay.portal.controller.developer;

import com.osl.pay.portal.common.audit.AuditEventType;
import com.osl.pay.portal.common.audit.AuditService;
import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.CredentialResponse;
import com.osl.pay.portal.model.dto.CredentialRotateRequest;
import com.osl.pay.portal.security.AuthUserDetails;
import com.osl.pay.portal.service.ActionVerificationService;
import com.osl.pay.portal.service.CredentialService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/credentials")
@RequiredArgsConstructor
public class CredentialController {

    private final CredentialService credentialService;
    private final ActionVerificationService actionVerification;
    private final AuditService auditService;

    @GetMapping
    public Result<CredentialResponse> getCredentials(
            @AuthenticationPrincipal AuthUserDetails user) {
        return Result.ok(credentialService.getCredentials(user.getMerchantId()));
    }

    @PostMapping("/rotate")
    public Result<CredentialResponse> rotateKeys(
            @AuthenticationPrincipal AuthUserDetails user,
            @Valid @RequestBody CredentialRotateRequest request,
            HttpServletRequest httpRequest) {
        actionVerification.verify(user.getUserId(), request.getOtpCode(), request.getEmailCode());

        CredentialResponse response = "api".equals(request.getKeyType())
                ? credentialService.rotateApiKeys(user.getMerchantId())
                : credentialService.rotateWebhookKeys(user.getMerchantId());

        auditService.log(AuditEventType.CREDENTIAL_ROTATED, user.getUserId(), user.getMerchantId(),
                user.getEmail(), httpRequest, true, "keyType=" + request.getKeyType());

        return Result.ok(response);
    }
}
