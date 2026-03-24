import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RegisterPage from "./page";

describe("注册页面", () => {
  it("渲染页面标题'商户注册'", () => {
    render(<RegisterPage />);
    const headings = screen.getAllByRole("heading", { name: "商户注册" });
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("渲染所有必填表单字段：邮箱、密码、确认密码、公司名称、联系人姓名", () => {
    render(<RegisterPage />);
    expect(screen.getAllByLabelText("邮箱").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText("密码").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText("确认密码").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText("公司名称").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByLabelText("联系人姓名").length).toBeGreaterThanOrEqual(1);
  });

  it("渲染'注册'提交按钮", () => {
    render(<RegisterPage />);
    const buttons = screen.getAllByRole("button", { name: "注册" });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("渲染'去登录'导航链接", () => {
    render(<RegisterPage />);
    const links = screen.getAllByText("去登录");
    expect(links.length).toBeGreaterThanOrEqual(1);
  });
});
