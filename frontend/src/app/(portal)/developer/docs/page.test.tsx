import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import DocsPage from "./page";

const mockData = {
  categories: [
    { key: "user", label: "用户管理", count: 2 },
    { key: "order", label: "订单", count: 3 },
    { key: "quote", label: "报价", count: 1 },
    { key: "card", label: "银行卡", count: 3 },
    { key: "config", label: "配置", count: 3 },
    { key: "merchant", label: "商户", count: 2 },
  ],
  endpoints: [
    { operationId: "createOrder", method: "POST", path: "/api/v1/orders", summary: "创建订单", category: "order", tag: "Order" },
    { operationId: "getQuote", method: "POST", path: "/api/v1/quotes", summary: "获取报价", category: "quote", tag: "Quote" },
  ],
};

vi.mock("@/providers/language-provider", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("@/providers/environment-provider", () => ({
  useEnvironment: () => ({ environment: "sandbox", isSandbox: true, toggleEnvironment: vi.fn() }),
}));

vi.mock("@/services/docsService", () => ({
  docsService: {
    listEndpoints: vi.fn(() => Promise.resolve(mockData)),
    getEndpointDetail: vi.fn(() => Promise.resolve({
      operationId: "createOrder",
      method: "POST",
      path: "/api/v1/orders",
      summary: "创建订单",
      description: "desc",
      category: "order",
      tag: "Order",
      parameters: [],
      requestBody: null,
      responses: {},
      aiContextBlock: "## AI Context",
    })),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/developer/docs",
}));

describe("API 文档页面", () => {
  afterEach(() => cleanup());

  it("渲染分类导航（6 个分类 + 全部）", async () => {
    render(<DocsPage />);
    await waitFor(() => {
      expect(screen.getAllByText(/用户管理/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/订单/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/报价/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("渲染端点列表（显示方法 + 路径）", async () => {
    render(<DocsPage />);
    await waitFor(() => {
      expect(screen.getAllByText("POST").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("/api/v1/orders")).toBeDefined();
      expect(screen.getByText("创建订单")).toBeDefined();
    });
  });

  it("展示搜索框", async () => {
    render(<DocsPage />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("docs.search.placeholder")).toBeDefined();
    });
  });

  it("展示详情占位提示", async () => {
    render(<DocsPage />);
    await waitFor(() => {
      expect(screen.getByText("docs.detail.clickToView")).toBeDefined();
    });
  });
});
