import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LoginPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/providers/language-provider", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: "zh", setLocale: vi.fn() }),
}));

describe("登录页面", () => {
  it("渲染页面标题", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "auth.login.title" })).toBeDefined();
  });

  it("渲染邮箱和密码输入框", () => {
    render(<LoginPage />);
    expect(screen.getAllByText("auth.login.email").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("auth.login.password").length).toBeGreaterThanOrEqual(1);
  });

  it("渲染提交按钮", () => {
    render(<LoginPage />);
    expect(screen.getAllByText("auth.login.submit").length).toBeGreaterThanOrEqual(1);
  });

  it("渲染忘记密码链接", () => {
    render(<LoginPage />);
    expect(screen.getAllByText("auth.login.forgotPassword").length).toBeGreaterThanOrEqual(1);
  });

  it("渲染创建账户链接", () => {
    render(<LoginPage />);
    expect(screen.getAllByText("auth.login.goRegister").length).toBeGreaterThanOrEqual(1);
  });

  it("渲染密码显示/隐藏按钮", () => {
    render(<LoginPage />);
    expect(screen.getAllByLabelText("auth.login.password.show").length).toBeGreaterThanOrEqual(1);
  });
});
