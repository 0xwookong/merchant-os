package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.osl.pay.portal.common.audit.AuditService;
import com.osl.pay.portal.common.context.EnvironmentContext;
import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.model.dto.*;
import com.osl.pay.portal.model.entity.ApplicationDocument;
import com.osl.pay.portal.model.entity.MerchantApplication;
import com.osl.pay.portal.repository.ApplicationDocumentMapper;
import com.osl.pay.portal.repository.MerchantApplicationMapper;
import com.osl.pay.portal.service.MerchantApplicationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MerchantApplicationServiceImpl implements MerchantApplicationService {

    private final MerchantApplicationMapper applicationMapper;
    private final ApplicationDocumentMapper documentMapper;
    private final AuditService auditService;

    private static final Set<String> IMMUTABLE_STATUSES = Set.of("SUBMITTED", "UNDER_REVIEW", "APPROVED");
    private static final Set<String> RESUBMITTABLE_STATUSES = Set.of("REJECTED", "NEED_MORE_INFO");
    private static final int MAX_UBO_COUNT = 10;
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf", "image/jpeg", "image/png");
    private static final Set<String> VALID_DOC_TYPES = Set.of(
            "BUSINESS_LICENSE", "ARTICLES", "LEGAL_REP_ID_FRONT", "LEGAL_REP_ID_BACK",
            "UBO_ID_FRONT", "UBO_ID_BACK", "BANK_STATEMENT", "SHARE_STRUCTURE", "OTHER");

    @Value("${oslpay.upload.path:uploads}")
    private String uploadBasePath;

    // ─── getCurrent ───

    @Override
    public ApplicationResponse getCurrent(Long merchantId) {
        MerchantApplication app = findLatest(merchantId);
        if (app == null) return null;
        return toResponse(app);
    }

    // ─── saveDraft ───

    @Override
    @Transactional
    public ApplicationResponse saveDraft(ApplicationSaveDraftRequest request, Long merchantId,
                                          Long userId, HttpServletRequest httpRequest) {
        MerchantApplication app = findLatest(merchantId);

        if (app != null && IMMUTABLE_STATUSES.contains(app.getStatus())) {
            throw new BizException(40000, "申请已提交，不能修改");
        }

        validateUbos(request);

        boolean isNew = (app == null);
        if (isNew) {
            app = new MerchantApplication();
            app.setMerchantId(merchantId);
            app.setStatus("DRAFT");
        }

        copyFields(request, app);

        if (isNew) {
            applicationMapper.insert(app);
        } else {
            applicationMapper.updateById(app);
        }

        auditService.log("APPLICATION_DRAFT_SAVED", userId, merchantId,
                null, httpRequest, true, "Step " + app.getCurrentStep());
        log.info("Application draft saved: merchantId={}, step={}", merchantId, app.getCurrentStep());
        return toResponse(app);
    }

    // ─── submit ───

    @Override
    @Transactional
    public ApplicationResponse submit(ApplicationSubmitRequest request, Long merchantId,
                                       Long userId, HttpServletRequest httpRequest) {
        MerchantApplication app = findLatest(merchantId);

        if (app == null) {
            throw new BizException(40000, "请先填写申请信息");
        }
        if (!"DRAFT".equals(app.getStatus())) {
            throw new BizException(40000, "只有草稿状态的申请才能提交");
        }

        // Validate all required fields
        validateForSubmit(app);

        // Validate compliance declarations
        validateDeclarations(request);

        // Set declarations
        app.setInfoAccuracyConfirmed(true);
        app.setSanctionsDeclared(true);
        app.setTermsAccepted(true);

        // Sandbox auto-approves, production goes to SUBMITTED
        app.setStatus(EnvironmentContext.isSandbox() ? "APPROVED" : "SUBMITTED");
        app.setSubmittedAt(LocalDateTime.now());
        applicationMapper.updateById(app);

        auditService.log("APPLICATION_SUBMITTED", userId, merchantId,
                null, httpRequest, true,
                "Status: " + app.getStatus());
        log.info("Application submitted: merchantId={}, status={}", merchantId, app.getStatus());
        return toResponse(app);
    }

    // ─── resubmit ───

    @Override
    @Transactional
    public ApplicationResponse resubmit(ApplicationSubmitRequest request, Long merchantId,
                                         Long userId, HttpServletRequest httpRequest) {
        MerchantApplication app = findLatest(merchantId);

        if (app == null) {
            throw new BizException(40000, "暂无入驻申请");
        }
        if (!RESUBMITTABLE_STATUSES.contains(app.getStatus())) {
            throw new BizException(40000, "只有被拒绝或需补充信息的申请才能重新提交");
        }

        // Validate all required fields
        validateForSubmit(app);
        validateDeclarations(request);

        app.setInfoAccuracyConfirmed(true);
        app.setSanctionsDeclared(true);
        app.setTermsAccepted(true);
        app.setStatus(EnvironmentContext.isSandbox() ? "APPROVED" : "SUBMITTED");
        app.setSubmittedAt(LocalDateTime.now());
        app.setRejectReason(null);
        app.setNeedInfoDetails(null);
        applicationMapper.updateById(app);

        auditService.log("APPLICATION_RESUBMITTED", userId, merchantId,
                null, httpRequest, true,
                "Status: " + app.getStatus());
        log.info("Application resubmitted: merchantId={}, status={}", merchantId, app.getStatus());
        return toResponse(app);
    }

    // ─── uploadDocument ───

    @Override
    @Transactional
    public DocumentResponse uploadDocument(Long merchantId, Long userId, String docType,
                                            Integer uboIndex, MultipartFile file,
                                            HttpServletRequest httpRequest) {
        MerchantApplication app = findLatest(merchantId);
        if (app == null) {
            throw new BizException(40000, "请先创建入驻申请");
        }
        if (IMMUTABLE_STATUSES.contains(app.getStatus())) {
            throw new BizException(40000, "申请已提交，不能上传文件");
        }

        if (!VALID_DOC_TYPES.contains(docType)) {
            throw new BizException(40000, "无效的文件类型: " + docType);
        }
        if (file.isEmpty()) {
            throw new BizException(40000, "文件不能为空");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BizException(40000, "文件大小不能超过 10MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new BizException(40000, "只支持 PDF、JPG、PNG 格式");
        }

        // Save file to disk
        String relativePath = saveFile(merchantId, app.getId(), file);

        // Save to DB
        ApplicationDocument doc = new ApplicationDocument();
        doc.setApplicationId(app.getId());
        doc.setMerchantId(merchantId);
        doc.setDocType(docType);
        doc.setDocName(file.getOriginalFilename());
        doc.setFilePath(relativePath);
        doc.setFileSize(file.getSize());
        doc.setMimeType(contentType);
        doc.setUboIndex(uboIndex);
        doc.setStatus("UPLOADED");
        documentMapper.insert(doc);

        auditService.log("APPLICATION_DOC_UPLOADED", userId, merchantId,
                null, httpRequest, true,
                "docType=" + docType);
        log.info("Document uploaded: merchantId={}, docType={}", merchantId, docType);
        return toDocResponse(doc);
    }

    // ─── deleteDocument ───

    @Override
    @Transactional
    public void deleteDocument(Long merchantId, Long userId, Long documentId,
                                HttpServletRequest httpRequest) {
        ApplicationDocument doc = documentMapper.selectById(documentId);
        if (doc == null || !doc.getMerchantId().equals(merchantId)) {
            throw new BizException(40400, "文件不存在");
        }

        MerchantApplication app = findLatest(merchantId);
        if (app != null && IMMUTABLE_STATUSES.contains(app.getStatus())) {
            throw new BizException(40000, "申请已提交，不能删除文件");
        }

        documentMapper.deleteById(documentId);

        auditService.log("APPLICATION_DOC_DELETED", userId, merchantId,
                null, httpRequest, true,
                "docId=" + documentId + ", docType=" + doc.getDocType());
        log.info("Document deleted: merchantId={}, docId={}", merchantId, documentId);
    }

    // ─── listDocuments ───

    @Override
    public List<DocumentResponse> listDocuments(Long merchantId) {
        MerchantApplication app = findLatest(merchantId);
        if (app == null) return List.of();

        return documentMapper.selectList(
                new LambdaQueryWrapper<ApplicationDocument>()
                        .eq(ApplicationDocument::getApplicationId, app.getId())
                        .eq(ApplicationDocument::getMerchantId, merchantId)
                        .orderByAsc(ApplicationDocument::getCreatedAt))
                .stream().map(this::toDocResponse).toList();
    }

    // ─── Validation ───

    private void validateForSubmit(MerchantApplication app) {
        // Step 1: Company info
        requireField(app.getCompanyName(), "公司名称");
        requireField(app.getRegCountry(), "注册国家/地区");
        requireField(app.getRegNumber(), "公司注册号");
        requireField(app.getCompanyType(), "公司类型");
        if (app.getIncorporationDate() == null) {
            throw new BizException(40000, "成立日期不能为空");
        }
        requireField(app.getAddressLine1(), "地址");
        requireField(app.getCity(), "城市");
        requireField(app.getPostalCode(), "邮政编码");
        requireField(app.getCountry(), "国家");
        requireField(app.getContactName(), "联系人姓名");
        requireField(app.getContactTitle(), "联系人职位");
        requireField(app.getContactEmail(), "联系邮箱");
        requireField(app.getContactPhone(), "联系电话");

        // Step 2: Legal rep
        if (app.getLegalRep() == null || app.getLegalRep().isEmpty()) {
            throw new BizException(40000, "法定代表人信息不能为空");
        }
        Map<String, Object> legalRep = app.getLegalRep();
        requireMapField(legalRep, "name", "法定代表人姓名");
        requireMapField(legalRep, "nationality", "法定代表人国籍");
        requireMapField(legalRep, "idType", "法定代表人证件类型");
        requireMapField(legalRep, "idNumber", "法定代表人证件号码");
        requireMapField(legalRep, "dateOfBirth", "法定代表人出生日期");

        // Step 2: UBOs (required unless noUboDeclaration)
        if (!Boolean.TRUE.equals(app.getNoUboDeclaration())) {
            if (app.getUbos() == null || app.getUbos().isEmpty()) {
                throw new BizException(40000, "请添加最终受益所有人信息，或声明无 UBO");
            }
        } else {
            if (isBlank(app.getControlStructureDesc())) {
                throw new BizException(40000, "声明无 UBO 时，必须说明公司控制结构");
            }
        }

        // Step 3: Business info
        requireField(app.getBusinessType(), "业务类型");
        requireField(app.getMonthlyVolume(), "月预估交易金额");
        requireField(app.getMonthlyTxCount(), "月预估交易笔数");
        requireField(app.getSupportedFiat(), "支持的法币");
        requireField(app.getSupportedCrypto(), "支持的加密货币");
        requireField(app.getUseCases(), "使用场景");
        requireField(app.getBusinessDesc(), "业务描述");
    }

    private void validateDeclarations(ApplicationSubmitRequest request) {
        if (!Boolean.TRUE.equals(request.getInfoAccuracyConfirmed())) {
            throw new BizException(40000, "请确认信息真实、完整、准确");
        }
        if (!Boolean.TRUE.equals(request.getSanctionsDeclared())) {
            throw new BizException(40000, "请确认制裁声明");
        }
        if (!Boolean.TRUE.equals(request.getTermsAccepted())) {
            throw new BizException(40000, "请同意服务协议和隐私政策");
        }
    }

    private void requireField(String value, String fieldName) {
        if (isBlank(value)) {
            throw new BizException(40000, fieldName + "不能为空");
        }
    }

    private void requireMapField(Map<String, Object> map, String key, String fieldName) {
        Object val = map.get(key);
        if (val == null || (val instanceof String s && s.isBlank())) {
            throw new BizException(40000, fieldName + "不能为空");
        }
    }

    private void validateUbos(ApplicationSaveDraftRequest request) {
        List<Map<String, Object>> ubos = request.getUbos();
        if (ubos == null || ubos.isEmpty()) return;

        if (ubos.size() > MAX_UBO_COUNT) {
            throw new BizException(40000, "UBO 数量不能超过 " + MAX_UBO_COUNT + " 人");
        }

        double totalShare = 0;
        for (Map<String, Object> ubo : ubos) {
            Object sharePct = ubo.get("sharePercentage");
            if (sharePct != null) {
                double share;
                if (sharePct instanceof Number n) {
                    share = n.doubleValue();
                } else {
                    try {
                        share = Double.parseDouble(sharePct.toString());
                    } catch (NumberFormatException e) {
                        throw new BizException(40000, "UBO 持股比例格式无效");
                    }
                }
                if (share < 0 || share > 100) {
                    throw new BizException(40000, "UBO 持股比例必须在 0-100 之间");
                }
                totalShare += share;
            }
        }
        if (totalShare > 100) {
            throw new BizException(40000, "UBO 持股比例总和不能超过 100%");
        }
    }

    // ─── File operations ───

    private String saveFile(Long merchantId, Long applicationId, MultipartFile file) {
        String ext = "";
        String originalName = file.getOriginalFilename();
        if (originalName != null && originalName.contains(".")) {
            ext = originalName.substring(originalName.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString().replace("-", "") + ext;
        String relativePath = merchantId + "/" + applicationId + "/" + fileName;
        Path fullPath = Paths.get(uploadBasePath, relativePath);

        try {
            Files.createDirectories(fullPath.getParent());
            file.transferTo(fullPath.toFile());
        } catch (IOException e) {
            log.error("Failed to save file: {}", fullPath, e);
            throw new BizException(50000, "文件保存失败");
        }

        return relativePath;
    }

    // ─── Helpers ───

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private void copyFields(ApplicationSaveDraftRequest req, MerchantApplication app) {
        if (req.getCurrentStep() != null) {
            app.setCurrentStep(req.getCurrentStep());
        }

        // Step 1
        app.setCompanyName(req.getCompanyName());
        app.setCompanyNameEn(req.getCompanyNameEn());
        app.setRegCountry(req.getRegCountry());
        app.setRegNumber(req.getRegNumber());
        app.setBusinessLicenseNo(req.getBusinessLicenseNo());
        app.setCompanyType(req.getCompanyType());
        if (req.getIncorporationDate() != null && !req.getIncorporationDate().isBlank()) {
            app.setIncorporationDate(LocalDate.parse(req.getIncorporationDate()));
        }
        app.setAddressLine1(req.getAddressLine1());
        app.setAddressLine2(req.getAddressLine2());
        app.setCity(req.getCity());
        app.setStateProvince(req.getStateProvince());
        app.setPostalCode(req.getPostalCode());
        app.setCountry(req.getCountry());
        app.setContactName(req.getContactName());
        app.setContactTitle(req.getContactTitle());
        app.setContactEmail(req.getContactEmail());
        app.setContactPhone(req.getContactPhone());

        // Step 2
        app.setLegalRep(req.getLegalRep());
        app.setUbos(req.getUbos());
        app.setNoUboDeclaration(req.getNoUboDeclaration());
        app.setControlStructureDesc(req.getControlStructureDesc());

        // Step 3
        app.setBusinessType(req.getBusinessType());
        app.setWebsite(req.getWebsite());
        app.setMonthlyVolume(req.getMonthlyVolume());
        app.setMonthlyTxCount(req.getMonthlyTxCount());
        app.setSupportedFiat(req.getSupportedFiat());
        app.setSupportedCrypto(req.getSupportedCrypto());
        app.setUseCases(req.getUseCases());
        app.setBusinessDesc(req.getBusinessDesc());
    }

    private MerchantApplication findLatest(Long merchantId) {
        return applicationMapper.selectOne(
                new LambdaQueryWrapper<MerchantApplication>()
                        .eq(MerchantApplication::getMerchantId, merchantId)
                        .orderByDesc(MerchantApplication::getId)
                        .last("LIMIT 1"));
    }

    private ApplicationResponse toResponse(MerchantApplication app) {
        ApplicationResponse resp = new ApplicationResponse();
        resp.setId(app.getId());
        resp.setStatus(app.getStatus());
        resp.setCurrentStep(app.getCurrentStep());

        resp.setCompanyName(app.getCompanyName());
        resp.setCompanyNameEn(app.getCompanyNameEn());
        resp.setRegCountry(app.getRegCountry());
        resp.setRegNumber(app.getRegNumber());
        resp.setBusinessLicenseNo(app.getBusinessLicenseNo());
        resp.setCompanyType(app.getCompanyType());
        resp.setIncorporationDate(app.getIncorporationDate());
        resp.setAddressLine1(app.getAddressLine1());
        resp.setAddressLine2(app.getAddressLine2());
        resp.setCity(app.getCity());
        resp.setStateProvince(app.getStateProvince());
        resp.setPostalCode(app.getPostalCode());
        resp.setCountry(app.getCountry());
        resp.setContactName(app.getContactName());
        resp.setContactTitle(app.getContactTitle());
        resp.setContactEmail(app.getContactEmail());
        resp.setContactPhone(app.getContactPhone());

        resp.setLegalRep(app.getLegalRep());
        resp.setUbos(app.getUbos());
        resp.setNoUboDeclaration(app.getNoUboDeclaration());
        resp.setControlStructureDesc(app.getControlStructureDesc());

        resp.setBusinessType(app.getBusinessType());
        resp.setWebsite(app.getWebsite());
        resp.setMonthlyVolume(app.getMonthlyVolume());
        resp.setMonthlyTxCount(app.getMonthlyTxCount());
        resp.setSupportedFiat(app.getSupportedFiat());
        resp.setSupportedCrypto(app.getSupportedCrypto());
        resp.setUseCases(app.getUseCases());
        resp.setBusinessDesc(app.getBusinessDesc());

        resp.setInfoAccuracyConfirmed(app.getInfoAccuracyConfirmed());
        resp.setSanctionsDeclared(app.getSanctionsDeclared());
        resp.setTermsAccepted(app.getTermsAccepted());

        resp.setRejectReason(app.getRejectReason());
        resp.setNeedInfoDetails(app.getNeedInfoDetails());

        resp.setSubmittedAt(app.getSubmittedAt());
        resp.setCreatedAt(app.getCreatedAt());
        resp.setUpdatedAt(app.getUpdatedAt());

        return resp;
    }

    private DocumentResponse toDocResponse(ApplicationDocument doc) {
        DocumentResponse resp = new DocumentResponse();
        resp.setId(doc.getId());
        resp.setApplicationId(doc.getApplicationId());
        resp.setDocType(doc.getDocType());
        resp.setDocName(doc.getDocName());
        resp.setFileSize(doc.getFileSize());
        resp.setMimeType(doc.getMimeType());
        resp.setUboIndex(doc.getUboIndex());
        resp.setStatus(doc.getStatus());
        resp.setCreatedAt(doc.getCreatedAt());
        return resp;
    }
}
