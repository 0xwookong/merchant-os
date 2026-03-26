package com.osl.pay.portal.service;

import com.osl.pay.portal.model.dto.DomainResponse;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

public interface DomainService {
    List<DomainResponse> list(Long merchantId);
    DomainResponse add(Long merchantId, Long userId, String domain, HttpServletRequest httpRequest);
    void remove(Long merchantId, Long userId, Long id, HttpServletRequest httpRequest);
}
