package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.osl.pay.portal.common.audit.AuditService;
import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.model.dto.KybStatusResponse;
import com.osl.pay.portal.model.dto.KybSubmitRequest;
import com.osl.pay.portal.model.entity.KybApplication;
import com.osl.pay.portal.model.entity.Merchant;
import com.osl.pay.portal.model.enums.KybStatus;
import com.osl.pay.portal.repository.KybApplicationMapper;
import com.osl.pay.portal.repository.MerchantMapper;
import com.osl.pay.portal.service.KybService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class KybServiceImpl implements KybService {

    private final MerchantMapper merchantMapper;
    private final KybApplicationMapper kybApplicationMapper;
    private final AuditService auditService;

    private static final String KYB_SUBMIT = "KYB_SUBMIT";

    @Override
    public KybStatusResponse getStatus(Long merchantId) {
        Merchant merchant = merchantMapper.selectById(merchantId);
        if (merchant == null) {
            throw new BizException(40400, "商户不存在");
        }

        String rejectReason = null;
        if (merchant.getKybStatus() == KybStatus.REJECTED) {
            KybApplication latest = kybApplicationMapper.selectOne(
                    new LambdaQueryWrapper<KybApplication>()
                            .eq(KybApplication::getMerchantId, merchantId)
                            .orderByDesc(KybApplication::getId)
                            .last("LIMIT 1"));
            if (latest != null) {
                rejectReason = latest.getRejectReason();
            }
        }

        return new KybStatusResponse(merchant.getKybStatus().getValue(), rejectReason);
    }

    @Override
    @Transactional
    public void submit(KybSubmitRequest request, Long merchantId, HttpServletRequest httpRequest) {
        Merchant merchant = merchantMapper.selectById(merchantId);
        if (merchant == null) {
            throw new BizException(40400, "商户不存在");
        }

        KybStatus currentStatus = merchant.getKybStatus();
        if (currentStatus == KybStatus.PENDING) {
            throw new BizException(40001, "已提交审核，请等待");
        }
        if (currentStatus == KybStatus.APPROVED) {
            throw new BizException(40001, "已通过认证");
        }
        // NOT_STARTED, REJECTED, NEED_MORE_INFO → allow submit

        KybApplication app = new KybApplication();
        app.setMerchantId(merchantId);
        app.setCompanyRegCountry(request.getCompanyRegCountry());
        app.setCompanyRegNumber(request.getCompanyRegNumber());
        app.setBusinessLicenseNo(request.getBusinessLicenseNo());
        app.setCompanyType(request.getCompanyType());
        app.setLegalRepName(request.getLegalRepName());
        app.setLegalRepNationality(request.getLegalRepNationality());
        app.setLegalRepIdType(request.getLegalRepIdType());
        app.setLegalRepIdNumber(request.getLegalRepIdNumber());
        app.setLegalRepSharePct(request.getLegalRepSharePct());
        app.setStatus("PENDING");
        kybApplicationMapper.insert(app);

        // Update merchant KYB status
        merchantMapper.update(new LambdaUpdateWrapper<Merchant>()
                .eq(Merchant::getId, merchantId)
                .set(Merchant::getKybStatus, KybStatus.PENDING));

        auditService.log(KYB_SUBMIT, null, merchantId, null, httpRequest, true, null);
    }
}
