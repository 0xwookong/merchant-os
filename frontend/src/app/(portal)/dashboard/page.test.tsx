import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import DashboardPage from "./page";

vi.mock("@/providers/language-provider", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "en",
    setLocale: vi.fn(),
  }),
}));

vi.mock("@/services/dashboardService", () => ({
  dashboardService: {
    getMetrics: vi.fn().mockResolvedValue({
      range: "7d",
      metrics: [
        { key: "totalAmount", label: "交易总额", value: "89,350.00", unit: "USD", changeRate: 8.3 },
        { key: "successRate", label: "成功率", value: "97.2", unit: "%", changeRate: 0.5 },
        { key: "orderCount", label: "订单数量", value: "365", unit: "笔", changeRate: 11.2 },
        { key: "activeUsers", label: "活跃用户", value: "128", unit: "人", changeRate: -3.4 },
      ],
    }),
  },
}));

describe("仪表盘页面", () => {
  afterEach(() => cleanup());

  it("渲染页面标题", async () => {
    render(<DashboardPage />);
    expect(screen.getByText("dashboard.title")).toBeInTheDocument();
  });

  it("渲染时间范围选择器", () => {
    render(<DashboardPage />);
    expect(screen.getByText("dashboard.range.today")).toBeInTheDocument();
    expect(screen.getByText("dashboard.range.7d")).toBeInTheDocument();
    expect(screen.getByText("dashboard.range.30d")).toBeInTheDocument();
  });
});
