package com.osl.pay.portal.service;

import com.osl.pay.portal.common.result.PageResult;
import com.osl.pay.portal.model.dto.ApiRequestLogResponse;

public interface ApiRequestLogService {
    /** Get paginated API request logs for the merchant in current environment */
    PageResult<ApiRequestLogResponse> getPage(Long merchantId, int page, int pageSize);
}
