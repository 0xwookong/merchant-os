package com.osl.pay.portal.controller.auth;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.osl.pay.portal.common.audit.AuditEventType;
import com.osl.pay.portal.common.audit.AuditService;
import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.ProfileResponse;
import com.osl.pay.portal.model.dto.UpdateProfileRequest;
import com.osl.pay.portal.model.entity.Merchant;
import com.osl.pay.portal.model.entity.MerchantUser;
import com.osl.pay.portal.repository.MerchantMapper;
import com.osl.pay.portal.repository.MerchantUserMapper;
import com.osl.pay.portal.security.AuthUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/account")
@RequiredArgsConstructor
public class AccountController {

    private final MerchantUserMapper merchantUserMapper;
    private final MerchantMapper merchantMapper;
    private final AuditService auditService;

    @GetMapping("/profile")
    public Result<ProfileResponse> getProfile(@AuthenticationPrincipal AuthUserDetails user) {
        MerchantUser mu = merchantUserMapper.selectById(user.getUserId());
        if (mu == null) throw new BizException(40400, "User not found");

        Merchant merchant = merchantMapper.selectById(user.getMerchantId());

        ProfileResponse resp = new ProfileResponse();
        resp.setCompanyName(merchant != null ? merchant.getCompanyName() : "");
        resp.setContactName(mu.getContactName());
        resp.setEmail(mu.getEmail());
        resp.setRole(mu.getRole().getValue());
        resp.setCreatedAt(mu.getCreatedAt());
        return Result.ok(resp);
    }

    @PutMapping("/profile")
    public Result<ProfileResponse> updateProfile(
            @AuthenticationPrincipal AuthUserDetails user,
            @Valid @RequestBody UpdateProfileRequest request,
            HttpServletRequest httpRequest) {
        merchantUserMapper.update(new LambdaUpdateWrapper<MerchantUser>()
                .eq(MerchantUser::getId, user.getUserId())
                .set(MerchantUser::getContactName, request.getContactName().trim()));

        auditService.log(AuditEventType.PROFILE_UPDATED, user.getUserId(), user.getMerchantId(),
                user.getEmail(), httpRequest, true, "contactName updated");

        return getProfile(user);
    }
}
