import { api } from "@/lib/api";

interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  contactName: string;
}

interface RegisterResponse {
  merchantId: number;
  userId: number;
  email: string;
  message: string;
}

export const authService = {
  register(data: RegisterRequest): Promise<RegisterResponse> {
    return api.post<RegisterResponse>("/api/v1/auth/register", data);
  },

  verifyEmail(token: string): Promise<string> {
    return api.get<string>("/api/v1/auth/verify-email", { token });
  },
};

export type { RegisterRequest, RegisterResponse };
