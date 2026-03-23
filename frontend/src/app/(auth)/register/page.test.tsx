import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RegisterPage from "./page";

describe("Register page", () => {
  it("renders the registration form", () => {
    render(<RegisterPage />);
    expect(screen.getByText("商户注册")).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(screen.getByLabelText("确认密码")).toBeInTheDocument();
    expect(screen.getByLabelText("公司名称")).toBeInTheDocument();
    expect(screen.getByLabelText("联系人姓名")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "注册" })).toBeInTheDocument();
  });
});
