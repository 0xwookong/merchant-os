import { api } from "@/lib/api";

export interface CredentialData {
  appId: string;
  apiEndpoint: string;
  apiPublicKey: string;
  webhookPublicKey: string;
}

export interface RotateParams {
  keyType: "api" | "webhook";
  otpCode?: string;
  emailCode?: string;
}

export const credentialService = {
  get(): Promise<CredentialData> {
    return api.get<CredentialData>("/api/v1/credentials");
  },
  rotate(params: RotateParams): Promise<CredentialData> {
    return api.post<CredentialData>("/api/v1/credentials/rotate", params);
  },
};
