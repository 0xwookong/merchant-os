package com.osl.pay.portal.model.dto;

import lombok.Data;

@Data
public class SignGenerateResponse {
    /** The original string that was signed: appId=[appId]&timestamp=[timestamp] */
    private String signatureString;
    /** Base64-encoded RSA signature */
    private String signature;
    /** Ready-to-use header value: signature: {signature} */
    private String headerValue;
}
