package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.osl.pay.portal.common.audit.AuditEventType;
import com.osl.pay.portal.common.audit.AuditService;
import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.model.dto.InviteMemberRequest;
import com.osl.pay.portal.model.dto.MemberResponse;
import com.osl.pay.portal.model.entity.MerchantUser;
import com.osl.pay.portal.model.enums.UserRole;
import com.osl.pay.portal.model.enums.UserStatus;
import com.osl.pay.portal.repository.MerchantUserMapper;
import com.osl.pay.portal.security.AuthRedisService;
import com.osl.pay.portal.service.EmailService;
import com.osl.pay.portal.service.MemberService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final MerchantUserMapper merchantUserMapper;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final AuthRedisService authRedis;

    private static final Set<String> VALID_ROLES = Set.of("ADMIN", "BUSINESS", "TECH");

    @Override
    public List<MemberResponse> list(Long merchantId) {
        return merchantUserMapper.selectList(
                new LambdaQueryWrapper<MerchantUser>()
                        .eq(MerchantUser::getMerchantId, merchantId)
                        .orderByAsc(MerchantUser::getCreatedAt))
                .stream().map(this::toResponse).toList();
    }

    @Override
    public MemberResponse invite(Long merchantId, Long currentUserId, InviteMemberRequest request, HttpServletRequest httpRequest) {
        if (!VALID_ROLES.contains(request.getRole())) {
            throw new BizException(40000, "无效的角色");
        }

        // Check duplicate within same merchant
        Long count = merchantUserMapper.selectCount(
                new LambdaQueryWrapper<MerchantUser>()
                        .eq(MerchantUser::getMerchantId, merchantId)
                        .eq(MerchantUser::getEmail, request.getEmail()));
        if (count > 0) {
            throw new BizException(40000, "该邮箱已在团队中");
        }

        // Create user with temporary password (invited user sets password via email link)
        String tempPassword = UUID.randomUUID().toString();

        MerchantUser user = new MerchantUser();
        user.setMerchantId(merchantId);
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setContactName(request.getContactName() != null ? request.getContactName() : request.getEmail().split("@")[0]);
        user.setRole(UserRole.valueOf(request.getRole()));
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerified(false); // Pending invitation
        merchantUserMapper.insert(user);

        // Generate activation token and send invitation email with link
        String activateToken = UUID.randomUUID().toString().replace("-", "");
        authRedis.saveResetToken(activateToken, user.getId());
        emailService.sendInvitation(request.getEmail(), user.getContactName(), activateToken);

        auditService.log("MEMBER_INVITED", currentUserId, merchantId,
                request.getEmail(), httpRequest, true,
                "Invited as " + request.getRole());

        log.info("Member invited: merchantId={}, email={}, role={}", merchantId, request.getEmail(), request.getRole());
        return toResponse(user);
    }

    @Override
    public void remove(Long merchantId, Long currentUserId, Long memberId, HttpServletRequest httpRequest) {
        if (currentUserId.equals(memberId)) {
            throw new BizException(40000, "无法移除自己的账号");
        }

        MerchantUser user = merchantUserMapper.selectById(memberId);
        if (user == null || !user.getMerchantId().equals(merchantId)) {
            throw new BizException(40400, "成员不存在");
        }

        merchantUserMapper.deleteById(memberId);

        auditService.log("MEMBER_REMOVED", currentUserId, merchantId,
                user.getEmail(), httpRequest, true,
                "Removed member: " + user.getContactName());

        log.info("Member removed: merchantId={}, memberId={}", merchantId, memberId);
    }

    @Override
    public void resendInvite(Long merchantId, Long currentUserId, Long memberId, HttpServletRequest httpRequest) {
        MerchantUser user = merchantUserMapper.selectById(memberId);
        if (user == null || !user.getMerchantId().equals(merchantId)) {
            throw new BizException(40400, "成员不存在");
        }

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BizException(40000, "该成员已激活，无需重新发送");
        }

        // Generate new activation token and send
        String activateToken = UUID.randomUUID().toString().replace("-", "");
        authRedis.saveResetToken(activateToken, user.getId());
        emailService.sendInvitation(user.getEmail(), user.getContactName(), activateToken);

        auditService.log("MEMBER_INVITE_RESENT", currentUserId, merchantId,
                user.getEmail(), httpRequest, true,
                "Resent invitation to " + user.getEmail());

        log.info("Invitation resent: merchantId={}, memberId={}, email={}", merchantId, memberId, user.getEmail());
    }

    private MemberResponse toResponse(MerchantUser u) {
        MemberResponse r = new MemberResponse();
        r.setId(u.getId());
        r.setContactName(u.getContactName());
        r.setEmail(u.getEmail());
        r.setRole(u.getRole().getValue());
        r.setStatus(Boolean.TRUE.equals(u.getEmailVerified()) ? "ACTIVE" : "PENDING");
        r.setCreatedAt(u.getCreatedAt());
        return r;
    }
}
