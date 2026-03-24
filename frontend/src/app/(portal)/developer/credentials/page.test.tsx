import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import CredentialsPage from "./page";

const mockCredentialData = {
  appId: "osl_app_abc123def456",
  apiEndpoint: "https://openapitest.osl-pay.com",
  apiPublicKey: "-----BEGIN PUBLIC KEY-----\nMIIBIjANB...\n-----END PUBLIC KEY-----",
  webhookPublicKey: "-----BEGIN PUBLIC KEY-----\nMIIBIjANB...\n-----END PUBLIC KEY-----",
};

let mockIsSandbox = true;

vi.mock("@/providers/language-provider", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/providers/environment-provider", () => ({
  useEnvironment: () => ({
    environment: mockIsSandbox ? "sandbox" : "production",
    isSandbox: mockIsSandbox,
    toggleEnvironment: vi.fn(),
  }),
}));

vi.mock("@/services/credentialService", () => ({
  credentialService: {
    get: vi.fn(() => Promise.resolve(mockCredentialData)),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/developer/credentials",
}));

describe("API 凭证页面", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mockIsSandbox = true;
  });

  it("渲染凭证项：App ID、API 端点、API 公钥、Webhook 公钥", async () => {
    render(<CredentialsPage />);
    await waitFor(() => {
      expect(screen.getByText("credentials.appId")).toBeDefined();
      expect(screen.getByText("credentials.apiEndpoint")).toBeDefined();
      expect(screen.getByText("credentials.apiPublicKey")).toBeDefined();
      expect(screen.getByText("credentials.webhookPublicKey")).toBeDefined();
    });
  });

  it("展示 App ID 值", async () => {
    render(<CredentialsPage />);
    await waitFor(() => {
      expect(screen.getByText("osl_app_abc123def456")).toBeDefined();
    });
  });

  it("展示 4 个复制按钮（aria-label）", async () => {
    render(<CredentialsPage />);
    await waitFor(() => {
      const copyButtons = screen.getAllByRole("button", { name: /Copy/i });
      expect(copyButtons.length).toBe(4);
    });
  });

  it("点击复制按钮调用 clipboard API", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CredentialsPage />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Copy/i }).length).toBe(4);
    });

    const copyButtons = screen.getAllByRole("button", { name: /Copy/i });
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("osl_app_abc123def456");
    });
  });

  it("沙箱环境显示测试指南", async () => {
    render(<CredentialsPage />);
    await waitFor(() => {
      expect(screen.getByText("credentials.sandbox.title")).toBeDefined();
      expect(screen.getByText("4242 4242 4242 4242")).toBeDefined();
    });
  });

  it("生产环境隐藏沙箱测试指南", async () => {
    mockIsSandbox = false;
    render(<CredentialsPage />);
    await waitFor(() => {
      expect(screen.getByText("credentials.appId")).toBeDefined();
    });
    expect(screen.queryByText("credentials.sandbox.title")).toBeNull();
  });

  it("展示 3 个快速链接卡片", async () => {
    render(<CredentialsPage />);
    await waitFor(() => {
      expect(screen.getByText("credentials.quickLinks.docs")).toBeDefined();
      expect(screen.getByText("credentials.quickLinks.signature")).toBeDefined();
      expect(screen.getByText("credentials.quickLinks.webhooks")).toBeDefined();
    });
  });
});
