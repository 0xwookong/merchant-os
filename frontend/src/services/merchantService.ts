import { api } from "@/lib/api";

export interface MerchantProgressResponse {
  accountCreated: boolean;
  applicationStatus: string | null; // null/DRAFT/SUBMITTED/UNDER_REVIEW/APPROVED/REJECTED/NEED_MORE_INFO
  hasCredentials: boolean;
  hasWebhooks: boolean;
  hasDomains: boolean;
}

export const merchantService = {
  getProgress(signal?: AbortSignal): Promise<MerchantProgressResponse> {
    return api.get<MerchantProgressResponse>("/api/v1/merchant/progress", undefined, signal);
  },
};
