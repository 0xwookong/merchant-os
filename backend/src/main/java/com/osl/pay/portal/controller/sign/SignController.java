package com.osl.pay.portal.controller.sign;

import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.*;
import com.osl.pay.portal.service.SignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sign")
@RequiredArgsConstructor
public class SignController {

    private final SignService signService;

    @PostMapping("/generate")
    public Result<SignGenerateResponse> generate(@Valid @RequestBody SignGenerateRequest request) {
        return Result.ok(signService.generateSignature(request));
    }

    @PostMapping("/verify")
    public Result<SignVerifyResponse> verify(@Valid @RequestBody SignVerifyRequest request) {
        return Result.ok(signService.verifySignature(request));
    }

    @PostMapping("/encrypt")
    public Result<EncryptResponse> encrypt(@Valid @RequestBody EncryptRequest request) {
        return Result.ok(signService.encryptData(request));
    }
}
