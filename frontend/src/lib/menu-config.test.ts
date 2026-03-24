import { describe, it, expect } from "vitest";
import { filterMenuByRole, MENU_CONFIG } from "./menu-config";

describe("菜单配置 - 角色过滤", () => {
  it("ADMIN 角色 → 看到全部菜单项（快速开始、仪表盘、业务管理、开发者套件）", () => {
    const items = filterMenuByRole(MENU_CONFIG, "ADMIN");
    const keys = items.map((i) => i.key);
    expect(keys).toEqual(["getting-started", "dashboard", "business", "developer"]);
  });

  it("ADMIN 角色 → 业务管理包含入驻申请和成员与权限", () => {
    const items = filterMenuByRole(MENU_CONFIG, "ADMIN");
    const business = items.find((i) => i.key === "business");
    const childKeys = business?.children?.map((c) => c.key);
    expect(childKeys).toEqual(["onboarding", "members"]);
  });

  it("ADMIN 角色 → 开发者套件包含全部 7 个子菜单", () => {
    const items = filterMenuByRole(MENU_CONFIG, "ADMIN");
    const developer = items.find((i) => i.key === "developer");
    expect(developer?.children).toHaveLength(7);
  });

  it("BUSINESS 角色 → 只看到快速开始、仪表盘、业务管理（入驻申请）", () => {
    const items = filterMenuByRole(MENU_CONFIG, "BUSINESS");
    const keys = items.map((i) => i.key);
    expect(keys).toEqual(["getting-started", "dashboard", "business"]);
  });

  it("BUSINESS 角色 → 业务管理只包含入驻申请，不包含成员与权限", () => {
    const items = filterMenuByRole(MENU_CONFIG, "BUSINESS");
    const business = items.find((i) => i.key === "business");
    const childKeys = business?.children?.map((c) => c.key);
    expect(childKeys).toEqual(["onboarding"]);
  });

  it("BUSINESS 角色 → 看不到开发者套件", () => {
    const items = filterMenuByRole(MENU_CONFIG, "BUSINESS");
    const developer = items.find((i) => i.key === "developer");
    expect(developer).toBeUndefined();
  });

  it("TECH 角色 → 只看到快速开始和开发者套件", () => {
    const items = filterMenuByRole(MENU_CONFIG, "TECH");
    const keys = items.map((i) => i.key);
    expect(keys).toEqual(["getting-started", "developer"]);
  });

  it("TECH 角色 → 看不到仪表盘和业务管理", () => {
    const items = filterMenuByRole(MENU_CONFIG, "TECH");
    expect(items.find((i) => i.key === "dashboard")).toBeUndefined();
    expect(items.find((i) => i.key === "business")).toBeUndefined();
  });

  it("TECH 角色 → 开发者套件包含全部 7 个子菜单", () => {
    const items = filterMenuByRole(MENU_CONFIG, "TECH");
    const developer = items.find((i) => i.key === "developer");
    expect(developer?.children).toHaveLength(7);
  });

  it("未知角色 → 返回空菜单", () => {
    const items = filterMenuByRole(MENU_CONFIG, "UNKNOWN");
    expect(items).toEqual([]);
  });
});
