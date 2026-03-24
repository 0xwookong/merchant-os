import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import SignaturePage from "./page";

vi.mock("@/providers/language-provider", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("@/providers/environment-provider", () => ({
  useEnvironment: () => ({ environment: "sandbox", isSandbox: true, toggleEnvironment: vi.fn() }),
}));

vi.mock("@/services/signService", () => ({
  signService: {
    generate: vi.fn(() => Promise.resolve({
      signatureString: "appId=demo&timestamp=123",
      signature: "abc123==",
      headerValue: "open-api-sign: abc123==",
    })),
    verify: vi.fn(() => Promise.resolve({ valid: true, signatureString: "appId=demo&timestamp=123" })),
    encrypt: vi.fn(() => Promise.resolve({ ciphertext: "encrypted==" })),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/developer/signature",
}));

describe("签名工具页面", () => {
  afterEach(() => cleanup());

  it("渲染 3 个 Tab：生成签名、验证签名、加密数据", () => {
    render(<SignaturePage />);
    expect(screen.getByText("signature.tab.generate")).toBeDefined();
    expect(screen.getByText("signature.tab.verify")).toBeDefined();
    expect(screen.getByText("signature.tab.encrypt")).toBeDefined();
  });

  it("预填测试数据：App ID 和当前时间戳", () => {
    render(<SignaturePage />);
    const appIdInput = screen.getByDisplayValue("demo_app_20240101");
    expect(appIdInput).toBeDefined();
  });

  it("展示密钥生成参考命令", () => {
    render(<SignaturePage />);
    expect(screen.getByText("openssl genrsa -out private.pem 2048")).toBeDefined();
  });

  it("默认选中生成签名 Tab", () => {
    render(<SignaturePage />);
    const generateTab = screen.getByText("signature.tab.generate");
    expect(generateTab.getAttribute("data-state")).toBe("active");
  });

  it("展示重置按钮", () => {
    render(<SignaturePage />);
    expect(screen.getByText("signature.reset")).toBeDefined();
  });
});
