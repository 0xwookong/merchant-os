package com.osl.pay.portal.controller.merchant;

import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.*;
import com.osl.pay.portal.security.AuthUserDetails;
import com.osl.pay.portal.service.MerchantApplicationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/application")
@RequiredArgsConstructor
public class MerchantApplicationController {

    private final MerchantApplicationService applicationService;

    @GetMapping("/current")
    public Result<ApplicationResponse> getCurrent(@AuthenticationPrincipal AuthUserDetails user) {
        log.info("GET /application/current merchantId={}", user.getMerchantId());
        return Result.ok(applicationService.getCurrent(user.getMerchantId()));
    }

    @PostMapping("/save-draft")
    public Result<ApplicationResponse> saveDraft(@Valid @RequestBody ApplicationSaveDraftRequest request,
                                                  @AuthenticationPrincipal AuthUserDetails user,
                                                  HttpServletRequest httpRequest) {
        return Result.ok(applicationService.saveDraft(request, user.getMerchantId(),
                user.getUserId(), httpRequest));
    }

    @PostMapping("/submit")
    public Result<ApplicationResponse> submit(@RequestBody ApplicationSubmitRequest request,
                                               @AuthenticationPrincipal AuthUserDetails user,
                                               HttpServletRequest httpRequest) {
        return Result.ok(applicationService.submit(request, user.getMerchantId(),
                user.getUserId(), httpRequest));
    }

    @PostMapping("/resubmit")
    public Result<ApplicationResponse> resubmit(@RequestBody ApplicationSubmitRequest request,
                                                 @AuthenticationPrincipal AuthUserDetails user,
                                                 HttpServletRequest httpRequest) {
        return Result.ok(applicationService.resubmit(request, user.getMerchantId(),
                user.getUserId(), httpRequest));
    }

    @PostMapping("/documents")
    public Result<DocumentResponse> uploadDocument(@AuthenticationPrincipal AuthUserDetails user,
                                                    @RequestParam("file") MultipartFile file,
                                                    @RequestParam("docType") String docType,
                                                    @RequestParam(value = "uboIndex", required = false) Integer uboIndex,
                                                    HttpServletRequest httpRequest) {
        return Result.ok(applicationService.uploadDocument(user.getMerchantId(),
                user.getUserId(), docType, uboIndex, file, httpRequest));
    }

    @DeleteMapping("/documents/{id}")
    public Result<String> deleteDocument(@AuthenticationPrincipal AuthUserDetails user,
                                          @PathVariable Long id,
                                          HttpServletRequest httpRequest) {
        applicationService.deleteDocument(user.getMerchantId(), user.getUserId(), id, httpRequest);
        return Result.ok("已删除");
    }

    @GetMapping("/documents")
    public Result<List<DocumentResponse>> listDocuments(@AuthenticationPrincipal AuthUserDetails user) {
        return Result.ok(applicationService.listDocuments(user.getMerchantId()));
    }
}
