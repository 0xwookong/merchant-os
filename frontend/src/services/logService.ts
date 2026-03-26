import { api } from "@/lib/api";

export interface ApiLogEntry {
  id: number;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  requestBody: string | null;
  responseBody: string | null;
  createdAt: string;
}

export interface LogPageResult {
  list: ApiLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export const logService = {
  getPage(page = 1, pageSize = 20): Promise<LogPageResult> {
    return api.get<LogPageResult>("/api/v1/logs", { page: String(page), pageSize: String(pageSize) });
  },
};
