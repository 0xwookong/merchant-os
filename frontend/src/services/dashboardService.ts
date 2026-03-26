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

interface TrendPoint {
  time: string;
  amount: number;
  orderCount: number;
}

interface DashboardTrendResponse {
  range: string;
  granularity: string;
  points: TrendPoint[];
}

interface PaymentMethodItem {
  method: string;
  label: string;
  amount: number;
  orderCount: number;
  percentage: number;
}

interface DashboardPaymentMethodResponse {
  range: string;
  methods: PaymentMethodItem[];
}

export const dashboardService = {
  getMetrics(range: string = "7d"): Promise<DashboardMetricsResponse> {
    return api.get<DashboardMetricsResponse>("/api/v1/dashboard/metrics", { range });
  },

  getTrend(range: string = "7d"): Promise<DashboardTrendResponse> {
    return api.get<DashboardTrendResponse>("/api/v1/dashboard/trend", { range });
  },

  getPaymentMethods(range: string = "7d"): Promise<DashboardPaymentMethodResponse> {
    return api.get<DashboardPaymentMethodResponse>("/api/v1/dashboard/payment-methods", { range });
  },
};

export type {
  MetricCard,
  DashboardMetricsResponse,
  TrendPoint,
  DashboardTrendResponse,
  PaymentMethodItem,
  DashboardPaymentMethodResponse,
};
