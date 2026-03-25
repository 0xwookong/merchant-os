package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.osl.pay.portal.common.audit.AuditEventType;
import com.osl.pay.portal.common.audit.AuditService;
import com.osl.pay.portal.common.exception.BizException;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.osl.pay.portal.model.dto.ChangeRoleRequest;
import com.osl.pay.portal.model.dto.InviteMemberRequest;
import com.osl.pay.portal.model.dto.MemberResponse;
import com.osl.pay.portal.model.entity.MerchantUser;
import com.osl.pay.portal.model.enums.UserRole;
import com.osl.pay.portal.model.enums.UserStatus;
import com.osl.pay.portal.repository.MerchantUserMapper;
import com.osl.pay.portal.security.AuthRedisService;
import com.osl.pay.portal.service.ActionVerificationService;
import com.osl.pay.portal.service.EmailService;
import com.osl.pay.portal.service.MemberService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final ActionVerificationService actionVerification;

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
    public void remove(Long merchantId, Long currentUserId, Long memberId,
                        String otpCode, String emailCode, HttpServletRequest httpRequest) {
        if (currentUserId.equals(memberId)) {
            throw new BizException(40000, "无法移除自己的账号");
        }

        MerchantUser user = merchantUserMapper.selectById(memberId);
        if (user == null || !user.getMerchantId().equals(merchantId)) {
            throw new BizException(40400, "成员不存在");
        }

        // Verify the admin's identity before destructive action
        actionVerification.verify(currentUserId, otpCode, emailCode);

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

    @Override
    public MemberResponse changeRole(Long merchantId, Long currentUserId, Long memberId,
                                      ChangeRoleRequest request, HttpServletRequest httpRequest) {
        if (!VALID_ROLES.contains(request.getRole())) {
            throw new BizException(40000, "无效的角色");
        }

        if (currentUserId.equals(memberId)) {
            throw new BizException(40000, "无法修改自己的角色");
        }

        MerchantUser target = merchantUserMapper.selectById(memberId);
        if (target == null || !target.getMerchantId().equals(merchantId)) {
            throw new BizException(40400, "成员不存在");
        }

        if (target.getRole().getValue().equals(request.getRole())) {
            throw new BizException(40000, "角色未变更");
        }

        // Verify action (OTP or email code)
        actionVerification.verify(currentUserId, request.getOtpCode(), request.getEmailCode());

        String oldRole = target.getRole().getValue();
        merchantUserMapper.update(new LambdaUpdateWrapper<MerchantUser>()
                .eq(MerchantUser::getId, memberId)
                .set(MerchantUser::getRole, UserRole.valueOf(request.getRole())));

        auditService.log("MEMBER_ROLE_CHANGED", currentUserId, merchantId,
                target.getEmail(), httpRequest, true,
                "Role changed: " + oldRole + " → " + request.getRole());

        log.info("Member role changed: merchantId={}, memberId={}, {} → {}", merchantId, memberId, oldRole, request.getRole());

        target.setRole(UserRole.valueOf(request.getRole()));
        return toResponse(target);
    }

    @Override
    @Transactional
    public void resetOtp(Long merchantId, Long currentUserId, Long memberId,
                          String otpCode, String emailCode, HttpServletRequest httpRequest) {
        if (currentUserId.equals(memberId)) {
            throw new BizException(40000, "请通过安全设置自行解绑 OTP");
        }

        MerchantUser target = merchantUserMapper.selectById(memberId);
        if (target == null || !target.getMerchantId().equals(merchantId)) {
            throw new BizException(40400, "成员不存在");
        }

        if (!Boolean.TRUE.equals(target.getOtpEnabled())) {
            throw new BizException(40000, "该成员未绑定 OTP");
        }

        // Verify the ADMIN's own identity
        actionVerification.verify(currentUserId, otpCode, emailCode);

        merchantUserMapper.update(new LambdaUpdateWrapper<MerchantUser>()
                .eq(MerchantUser::getId, memberId)
                .set(MerchantUser::getOtpSecret, null)
                .set(MerchantUser::getOtpEnabled, false)
                .set(MerchantUser::getOtpRecoveryCodes, null));

        auditService.log("MEMBER_OTP_RESET", currentUserId, merchantId,
                target.getEmail(), httpRequest, true,
                "Admin reset OTP for " + target.getContactName());

        log.info("Admin reset OTP: merchantId={}, targetMemberId={}", merchantId, memberId);
    }

    private MemberResponse toResponse(MerchantUser u) {
        MemberResponse r = new MemberResponse();
        r.setId(u.getId());
        r.setContactName(u.getContactName());
        r.setEmail(u.getEmail());
        r.setRole(u.getRole().getValue());
        r.setStatus(Boolean.TRUE.equals(u.getEmailVerified()) ? "ACTIVE" : "PENDING");
        r.setOtpEnabled(Boolean.TRUE.equals(u.getOtpEnabled()));
        r.setCreatedAt(u.getCreatedAt());
        return r;
    }
}
