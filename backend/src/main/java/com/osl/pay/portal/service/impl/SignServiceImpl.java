package com.osl.pay.portal.service.impl;

import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.model.dto.*;
import com.osl.pay.portal.service.SignService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import java.security.*;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Slf4j
@Service
public class SignServiceImpl implements SignService {

    private static final String SIGNATURE_ALGORITHM = "SHA256withRSA";
    private static final String ENCRYPT_ALGORITHM = "RSA/ECB/PKCS1Padding";
    private static final String KEY_ALGORITHM = "RSA";

    @Override
    public SignGenerateResponse generateSignature(SignGenerateRequest request) {
        String signatureString = buildSignatureString(request.getAppId(), request.getTimestamp());

        PrivateKey privateKey = parsePrivateKey(request.getPrivateKey());

        try {
            Signature sig = Signature.getInstance(SIGNATURE_ALGORITHM);
            sig.initSign(privateKey);
            sig.update(signatureString.getBytes());
            byte[] signed = sig.sign();
            String base64Signature = Base64.getEncoder().encodeToString(signed);

            SignGenerateResponse response = new SignGenerateResponse();
            response.setSignatureString(signatureString);
            response.setSignature(base64Signature);
            response.setHeaderValue("open-api-sign: " + base64Signature);
            return response;
        } catch (Exception e) {
            log.warn("Signature generation failed: {}", e.getMessage());
            throw new BizException(40001, "签名生成失败: " + e.getMessage());
        }
    }

    @Override
    public SignVerifyResponse verifySignature(SignVerifyRequest request) {
        String signatureString = buildSignatureString(request.getAppId(), request.getTimestamp());
        PublicKey publicKey = parsePublicKey(request.getPublicKey());

        SignVerifyResponse response = new SignVerifyResponse();
        response.setSignatureString(signatureString);

        try {
            Signature sig = Signature.getInstance(SIGNATURE_ALGORITHM);
            sig.initVerify(publicKey);
            sig.update(signatureString.getBytes());
            byte[] signatureBytes = Base64.getDecoder().decode(request.getSignature());
            response.setValid(sig.verify(signatureBytes));
        } catch (Exception e) {
            log.warn("Signature verification failed: {}", e.getMessage());
            response.setValid(false);
        }
        return response;
    }

    @Override
    public EncryptResponse encryptData(EncryptRequest request) {
        PublicKey publicKey = parsePublicKey(request.getPublicKey());

        try {
            Cipher cipher = Cipher.getInstance(ENCRYPT_ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, publicKey);
            byte[] encrypted = cipher.doFinal(request.getPlaintext().getBytes());

            EncryptResponse response = new EncryptResponse();
            response.setCiphertext(Base64.getEncoder().encodeToString(encrypted));
            return response;
        } catch (Exception e) {
            log.warn("Encryption failed: {}", e.getMessage());
            throw new BizException(40001, "加密失败: " + e.getMessage());
        }
    }

    private String buildSignatureString(String appId, String timestamp) {
        return "appId=" + appId + "&timestamp=" + timestamp;
    }

    private PrivateKey parsePrivateKey(String pem) {
        try {
            String base64 = pem
                    .replace("-----BEGIN PRIVATE KEY-----", "")
                    .replace("-----END PRIVATE KEY-----", "")
                    .replaceAll("\\s+", "");
            byte[] decoded = Base64.getDecoder().decode(base64);
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);
            return KeyFactory.getInstance(KEY_ALGORITHM).generatePrivate(spec);
        } catch (IllegalArgumentException | InvalidKeySpecException | NoSuchAlgorithmException e) {
            throw new BizException(40000, "私钥格式错误，请使用 PKCS#8 PEM 格式");
        }
    }

    private PublicKey parsePublicKey(String pem) {
        try {
            String base64 = pem
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s+", "");
            byte[] decoded = Base64.getDecoder().decode(base64);
            X509EncodedKeySpec spec = new X509EncodedKeySpec(decoded);
            return KeyFactory.getInstance(KEY_ALGORITHM).generatePublic(spec);
        } catch (IllegalArgumentException | InvalidKeySpecException | NoSuchAlgorithmException e) {
            throw new BizException(40000, "公钥格式错误，请使用 X.509 PEM 格式");
        }
    }
}
