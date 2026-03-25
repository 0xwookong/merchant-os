package com.osl.pay.portal.service;

import com.osl.pay.portal.model.dto.InviteMemberRequest;
import com.osl.pay.portal.model.dto.MemberResponse;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

public interface MemberService {
    List<MemberResponse> list(Long merchantId);
    MemberResponse invite(Long merchantId, Long currentUserId, InviteMemberRequest request, HttpServletRequest httpRequest);
    void remove(Long merchantId, Long currentUserId, Long memberId, HttpServletRequest httpRequest);
    void resendInvite(Long merchantId, Long currentUserId, Long memberId, HttpServletRequest httpRequest);
}
