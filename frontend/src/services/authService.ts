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

interface LoginRequest {
  email: string;
  password: string;
  merchantId?: number;
}

interface MerchantSelectItem {
  merchantId: number;
  companyName: string;
  role: string;
}

interface LoginResponse {
  authenticated: boolean;
  accessToken?: string;
  userId?: number;
  merchantId?: number;
  email?: string;
  role?: string;
  companyName?: string;
  merchants?: MerchantSelectItem[];
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const authService = {
  register(data: RegisterRequest): Promise<RegisterResponse> {
    return api.post<RegisterResponse>("/api/v1/auth/register", data);
  },

  verifyEmail(token: string): Promise<string> {
    return api.get<string>("/api/v1/auth/verify-email", { token });
  },

  login(data: LoginRequest): Promise<LoginResponse> {
    return api.post<LoginResponse>("/api/v1/auth/login", data);
  },

  refresh(): Promise<LoginResponse> {
    return api.post<LoginResponse>("/api/v1/auth/refresh");
  },

  logout(): Promise<string> {
    return api.post<string>("/api/v1/auth/logout");
  },

  forgotPassword(data: ForgotPasswordRequest): Promise<string> {
    return api.post<string>("/api/v1/auth/forgot-password", data);
  },

  resetPassword(data: ResetPasswordRequest): Promise<string> {
    return api.post<string>("/api/v1/auth/reset-password", data);
  },

  changePassword(data: ChangePasswordRequest): Promise<string> {
    return api.post<string>("/api/v1/auth/change-password", data);
  },
};

export type {
  RegisterRequest, RegisterResponse,
  LoginRequest, LoginResponse, MerchantSelectItem,
  ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest,
};
