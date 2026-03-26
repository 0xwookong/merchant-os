package com.osl.pay.portal.controller.internal;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.osl.pay.portal.common.result.PageResult;
import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.model.dto.ApplicationResponse;
import com.osl.pay.portal.model.dto.ApplicationReviewRequest;
import com.osl.pay.portal.model.dto.DocumentResponse;
import com.osl.pay.portal.model.entity.ApplicationStatusHistory;
import com.osl.pay.portal.model.entity.MerchantApplication;
import com.osl.pay.portal.repository.ApplicationStatusHistoryMapper;
import com.osl.pay.portal.repository.MerchantApplicationMapper;
import com.osl.pay.portal.service.MerchantApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Internal API for ops backend to view and review merchant applications.
 * Authenticated via X-Internal-Key header (see InternalApiKeyFilter).
 */
@Slf4j
@RestController
@RequestMapping("/api/internal/application")
@RequiredArgsConstructor
public class InternalApplicationController {

    private final MerchantApplicationService applicationService;
    private final MerchantApplicationMapper applicationMapper;
    private final ApplicationStatusHistoryMapper statusHistoryMapper;

    /**
     * List applications with optional status filter, ordered by latest update.
     * Used by ops backend's application queue.
     */
    @GetMapping("/list")
    public Result<PageResult<ApplicationResponse>> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        log.info("Internal list: status={}, page={}, pageSize={}", status, page, pageSize);

        LambdaQueryWrapper<MerchantApplication> query = new LambdaQueryWrapper<MerchantApplication>()
                .orderByDesc(MerchantApplication::getUpdatedAt);
        if (status != null && !status.isBlank()) {
            query.eq(MerchantApplication::getStatus, status);
        }

        Page<MerchantApplication> result = applicationMapper.selectPage(new Page<>(page, pageSize), query);
        List<ApplicationResponse> list = result.getRecords().stream()
                .map(applicationService::toPublicResponse)
                .toList();

        return Result.ok(new PageResult<>(list, result.getTotal(), page, pageSize));
    }

    /**
     * Get full application detail for a specific merchant.
     * Used by ops reviewer to see all submitted information.
     */
    @GetMapping("/detail/{merchantId}")
    public Result<ApplicationResponse> detail(@PathVariable Long merchantId) {
        log.info("Internal detail: merchantId={}", merchantId);
        ApplicationResponse resp = applicationService.getCurrent(merchantId);
        if (resp == null) {
            return Result.ok(null);
        }
        return Result.ok(resp);
    }

    /**
     * Get uploaded documents for a merchant's application.
     */
    @GetMapping("/detail/{merchantId}/documents")
    public Result<List<DocumentResponse>> documents(@PathVariable Long merchantId) {
        log.info("Internal documents: merchantId={}", merchantId);
        return Result.ok(applicationService.listDocuments(merchantId));
    }

    /**
     * Get status change history for a merchant's application.
     */
    @GetMapping("/detail/{merchantId}/history")
    public Result<List<ApplicationStatusHistory>> history(@PathVariable Long merchantId) {
        log.info("Internal history: merchantId={}", merchantId);
        List<ApplicationStatusHistory> history = statusHistoryMapper.selectList(
                new LambdaQueryWrapper<ApplicationStatusHistory>()
                        .eq(ApplicationStatusHistory::getMerchantId, merchantId)
                        .orderByAsc(ApplicationStatusHistory::getCreatedAt));
        return Result.ok(history);
    }

    /**
     * Review an application.
     * Transitions: SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED / NEED_MORE_INFO.
     */
    @PostMapping("/review")
    public Result<ApplicationResponse> review(@Valid @RequestBody ApplicationReviewRequest request) {
        log.info("Internal review: merchantId={}, action={}, reviewer={}",
                request.getMerchantId(), request.getAction(), request.getReviewer());
        return Result.ok(applicationService.review(request));
    }
}
