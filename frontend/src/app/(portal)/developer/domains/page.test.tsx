import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import DomainsPage from "./page";

vi.mock("@/providers/language-provider", () => ({ useI18n: () => ({ t: (k: string) => k }) }));
vi.mock("@/providers/environment-provider", () => ({ useEnvironment: () => ({ environment: "sandbox", isSandbox: true, toggleEnvironment: vi.fn() }) }));
vi.mock("@/services/domainService", () => ({
  domainService: {
    list: vi.fn(() => Promise.resolve([
      { id: 1, domain: "https://example.com", createdAt: "2024-01-01" },
    ])),
    add: vi.fn(() => Promise.resolve({ id: 2, domain: "https://new.com", createdAt: "2024-01-02" })),
    remove: vi.fn(() => Promise.resolve("ok")),
  },
}));
vi.mock("@/services/securityService", () => ({
  securityService: {
    getOtpStatus: vi.fn(() => Promise.resolve({ otpEnabled: false })),
    sendEmailCode: vi.fn(() => Promise.resolve("ok")),
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/developer/domains" }));

describe("域名白名单页面", () => {
  afterEach(() => cleanup());

  it("渲染标题和添加输入框", async () => {
    render(<DomainsPage />);
    await waitFor(() => {
      expect(screen.getByText("domains.title")).toBeDefined();
      expect(screen.getByPlaceholderText("domains.add.placeholder")).toBeDefined();
    });
  });

  it("展示域名列表", async () => {
    render(<DomainsPage />);
    await waitFor(() => {
      expect(screen.getByText("https://example.com")).toBeDefined();
    });
  });

  it("展示用途说明", async () => {
    render(<DomainsPage />);
    await waitFor(() => {
      expect(screen.getByText("domains.info")).toBeDefined();
    });
  });

  it("点击添加 → 弹出验证对话框", async () => {
    render(<DomainsPage />);
    await waitFor(() => screen.getByPlaceholderText("domains.add.placeholder"));

    const input = screen.getByPlaceholderText("domains.add.placeholder");
    fireEvent.change(input, { target: { value: "https://new-domain.com" } });
    fireEvent.click(screen.getByText("domains.add"));

    await waitFor(() => {
      expect(screen.getByText("domains.verify.title")).toBeDefined();
      expect(screen.getByText("https://new-domain.com")).toBeDefined();
    });
  });

  it("点击删除 → 弹出验证对话框（显示域名信息）", async () => {
    render(<DomainsPage />);
    await waitFor(() => screen.getByText("https://example.com"));

    const removeButton = screen.getByTitle("domains.remove");
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText("domains.remove.title")).toBeDefined();
    });
  });
});
