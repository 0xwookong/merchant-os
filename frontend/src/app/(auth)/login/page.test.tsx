import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LoginPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("登录页面", () => {
  it("渲染页面标题'登录'（heading 元素）", () => {
    render(<LoginPage />);
    const headings = screen.getAllByRole("heading", { name: "登录" });
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("渲染邮箱和密码输入框", () => {
    render(<LoginPage />);
    expect(screen.getAllByLabelText("邮箱").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText("密码").length).toBeGreaterThanOrEqual(1);
  });

  it("渲染'登录'提交按钮", () => {
    render(<LoginPage />);
    const buttons = screen.getAllByRole("button", { name: "登录" });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("渲染'忘记密码？'链接", () => {
    render(<LoginPage />);
    const links = screen.getAllByText("忘记密码？");
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("渲染'去注册'导航链接", () => {
    render(<LoginPage />);
    const links = screen.getAllByText("去注册");
    expect(links.length).toBeGreaterThanOrEqual(1);
  });
});
