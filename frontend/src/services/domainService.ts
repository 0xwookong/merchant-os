import { api } from "@/lib/api";

export interface DomainEntry {
  id: number;
  domain: string;
  createdAt: string;
}

export interface VerifyParams {
  otpCode?: string;
  emailCode?: string;
}

export const domainService = {
  list(): Promise<DomainEntry[]> {
    return api.get<DomainEntry[]>("/api/v1/domains");
  },
  add(domain: string, verify: VerifyParams): Promise<DomainEntry> {
    return api.post<DomainEntry>("/api/v1/domains", { domain, ...verify });
  },
  remove(id: number, verify: VerifyParams): Promise<string> {
    return api.post<string>(`/api/v1/domains/${id}/remove`, verify);
  },
};
