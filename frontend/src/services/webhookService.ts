import { api } from "@/lib/api";

export interface WebhookConfig {
  id: number;
  url: string;
  secret: string;
  events: string[];
  status: string;
  createdAt: string;
}

export interface WebhookCreateRequest {
  url: string;
  events: string[];
}

export const webhookService = {
  list(): Promise<WebhookConfig[]> {
    return api.get<WebhookConfig[]>("/api/v1/webhooks");
  },
  create(data: WebhookCreateRequest): Promise<WebhookConfig> {
    return api.post<WebhookConfig>("/api/v1/webhooks", data);
  },
  update(id: number, data: WebhookCreateRequest): Promise<WebhookConfig> {
    return api.put<WebhookConfig>(`/api/v1/webhooks/${id}`, data);
  },
  remove(id: number): Promise<string> {
    return api.delete<string>(`/api/v1/webhooks/${id}`);
  },
  testPush(id: number): Promise<string> {
    return api.post<string>(`/api/v1/webhooks/${id}/test`);
  },
};
