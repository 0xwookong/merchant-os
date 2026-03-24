import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "./page";

describe("首页", () => {
  it("渲染平台名称 'OSLPay Merchant Portal'", () => {
    render(<Home />);
    expect(screen.getByText("OSLPay Merchant Portal")).toBeInTheDocument();
  });
});
