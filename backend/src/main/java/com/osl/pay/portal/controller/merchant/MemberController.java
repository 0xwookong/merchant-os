package com.osl.pay.portal.controller.merchant;

import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.InviteMemberRequest;
import com.osl.pay.portal.model.dto.MemberResponse;
import com.osl.pay.portal.security.AuthUserDetails;
import com.osl.pay.portal.service.MemberService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @GetMapping
    public Result<List<MemberResponse>> list(@AuthenticationPrincipal AuthUserDetails user) {
        return Result.ok(memberService.list(user.getMerchantId()));
    }

    @PostMapping("/invite")
    public Result<MemberResponse> invite(@AuthenticationPrincipal AuthUserDetails user,
                                         @Valid @RequestBody InviteMemberRequest request,
                                         HttpServletRequest httpRequest) {
        return Result.ok(memberService.invite(user.getMerchantId(), user.getUserId(), request, httpRequest));
    }

    @DeleteMapping("/{id}")
    public Result<String> remove(@AuthenticationPrincipal AuthUserDetails user,
                                 @PathVariable Long id,
                                 HttpServletRequest httpRequest) {
        memberService.remove(user.getMerchantId(), user.getUserId(), id, httpRequest);
        return Result.ok("已移除");
    }
}
