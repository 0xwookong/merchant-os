package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.osl.pay.portal.common.context.EnvironmentContext;
import com.osl.pay.portal.common.result.PageResult;
import com.osl.pay.portal.model.dto.ApiRequestLogResponse;
import com.osl.pay.portal.model.entity.ApiRequestLog;
import com.osl.pay.portal.repository.ApiRequestLogMapper;
import com.osl.pay.portal.service.ApiRequestLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ApiRequestLogServiceImpl implements ApiRequestLogService {

    private final ApiRequestLogMapper logMapper;

    @Override
    public PageResult<ApiRequestLogResponse> getPage(Long merchantId, int page, int pageSize) {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        LambdaQueryWrapper<ApiRequestLog> query = new LambdaQueryWrapper<ApiRequestLog>()
                .eq(ApiRequestLog::getMerchantId, merchantId)
                .eq(ApiRequestLog::getEnvironment, EnvironmentContext.current())
                .orderByDesc(ApiRequestLog::getCreatedAt);

        Page<ApiRequestLog> pageResult = logMapper.selectPage(new Page<>(page, pageSize), query);

        return new PageResult<>(
                pageResult.getRecords().stream().map(this::toResponse).toList(),
                pageResult.getTotal(),
                page,
                pageSize
        );
    }

    private ApiRequestLogResponse toResponse(ApiRequestLog l) {
        ApiRequestLogResponse r = new ApiRequestLogResponse();
        r.setId(l.getId());
        r.setMethod(l.getMethod());
        r.setPath(l.getPath());
        r.setStatusCode(l.getStatusCode());
        r.setDurationMs(l.getDurationMs());
        r.setRequestBody(l.getRequestBody());
        r.setResponseBody(l.getResponseBody());
        r.setCreatedAt(l.getCreatedAt());
        return r;
    }
}
