package com.osl.pay.portal.controller.developer;

import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.DomainRemoveRequest;
import com.osl.pay.portal.model.dto.DomainRequest;
import com.osl.pay.portal.model.dto.DomainResponse;
import com.osl.pay.portal.security.AuthUserDetails;
import com.osl.pay.portal.service.ActionVerificationService;
import com.osl.pay.portal.service.DomainService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/domains")
@RequiredArgsConstructor
public class DomainController {

    private final DomainService domainService;
    private final ActionVerificationService actionVerification;

    @GetMapping
    public Result<List<DomainResponse>> list(@AuthenticationPrincipal AuthUserDetails user) {
        return Result.ok(domainService.list(user.getMerchantId()));
    }

    @PostMapping
    public Result<DomainResponse> add(@AuthenticationPrincipal AuthUserDetails user,
                                      @Valid @RequestBody DomainRequest request,
                                      HttpServletRequest httpRequest) {
        actionVerification.verify(user.getUserId(), request.getOtpCode(), request.getEmailCode());
        return Result.ok(domainService.add(user.getMerchantId(), user.getUserId(), request.getDomain(), httpRequest));
    }

    @PostMapping("/{id}/remove")
    public Result<String> remove(@AuthenticationPrincipal AuthUserDetails user,
                                 @PathVariable Long id,
                                 @Valid @RequestBody DomainRemoveRequest request,
                                 HttpServletRequest httpRequest) {
        actionVerification.verify(user.getUserId(), request.getOtpCode(), request.getEmailCode());
        domainService.remove(user.getMerchantId(), user.getUserId(), id, httpRequest);
        return Result.ok("已删除");
    }
}
