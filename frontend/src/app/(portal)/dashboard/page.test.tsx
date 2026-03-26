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

vi.mock("@/providers/environment-provider", () => ({
  useEnvironment: () => ({ environment: "sandbox", isSandbox: true, toggleEnvironment: vi.fn() }),
}));

vi.mock("@/hooks/useApplicationStatus", () => ({
  useApplicationStatus: () => ({ applicationStatus: null, progress: null, onboardingComplete: false, refreshStatus: vi.fn() }),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => <div />,
  Area: () => <div />,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Cell: () => <div />,
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
    getTrend: vi.fn().mockResolvedValue({
      range: "7d",
      granularity: "day",
      points: [
        { time: "03/20", amount: 18200, orderCount: 176 },
        { time: "03/21", amount: 21050, orderCount: 198 },
      ],
    }),
    getPaymentMethods: vi.fn().mockResolvedValue({
      range: "7d",
      methods: [
        { method: "CARD", label: "Card", amount: 58077.5, orderCount: 237, percentage: 65.0 },
        { method: "GOOGLEPAY", label: "Google Pay", amount: 22337.5, orderCount: 91, percentage: 25.0 },
        { method: "APPLEPAY", label: "Apple Pay", amount: 8935, orderCount: 37, percentage: 10.0 },
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

  it("渲染交易趋势图区域", async () => {
    render(<DashboardPage />);
    const title = await screen.findByText("dashboard.trend.title");
    expect(title).toBeInTheDocument();
  });

  it("渲染支付方式分布区域", async () => {
    render(<DashboardPage />);
    const title = await screen.findByText("dashboard.paymentMethods.title");
    expect(title).toBeInTheDocument();
  });

  it("渲染指标卡片数据", async () => {
    render(<DashboardPage />);
    const amount = await screen.findByText((content) => content.includes("89,350.00"));
    expect(amount).toBeInTheDocument();
  });

  it("渲染支付方式明细表格", async () => {
    render(<DashboardPage />);
    const card = await screen.findByText("Card");
    expect(card).toBeInTheDocument();
    expect(screen.getByText("Google Pay")).toBeInTheDocument();
    expect(screen.getByText("Apple Pay")).toBeInTheDocument();
  });
});
