import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import LogsPage from "./page";

vi.mock("@/providers/language-provider", () => ({ useI18n: () => ({ t: (k: string) => k }) }));
vi.mock("@/providers/environment-provider", () => ({ useEnvironment: () => ({ environment: "sandbox", isSandbox: true, toggleEnvironment: vi.fn() }) }));
vi.mock("@/services/logService", () => ({
  logService: {
    getLatest: vi.fn(() => Promise.resolve([
      { id: 1, method: "POST", path: "/api/v1/orders", statusCode: 200, durationMs: 45, requestBody: '{"test":1}', responseBody: '{"code":0}', createdAt: "2024-01-01T10:00:00" },
    ])),
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/developer/logs" }));

describe("API 请求日志页面", () => {
  afterEach(() => cleanup());

  it("渲染标题和自动刷新提示", async () => {
    render(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByText("logs.title")).toBeDefined();
      expect(screen.getByText("logs.autoRefresh")).toBeDefined();
    });
  });

  it("展示日志列表", async () => {
    render(<LogsPage />);
    await waitFor(() => {
      expect(screen.getByText("POST")).toBeDefined();
      expect(screen.getByText("/api/v1/orders")).toBeDefined();
      expect(screen.getByText("200")).toBeDefined();
    });
  });
});
