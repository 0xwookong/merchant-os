import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import GettingStartedPage from "./page";

// Mock providers
vi.mock("@/providers/environment-provider", () => ({
  useEnvironment: () => ({ environment: "sandbox", isSandbox: true, toggleEnvironment: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/getting-started",
}));

describe("快速开始页面", () => {
  afterEach(() => cleanup());

  it("渲染页面标题'快速开始'", () => {
    render(<GettingStartedPage />);
    const headings = screen.getAllByRole("heading", { name: "快速开始" });
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("默认展示 WebSDK 模式（Tab 选中 + 步骤 1-4 可见）", () => {
    render(<GettingStartedPage />);
    expect(screen.getAllByText("WebSDK 接入").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("访问 Web SDK 测试页面").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("填写 KYC 信息").length).toBeGreaterThanOrEqual(1);
  });

  it("展示测试卡号表格（3 种卡）", () => {
    render(<GettingStartedPage />);
    expect(screen.getAllByText("4242 4242 4242 4242").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("4539 3732 9896 7400").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("4532 2274 1657 1592").length).toBeGreaterThanOrEqual(1);
  });

  it("展示货币网络限额表格", () => {
    render(<GettingStartedPage />);
    expect(screen.getAllByText("USDT / USDC").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/43,000 EUR/).length).toBeGreaterThanOrEqual(1);
  });

  it("展示快速链接卡片（API 文档、签名工具、Webhook 管理）", () => {
    render(<GettingStartedPage />);
    expect(screen.getAllByText("API 文档").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("签名工具").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Webhook 管理").length).toBeGreaterThanOrEqual(1);
  });

  it("展示技术支持联系邮箱", () => {
    render(<GettingStartedPage />);
    expect(screen.getAllByText("support@osl-pay.com").length).toBeGreaterThanOrEqual(1);
  });
});
