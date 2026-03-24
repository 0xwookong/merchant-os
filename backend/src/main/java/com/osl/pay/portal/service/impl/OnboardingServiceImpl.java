package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.osl.pay.portal.common.audit.AuditService;
import com.osl.pay.portal.common.context.EnvironmentContext;
import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.model.dto.OnboardingResponse;
import com.osl.pay.portal.model.dto.OnboardingSaveDraftRequest;
import com.osl.pay.portal.model.entity.OnboardingApplication;
import com.osl.pay.portal.repository.OnboardingApplicationMapper;
import com.osl.pay.portal.service.OnboardingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class OnboardingServiceImpl implements OnboardingService {

    private final OnboardingApplicationMapper onboardingMapper;
    private final AuditService auditService;

    private static final String ONBOARDING_SUBMIT = "ONBOARDING_SUBMIT";
    private static final Set<String> TERMINAL_STATUSES = Set.of("SUBMITTED", "UNDER_REVIEW", "APPROVED");

    @Override
    public OnboardingResponse getCurrent(Long merchantId) {
        OnboardingApplication app = findLatest(merchantId);
        if (app == null) return null;
        return toResponse(app);
    }

    @Override
    @Transactional
    public OnboardingResponse saveDraft(OnboardingSaveDraftRequest request, Long merchantId,
                                         HttpServletRequest httpRequest) {
        OnboardingApplication app = findLatest(merchantId);

        // If exists and already submitted/approved → block
        if (app != null && TERMINAL_STATUSES.contains(app.getStatus())) {
            throw new BizException(40001, "申请已提交，不能修改");
        }

        // Validate required fields when submitting (not when saving draft)
        if (request.isSubmit()) {
            validateForSubmit(request);
        }

        if (app == null) {
            app = new OnboardingApplication();
            app.setMerchantId(merchantId);
            app.setStatus("DRAFT");
        }

        // Copy fields
        app.setCurrentStep(request.getCurrentStep() != null ? request.getCurrentStep() : app.getCurrentStep());
        app.setCompanyName(request.getCompanyName());
        app.setCompanyAddress(request.getCompanyAddress());
        app.setContactName(request.getContactName());
        app.setContactPhone(request.getContactPhone());
        app.setContactEmail(request.getContactEmail());
        app.setBusinessType(request.getBusinessType());
        app.setMonthlyVolume(request.getMonthlyVolume());
        app.setSupportedFiat(request.getSupportedFiat());
        app.setSupportedCrypto(request.getSupportedCrypto());
        app.setBusinessDesc(request.getBusinessDesc());

        if (request.isSubmit()) {
            // Sandbox auto-approves, production waits for manual review
            app.setStatus(EnvironmentContext.isSandbox() ? "APPROVED" : "SUBMITTED");
        }

        if (app.getId() == null) {
            onboardingMapper.insert(app);
        } else {
            onboardingMapper.updateById(app);
        }

        if (request.isSubmit()) {
            auditService.log(ONBOARDING_SUBMIT, null, merchantId, null, httpRequest, true, null);
        }

        return toResponse(app);
    }

    @Override
    @Transactional
    public OnboardingResponse resetToDraft(Long merchantId, HttpServletRequest httpRequest) {
        OnboardingApplication app = findLatest(merchantId);
        if (app == null) {
            throw new BizException(40001, "暂无入驻申请");
        }
        if (!"REJECTED".equals(app.getStatus())) {
            throw new BizException(40001, "只有被拒绝的申请才能重新提交");
        }

        app.setStatus("DRAFT");
        app.setCurrentStep(1);
        app.setRejectReason(null);
        onboardingMapper.updateById(app);

        auditService.log("ONBOARDING_RESET", null, merchantId, null, httpRequest, true, null);
        return toResponse(app);
    }

    private OnboardingApplication findLatest(Long merchantId) {
        return onboardingMapper.selectOne(
                new LambdaQueryWrapper<OnboardingApplication>()
                        .eq(OnboardingApplication::getMerchantId, merchantId)
                        .orderByDesc(OnboardingApplication::getId)
                        .last("LIMIT 1"));
    }

    private void validateForSubmit(OnboardingSaveDraftRequest req) {
        if (isBlank(req.getCompanyName())) throw new BizException(40001, "公司名称不能为空");
        if (isBlank(req.getCompanyAddress())) throw new BizException(40001, "公司地址不能为空");
        if (isBlank(req.getContactName())) throw new BizException(40001, "联系人姓名不能为空");
        if (isBlank(req.getContactPhone())) throw new BizException(40001, "联系电话不能为空");
        if (isBlank(req.getContactEmail())) throw new BizException(40001, "联系邮箱不能为空");
        if (isBlank(req.getBusinessType())) throw new BizException(40001, "业务类型不能为空");
        if (isBlank(req.getMonthlyVolume())) throw new BizException(40001, "月交易量不能为空");
        if (isBlank(req.getSupportedFiat())) throw new BizException(40001, "支持的法币不能为空");
        if (isBlank(req.getSupportedCrypto())) throw new BizException(40001, "支持的加密货币不能为空");
        if (isBlank(req.getBusinessDesc())) throw new BizException(40001, "业务描述不能为空");
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private OnboardingResponse toResponse(OnboardingApplication app) {
        OnboardingResponse resp = new OnboardingResponse();
        resp.setId(app.getId());
        resp.setStatus(app.getStatus());
        resp.setCurrentStep(app.getCurrentStep());
        resp.setCompanyName(app.getCompanyName());
        resp.setCompanyAddress(app.getCompanyAddress());
        resp.setContactName(app.getContactName());
        resp.setContactPhone(app.getContactPhone());
        resp.setContactEmail(app.getContactEmail());
        resp.setBusinessType(app.getBusinessType());
        resp.setMonthlyVolume(app.getMonthlyVolume());
        resp.setSupportedFiat(app.getSupportedFiat());
        resp.setSupportedCrypto(app.getSupportedCrypto());
        resp.setBusinessDesc(app.getBusinessDesc());
        resp.setRejectReason(app.getRejectReason());
        return resp;
    }
}
