import { api } from "@/lib/api";

export interface OtpStatusResponse {
  otpEnabled: boolean;
}

export interface OtpSetupResponse {
  secret: string;
  otpAuthUri: string;
}

export const securityService = {
  getOtpStatus(): Promise<OtpStatusResponse> {
    return api.get<OtpStatusResponse>("/api/v1/security/otp/status");
  },

  otpSetup(): Promise<OtpSetupResponse> {
    return api.post<OtpSetupResponse>("/api/v1/security/otp/setup");
  },

  otpVerifyBind(code: string): Promise<{ recoveryCodes: string[] }> {
    return api.post<{ recoveryCodes: string[] }>("/api/v1/security/otp/verify-bind", { code });
  },

  otpUnbind(code: string): Promise<string> {
    return api.post<string>("/api/v1/security/otp/unbind", { code });
  },

  sendEmailCode(): Promise<string> {
    return api.post<string>("/api/v1/security/email-code/send");
  },

  verifyEmailCode(code: string): Promise<{ actionToken: string }> {
    return api.post<{ actionToken: string }>("/api/v1/security/email-code/verify", { code });
  },
};
