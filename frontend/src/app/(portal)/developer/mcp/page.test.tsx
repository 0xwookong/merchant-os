import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import McpPage from "./page";

vi.mock("@/providers/language-provider", () => ({ useI18n: () => ({ t: (k: string) => k }) }));
vi.mock("@/providers/environment-provider", () => ({ useEnvironment: () => ({ environment: "sandbox", isSandbox: true, toggleEnvironment: vi.fn() }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/developer/mcp" }));

describe("MCP 配置中心页面", () => {
  afterEach(() => cleanup());

  it("渲染标题和环境信息", () => {
    render(<McpPage />);
    expect(screen.getByText("mcp.title")).toBeDefined();
    expect(screen.getByText("mcp.env.title")).toBeDefined();
  });

  it("展示 6 个 MCP 工具", () => {
    render(<McpPage />);
    expect(screen.getByText("oslpay_get_quote")).toBeDefined();
    expect(screen.getByText("oslpay_create_order")).toBeDefined();
    expect(screen.getByText("oslpay_generate_signature")).toBeDefined();
  });

  it("展示配置指南 5 步", () => {
    render(<McpPage />);
    expect(screen.getByText("mcp.guide.step1")).toBeDefined();
    expect(screen.getByText("mcp.guide.step5")).toBeDefined();
  });

  it("展示复制配置按钮", () => {
    render(<McpPage />);
    expect(screen.getByText("mcp.config.copy")).toBeDefined();
  });
});
