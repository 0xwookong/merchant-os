import { api } from "@/lib/api";

interface OnboardingResponse {
  id: number | null;
  status: string | null;
  currentStep: number | null;
  companyName: string | null;
  companyAddress: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  businessType: string | null;
  monthlyVolume: string | null;
  supportedFiat: string | null;
  supportedCrypto: string | null;
  businessDesc: string | null;
  rejectReason: string | null;
}

interface OnboardingSaveDraftRequest {
  submit: boolean;
  currentStep: number;
  companyName?: string;
  companyAddress?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  businessType?: string;
  monthlyVolume?: string;
  supportedFiat?: string;
  supportedCrypto?: string;
  businessDesc?: string;
}

export const onboardingService = {
  getCurrent(): Promise<OnboardingResponse | null> {
    return api.get<OnboardingResponse | null>("/api/v1/onboarding/current");
  },

  saveDraft(data: OnboardingSaveDraftRequest): Promise<OnboardingResponse> {
    return api.post<OnboardingResponse>("/api/v1/onboarding/save-draft", data);
  },
};

export type { OnboardingResponse, OnboardingSaveDraftRequest };
