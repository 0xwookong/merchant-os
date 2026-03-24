import { api } from "@/lib/api";

export interface CredentialData {
  appId: string;
  apiEndpoint: string;
  apiPublicKey: string;
  webhookPublicKey: string;
}

export const credentialService = {
  get(): Promise<CredentialData> {
    return api.get<CredentialData>("/api/v1/credentials");
  },
};
