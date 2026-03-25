package com.osl.pay.portal.service;

import com.osl.pay.portal.model.dto.ApplicationResponse;
import com.osl.pay.portal.model.dto.ApplicationSaveDraftRequest;
import com.osl.pay.portal.model.dto.ApplicationSubmitRequest;
import com.osl.pay.portal.model.dto.DocumentResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface MerchantApplicationService {

    ApplicationResponse getCurrent(Long merchantId);

    ApplicationResponse saveDraft(ApplicationSaveDraftRequest request, Long merchantId,
                                   Long userId, HttpServletRequest httpRequest);

    ApplicationResponse submit(ApplicationSubmitRequest request, Long merchantId,
                                Long userId, HttpServletRequest httpRequest);

    ApplicationResponse resubmit(ApplicationSubmitRequest request, Long merchantId,
                                  Long userId, HttpServletRequest httpRequest);

    DocumentResponse uploadDocument(Long merchantId, Long userId, String docType,
                                     Integer uboIndex, MultipartFile file,
                                     HttpServletRequest httpRequest);

    void deleteDocument(Long merchantId, Long userId, Long documentId,
                         HttpServletRequest httpRequest);

    List<DocumentResponse> listDocuments(Long merchantId);
}
