package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.osl.pay.portal.common.context.EnvironmentContext;
import com.osl.pay.portal.model.dto.ApiRequestLogResponse;
import com.osl.pay.portal.model.entity.ApiRequestLog;
import com.osl.pay.portal.repository.ApiRequestLogMapper;
import com.osl.pay.portal.service.ApiRequestLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApiRequestLogServiceImpl implements ApiRequestLogService {

    private final ApiRequestLogMapper logMapper;

    @Override
    public List<ApiRequestLogResponse> getLatest(Long merchantId) {
        List<ApiRequestLog> logs = logMapper.selectList(
                new LambdaQueryWrapper<ApiRequestLog>()
                        .eq(ApiRequestLog::getMerchantId, merchantId)
                        .eq(ApiRequestLog::getEnvironment, EnvironmentContext.current())
                        .orderByDesc(ApiRequestLog::getCreatedAt)
                        .last("LIMIT 10"));
        return logs.stream().map(this::toResponse).toList();
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
