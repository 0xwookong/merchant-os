import { api } from "@/lib/api";

interface MetricCard {
  key: string;
  label: string;
  value: string;
  unit: string;
  changeRate: number;
}

interface DashboardMetricsResponse {
  metrics: MetricCard[];
  range: string;
}

export const dashboardService = {
  getMetrics(range: string = "7d"): Promise<DashboardMetricsResponse> {
    return api.get<DashboardMetricsResponse>("/api/v1/dashboard/metrics", { range });
  },
};

export type { MetricCard, DashboardMetricsResponse };
