import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import MembersPage from "./page";

vi.mock("@/providers/language-provider", () => ({ useI18n: () => ({ t: (k: string) => k }) }));
vi.mock("@/providers/auth-provider", () => ({ useAuth: () => ({ user: { userId: 1, role: "ADMIN" }, isAuthenticated: true }) }));
vi.mock("@/providers/environment-provider", () => ({ useEnvironment: () => ({ environment: "sandbox", isSandbox: true, toggleEnvironment: vi.fn() }) }));
vi.mock("@/services/memberService", () => ({
  memberService: {
    list: vi.fn(() => Promise.resolve([
      { id: 1, contactName: "管理员", email: "admin@test.com", role: "ADMIN", status: "ACTIVE", createdAt: "2024-01-01" },
      { id: 2, contactName: "技术员", email: "tech@test.com", role: "TECH", status: "PENDING", createdAt: "2024-01-02" },
    ])),
    invite: vi.fn(() => Promise.resolve({})),
    remove: vi.fn(() => Promise.resolve("ok")),
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/business/members" }));

describe("成员管理页面", () => {
  afterEach(() => cleanup());

  it("渲染标题和邀请按钮", async () => {
    render(<MembersPage />);
    await waitFor(() => {
      expect(screen.getByText("members.title")).toBeDefined();
      expect(screen.getByText("members.invite")).toBeDefined();
    });
  });

  it("展示成员列表", async () => {
    render(<MembersPage />);
    await waitFor(() => {
      expect(screen.getByText("admin@test.com")).toBeDefined();
      expect(screen.getByText("tech@test.com")).toBeDefined();
    });
  });

  it("展示角色权限卡片", async () => {
    render(<MembersPage />);
    await waitFor(() => {
      expect(screen.getByText("members.role.ADMIN")).toBeDefined();
      expect(screen.getByText("members.role.BUSINESS")).toBeDefined();
      expect(screen.getByText("members.role.TECH")).toBeDefined();
    });
  });
});
