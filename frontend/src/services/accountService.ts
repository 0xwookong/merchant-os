import { api } from "@/lib/api";

export interface ProfileData {
  companyName: string;
  contactName: string;
  email: string;
  role: string;
  createdAt: string;
}

export const accountService = {
  getProfile(): Promise<ProfileData> {
    return api.get<ProfileData>("/api/v1/account/profile");
  },
  updateProfile(data: { contactName: string }): Promise<ProfileData> {
    return api.put<ProfileData>("/api/v1/account/profile", data);
  },
};
