package com.osl.pay.portal.service;

import com.osl.pay.portal.model.dto.KybStatusResponse;
import com.osl.pay.portal.model.dto.KybSubmitRequest;
import jakarta.servlet.http.HttpServletRequest;

public interface KybService {

    KybStatusResponse getStatus(Long merchantId);

    void submit(KybSubmitRequest request, Long merchantId, HttpServletRequest httpRequest);
}
