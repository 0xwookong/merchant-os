import { api } from "@/lib/api";

interface KybStatusResponse {
  kybStatus: string;
  rejectReason: string | null;
  companyRegCountry?: string;
  companyRegNumber?: string;
  businessLicenseNo?: string;
  companyType?: string;
  legalRepName?: string;
  legalRepNationality?: string;
  legalRepIdType?: string;
  legalRepIdNumber?: string;
  legalRepSharePct?: number;
}

interface KybSubmitRequest {
  companyRegCountry: string;
  companyRegNumber: string;
  businessLicenseNo: string;
  companyType: string;
  legalRepName: string;
  legalRepNationality: string;
  legalRepIdType: string;
  legalRepIdNumber: string;
  legalRepSharePct?: number;
}

export const kybService = {
  getStatus(): Promise<KybStatusResponse> {
    return api.get<KybStatusResponse>("/api/v1/kyb/status");
  },

  submit(data: KybSubmitRequest): Promise<string> {
    return api.post<string>("/api/v1/kyb/submit", data);
  },
};

export type { KybStatusResponse, KybSubmitRequest };
