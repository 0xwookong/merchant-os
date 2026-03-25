import { api } from "@/lib/api";

export interface MerchantProgressResponse {
  accountCreated: boolean;
  kybStatus: string | null;
  onboardingStatus: string | null;
  hasCredentials: boolean;
  hasWebhooks: boolean;
  hasDomains: boolean;
}

export const merchantService = {
  getProgress(): Promise<MerchantProgressResponse> {
    return api.get<MerchantProgressResponse>("/api/v1/merchant/progress");
  },
};
