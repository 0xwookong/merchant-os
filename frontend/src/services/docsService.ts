import { api } from "@/lib/api";

export interface CategoryInfo {
  key: string;
  label: string;
  count: number;
}

export interface EndpointSummary {
  operationId: string;
  method: string;
  path: string;
  summary: string;
  category: string;
  tag: string;
}

export interface EndpointListResult {
  categories: CategoryInfo[];
  endpoints: EndpointSummary[];
}

export interface EndpointDetail {
  operationId: string;
  method: string;
  path: string;
  summary: string;
  description: string;
  category: string;
  tag: string;
  parameters: Record<string, unknown>[];
  requestBody: Record<string, unknown> | null;
  responses: Record<string, unknown>;
  aiContextBlock: string;
}

export interface ProxyRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export interface ProxyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
}

export const docsService = {
  listEndpoints(category?: string): Promise<EndpointListResult> {
    const params: Record<string, string> = {};
    if (category) params.category = category;
    return api.get<EndpointListResult>("/api/v1/docs/endpoints", params);
  },

  getEndpointDetail(operationId: string): Promise<EndpointDetail> {
    return api.get<EndpointDetail>(`/api/v1/docs/endpoints/${operationId}`);
  },

  proxy(data: ProxyRequest): Promise<ProxyResponse> {
    return api.post<ProxyResponse>("/api/v1/docs/proxy", data);
  },
};
