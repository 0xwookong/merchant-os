import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import WebhooksPage from "./page";

vi.mock("@/providers/language-provider", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("@/providers/environment-provider", () => ({
  useEnvironment: () => ({ environment: "sandbox", isSandbox: true, toggleEnvironment: vi.fn() }),
}));

const mockConfigs = [
  { id: 1, url: "https://example.com/hook", secret: "whsec_abc123", events: ["order.created"], status: "ACTIVE", createdAt: "2024-01-01" },
];

vi.mock("@/services/webhookService", () => ({
  webhookService: {
    list: vi.fn(() => Promise.resolve(mockConfigs)),
    create: vi.fn(() => Promise.resolve(mockConfigs[0])),
    update: vi.fn(() => Promise.resolve(mockConfigs[0])),
    remove: vi.fn(() => Promise.resolve("ok")),
    testPush: vi.fn(() => Promise.resolve("HTTP 200")),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/developer/webhooks",
}));

describe("Webhook 管理页面", () => {
  afterEach(() => cleanup());

  it("渲染页面标题和创建按钮", async () => {
    render(<WebhooksPage />);
    await waitFor(() => {
      expect(screen.getByText("webhooks.title")).toBeDefined();
      expect(screen.getByText("webhooks.create")).toBeDefined();
    });
  });

  it("展示 Webhook 配置列表", async () => {
    render(<WebhooksPage />);
    await waitFor(() => {
      expect(screen.getByText("https://example.com/hook")).toBeDefined();
      expect(screen.getByText("order.created")).toBeDefined();
    });
  });

  it("展示操作按钮（测试、编辑、删除）", async () => {
    render(<WebhooksPage />);
    await waitFor(() => {
      expect(screen.getByTitle("webhooks.test")).toBeDefined();
      expect(screen.getByTitle("webhooks.edit")).toBeDefined();
      expect(screen.getByTitle("webhooks.delete")).toBeDefined();
    });
  });
});
