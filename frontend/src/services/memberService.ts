import { api } from "@/lib/api";

export interface MemberInfo {
  id: number;
  contactName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface InviteRequest {
  email: string;
  role: string;
  contactName?: string;
}

export const memberService = {
  list(): Promise<MemberInfo[]> {
    return api.get<MemberInfo[]>("/api/v1/members");
  },
  invite(data: InviteRequest): Promise<MemberInfo> {
    return api.post<MemberInfo>("/api/v1/members/invite", data);
  },
  resendInvite(id: number): Promise<string> {
    return api.post<string>(`/api/v1/members/${id}/resend-invite`);
  },
  remove(id: number): Promise<string> {
    return api.delete<string>(`/api/v1/members/${id}`);
  },
};
