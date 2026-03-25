import { describe, it, expect } from "vitest";
import { filterMenuByRole, MENU_CONFIG } from "./menu-config";

describe("菜单配置 - 角色过滤", () => {
  it("ADMIN 角色 → 看到全部菜单项（仪表盘、交易中心、开发者工具、组织管理、快速开始）", () => {
    const items = filterMenuByRole(MENU_CONFIG, "ADMIN");
    const keys = items.map((i) => i.key);
    expect(keys).toEqual(["dashboard", "transactions", "developer", "organization", "getting-started"]);
  });

  it("ADMIN 角色 → 交易中心包含订单管理", () => {
    const items = filterMenuByRole(MENU_CONFIG, "ADMIN");
    const tx = items.find((i) => i.key === "transactions");
    expect(tx?.children?.map((c) => c.key)).toEqual(["orders"]);
  });

  it("ADMIN 角色 → 开发者工具包含全部 7 个子菜单", () => {
    const items = filterMenuByRole(MENU_CONFIG, "ADMIN");
    const developer = items.find((i) => i.key === "developer");
    expect(developer?.children).toHaveLength(7);
  });

  it("ADMIN 角色 → 组织管理包含入驻申请、成员与权限", () => {
    const items = filterMenuByRole(MENU_CONFIG, "ADMIN");
    const org = items.find((i) => i.key === "organization");
    expect(org?.children?.map((c) => c.key)).toEqual(["application", "members"]);
  });

  it("BUSINESS 角色 → 看到仪表盘、交易中心、组织管理（入驻申请）、快速开始", () => {
    const items = filterMenuByRole(MENU_CONFIG, "BUSINESS");
    const keys = items.map((i) => i.key);
    expect(keys).toEqual(["dashboard", "transactions", "organization", "getting-started"]);
  });

  it("BUSINESS 角色 → 看不到开发者工具，组织管理仅含入驻申请", () => {
    const items = filterMenuByRole(MENU_CONFIG, "BUSINESS");
    expect(items.find((i) => i.key === "developer")).toBeUndefined();
    const org = items.find((i) => i.key === "organization");
    expect(org?.children?.map((c) => c.key)).toEqual(["application"]);
  });

  it("TECH 角色 → 看到开发者工具和快速开始", () => {
    const items = filterMenuByRole(MENU_CONFIG, "TECH");
    const keys = items.map((i) => i.key);
    expect(keys).toEqual(["developer", "getting-started"]);
  });

  it("TECH 角色 → 看不到仪表盘、交易中心和组织管理", () => {
    const items = filterMenuByRole(MENU_CONFIG, "TECH");
    expect(items.find((i) => i.key === "dashboard")).toBeUndefined();
    expect(items.find((i) => i.key === "transactions")).toBeUndefined();
    expect(items.find((i) => i.key === "organization")).toBeUndefined();
  });

  it("TECH 角色 → 开发者工具包含全部 7 个子菜单", () => {
    const items = filterMenuByRole(MENU_CONFIG, "TECH");
    const developer = items.find((i) => i.key === "developer");
    expect(developer?.children).toHaveLength(7);
  });

  it("未知角色 → 返回空菜单", () => {
    const items = filterMenuByRole(MENU_CONFIG, "UNKNOWN");
    expect(items).toEqual([]);
  });
});
