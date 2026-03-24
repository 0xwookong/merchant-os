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

export const logService = {
  getLatest(): Promise<ApiLogEntry[]> {
    return api.get<ApiLogEntry[]>("/api/v1/logs");
  },
};
