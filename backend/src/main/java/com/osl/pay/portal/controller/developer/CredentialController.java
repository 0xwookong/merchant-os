package com.osl.pay.portal.controller.developer;

import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.CredentialResponse;
import com.osl.pay.portal.security.AuthUserDetails;
import com.osl.pay.portal.service.CredentialService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/credentials")
@RequiredArgsConstructor
public class CredentialController {

    private final CredentialService credentialService;

    @GetMapping
    public Result<CredentialResponse> getCredentials(
            @AuthenticationPrincipal AuthUserDetails user) {
        return Result.ok(credentialService.getCredentials(user.getMerchantId()));
    }
}
