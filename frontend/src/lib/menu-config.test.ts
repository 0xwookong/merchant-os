import { describe, it, expect } from "vitest";
import { filterMenuByRole, MENU_CONFIG } from "./menu-config";

describe("菜单配置 - 角色过滤", () => {
  it("ADMIN 角色 → 看到全部菜单项（快速开始在前，业务菜单在后）", () => {
    const items = filterMenuByRole(MENU_CONFIG, "ADMIN");
    const keys = items.map((i) => i.key);
    expect(keys).toEqual(["getting-started", "dashboard", "orders", "developer", "organization"]);
  });

  it("ADMIN 角色 → 订单是一级菜单，路径为 /orders", () => {
    const items = filterMenuByRole(MENU_CONFIG, "ADMIN");
    const orders = items.find((i) => i.key === "orders");
    expect(orders?.path).toBe("/orders");
    expect(orders?.children).toBeUndefined();
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

  it("BUSINESS 角色 → 看到快速开始、仪表盘、订单、组织管理（入驻申请）", () => {
    const items = filterMenuByRole(MENU_CONFIG, "BUSINESS");
    const keys = items.map((i) => i.key);
    expect(keys).toEqual(["getting-started", "dashboard", "orders", "organization"]);
  });

  it("BUSINESS 角色 → 看不到开发者工具，组织管理仅含入驻申请", () => {
    const items = filterMenuByRole(MENU_CONFIG, "BUSINESS");
    expect(items.find((i) => i.key === "developer")).toBeUndefined();
    const org = items.find((i) => i.key === "organization");
    expect(org?.children?.map((c) => c.key)).toEqual(["application"]);
  });

  it("TECH 角色 → 看到快速开始和开发者工具", () => {
    const items = filterMenuByRole(MENU_CONFIG, "TECH");
    const keys = items.map((i) => i.key);
    expect(keys).toEqual(["getting-started", "developer"]);
  });

  it("TECH 角色 → 看不到仪表盘、订单和组织管理", () => {
    const items = filterMenuByRole(MENU_CONFIG, "TECH");
    expect(items.find((i) => i.key === "dashboard")).toBeUndefined();
    expect(items.find((i) => i.key === "orders")).toBeUndefined();
    expect(items.find((i) => i.key === "organization")).toBeUndefined();
  });

  it("TECH 角色 → 开发者工具包含全部 7 个子菜单", () => {
    const items = filterMenuByRole(MENU_CONFIG, "TECH");
    const developer = items.find((i) => i.key === "developer");
    expect(developer?.children).toHaveLength(7);
  });

  it("快速开始属于 guide section，其余属于 main section", () => {
    const gs = MENU_CONFIG.find((i) => i.key === "getting-started");
    expect(gs?.section).toBe("guide");
    const mainItems = MENU_CONFIG.filter((i) => i.key !== "getting-started");
    for (const item of mainItems) {
      expect(item.section).toBe("main");
    }
  });

  it("未知角色 → 返回空菜单", () => {
    const items = filterMenuByRole(MENU_CONFIG, "UNKNOWN");
    expect(items).toEqual([]);
  });
});
