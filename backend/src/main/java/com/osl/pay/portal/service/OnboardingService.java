package com.osl.pay.portal.service;

import com.osl.pay.portal.model.dto.OnboardingResponse;
import com.osl.pay.portal.model.dto.OnboardingSaveDraftRequest;
import jakarta.servlet.http.HttpServletRequest;

public interface OnboardingService {

    OnboardingResponse getCurrent(Long merchantId);

    OnboardingResponse saveDraft(OnboardingSaveDraftRequest request, Long merchantId, HttpServletRequest httpRequest);

    OnboardingResponse resetToDraft(Long merchantId, HttpServletRequest httpRequest);
}
