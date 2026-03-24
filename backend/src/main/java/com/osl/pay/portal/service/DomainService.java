package com.osl.pay.portal.service;

import com.osl.pay.portal.model.dto.DomainResponse;

import java.util.List;

public interface DomainService {
    List<DomainResponse> list(Long merchantId);
    DomainResponse add(Long merchantId, String domain);
    void remove(Long merchantId, Long id);
}
