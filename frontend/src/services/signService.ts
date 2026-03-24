import { api } from "@/lib/api";

export interface SignGenerateRequest {
  appId: string;
  timestamp: string;
  privateKey: string;
}

export interface SignGenerateResponse {
  signatureString: string;
  signature: string;
  headerValue: string;
}

export interface SignVerifyRequest {
  appId: string;
  timestamp: string;
  signature: string;
  publicKey: string;
}

export interface SignVerifyResponse {
  valid: boolean;
  signatureString: string;
}

export interface EncryptRequest {
  plaintext: string;
  publicKey: string;
}

export interface EncryptResponse {
  ciphertext: string;
}

export const signService = {
  generate(data: SignGenerateRequest): Promise<SignGenerateResponse> {
    return api.post<SignGenerateResponse>("/api/v1/sign/generate", data);
  },
  verify(data: SignVerifyRequest): Promise<SignVerifyResponse> {
    return api.post<SignVerifyResponse>("/api/v1/sign/verify", data);
  },
  encrypt(data: EncryptRequest): Promise<EncryptResponse> {
    return api.post<EncryptResponse>("/api/v1/sign/encrypt", data);
  },
};
