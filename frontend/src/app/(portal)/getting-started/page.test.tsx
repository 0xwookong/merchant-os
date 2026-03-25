import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import GettingStartedPage from "./page";

vi.mock("@/providers/language-provider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en", setLocale: vi.fn() }),
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({
    user: { email: "admin@test.com", role: "ADMIN", companyName: "Test Corp" },
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }),
}));

vi.mock("@/providers/environment-provider", () => ({
  useEnvironment: () => ({ environment: "sandbox", isSandbox: true, toggleEnvironment: vi.fn() }),
}));

vi.mock("@/services/merchantService", () => ({
  merchantService: {
    getProgress: vi.fn().mockResolvedValue({
      accountCreated: true,
      kybStatus: "NOT_STARTED",
      onboardingStatus: null,
      hasCredentials: false,
      hasWebhooks: false,
      hasDomains: false,
    }),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/getting-started",
}));

describe("快速开始页面 — Onboarding Journey", () => {
  afterEach(() => cleanup());

  it("渲染页面标题", async () => {
    render(<GettingStartedPage />);
    await waitFor(() => {
      expect(screen.getByText("journey.title")).toBeInTheDocument();
    });
  });

  it("ADMIN 角色 → 渲染全部 5 个步骤", async () => {
    render(<GettingStartedPage />);
    await waitFor(() => {
      expect(screen.getByText("journey.step1.title")).toBeInTheDocument();
      expect(screen.getByText("journey.step2.title")).toBeInTheDocument();
      expect(screen.getByText("journey.step3.title")).toBeInTheDocument();
      expect(screen.getByText("journey.step4.title")).toBeInTheDocument();
      expect(screen.getByText("journey.step5.title")).toBeInTheDocument();
    });
  });

  it("KYB 未开始 → Step 3 显示锁定提示", async () => {
    render(<GettingStartedPage />);
    await waitFor(() => {
      expect(screen.getByText("journey.step3.lockedNote")).toBeInTheDocument();
    });
  });

  it("KYB 未通过 → 显示沙箱提示横幅", async () => {
    render(<GettingStartedPage />);
    await waitFor(() => {
      expect(screen.getByText("journey.sandboxHint")).toBeInTheDocument();
    });
  });

  it("渲染开发者快速指南折叠区", async () => {
    render(<GettingStartedPage />);
    await waitFor(() => {
      expect(screen.getByText("journey.devGuide.title")).toBeInTheDocument();
    });
  });

  it("渲染技术集成子任务", async () => {
    render(<GettingStartedPage />);
    await waitFor(() => {
      expect(screen.getByText("journey.step4.sub.credentials")).toBeInTheDocument();
      expect(screen.getByText("journey.step4.sub.webhooks")).toBeInTheDocument();
      expect(screen.getByText("journey.step4.sub.domains")).toBeInTheDocument();
    });
  });

  it("渲染技术支持联系邮箱", async () => {
    render(<GettingStartedPage />);
    await waitFor(() => {
      expect(screen.getByText("support@osl-pay.com")).toBeInTheDocument();
    });
  });
});
