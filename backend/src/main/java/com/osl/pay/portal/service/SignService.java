package com.osl.pay.portal.service;

import com.osl.pay.portal.model.dto.*;

public interface SignService {

    SignGenerateResponse generateSignature(SignGenerateRequest request);

    SignVerifyResponse verifySignature(SignVerifyRequest request);

    EncryptResponse encryptData(EncryptRequest request);
}
