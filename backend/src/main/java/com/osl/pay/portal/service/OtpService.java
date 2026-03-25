package com.osl.pay.portal.service;

import com.osl.pay.portal.model.dto.OtpBindResponse;
import com.osl.pay.portal.model.dto.OtpSetupResponse;
import com.osl.pay.portal.model.dto.OtpStatusResponse;
import jakarta.servlet.http.HttpServletRequest;

public interface OtpService {

    OtpSetupResponse setup(Long userId, HttpServletRequest httpRequest);

    OtpBindResponse verifyAndBind(Long userId, String code, HttpServletRequest httpRequest);

    void verifyAndUnbind(Long userId, String code, HttpServletRequest httpRequest);

    OtpStatusResponse getStatus(Long userId);
}
