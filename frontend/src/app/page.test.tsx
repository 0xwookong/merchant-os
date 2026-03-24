import { describe, it, expect, vi } from "vitest";

// Mock next/navigation before importing the component
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { redirect } from "next/navigation";
import Home from "./page";

describe("根路径 /", () => {
  it("访问根路径 → 重定向到 /getting-started", () => {
    Home();
    expect(redirect).toHaveBeenCalledWith("/getting-started");
  });
});
