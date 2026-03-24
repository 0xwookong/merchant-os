import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RegisterPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/providers/language-provider", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: "zh", setLocale: vi.fn() }),
}));

describe("注册页面", () => {
  it("渲染页面标题", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("heading", { name: "auth.register.title" })).toBeDefined();
  });

  it("渲染所有必填表单字段：邮箱、密码、确认密码、公司名称、联系人姓名", () => {
    render(<RegisterPage />);
    expect(screen.getAllByText("auth.register.email").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("auth.register.password").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("auth.register.confirmPassword").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("auth.register.companyName").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("auth.register.contactName").length).toBeGreaterThanOrEqual(1);
  });

  it("渲染提交按钮", () => {
    render(<RegisterPage />);
    expect(screen.getAllByText("auth.register.submit").length).toBeGreaterThanOrEqual(1);
  });

  it("渲染'去登录'导航链接", () => {
    render(<RegisterPage />);
    expect(screen.getAllByText("auth.register.goLogin").length).toBeGreaterThanOrEqual(1);
  });

  it("渲染密码显示/隐藏按钮", () => {
    render(<RegisterPage />);
    expect(screen.getAllByLabelText("auth.register.password.show").length).toBeGreaterThanOrEqual(1);
  });
});
