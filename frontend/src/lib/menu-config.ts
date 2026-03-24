type UserRole = "ADMIN" | "BUSINESS" | "TECH";

export interface MenuItem {
  key: string;
  label: string;
  icon: string;   // Heroicon name
  path?: string;   // Link path (leaf menu)
  roles: UserRole[];
  children?: MenuItem[];
}

/**
 * Full menu definition. Roles array defines who can see this item.
 * Parent items with children: if all children are filtered out, parent is hidden too.
 */
export const MENU_CONFIG: MenuItem[] = [
  {
    key: "getting-started",
    label: "快速开始",
    icon: "RocketLaunchIcon",
    path: "/getting-started",
    roles: ["ADMIN", "BUSINESS", "TECH"],
  },
  {
    key: "dashboard",
    label: "仪表盘",
    icon: "ChartBarIcon",
    path: "/dashboard",
    roles: ["ADMIN", "BUSINESS"],
  },
  {
    key: "business",
    label: "业务管理",
    icon: "BriefcaseIcon",
    roles: ["ADMIN", "BUSINESS"],
    children: [
      {
        key: "kyb",
        label: "KYB 认证",
        icon: "ShieldCheckIcon",
        path: "/kyb",
        roles: ["ADMIN"],
      },
      {
        key: "onboarding",
        label: "入驻申请",
        icon: "DocumentTextIcon",
        path: "/business/onboarding",
        roles: ["ADMIN", "BUSINESS"],
      },
      {
        key: "members",
        label: "成员与权限",
        icon: "UsersIcon",
        path: "/business/members",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    key: "developer",
    label: "开发者套件",
    icon: "CodeBracketIcon",
    roles: ["ADMIN", "TECH"],
    children: [
      {
        key: "docs",
        label: "API 文档",
        icon: "BookOpenIcon",
        path: "/developer/docs",
        roles: ["ADMIN", "TECH"],
      },
      {
        key: "credentials",
        label: "API 凭证",
        icon: "KeyIcon",
        path: "/developer/credentials",
        roles: ["ADMIN", "TECH"],
      },
      {
        key: "domains",
        label: "域名白名单",
        icon: "GlobeAltIcon",
        path: "/developer/domains",
        roles: ["ADMIN", "TECH"],
      },
      {
        key: "webhooks",
        label: "Webhook 管理",
        icon: "BellAlertIcon",
        path: "/developer/webhooks",
        roles: ["ADMIN", "TECH"],
      },
      {
        key: "signature",
        label: "签名工具",
        icon: "FingerPrintIcon",
        path: "/developer/signature",
        roles: ["ADMIN", "TECH"],
      },
      {
        key: "logs",
        label: "API 请求日志",
        icon: "ClipboardDocumentListIcon",
        path: "/developer/logs",
        roles: ["ADMIN", "TECH"],
      },
      {
        key: "mcp",
        label: "MCP 配置中心",
        icon: "CpuChipIcon",
        path: "/developer/mcp",
        roles: ["ADMIN", "TECH"],
      },
    ],
  },
];

/**
 * Filter menu items by user role.
 * Parent items with children: if all children are filtered out, parent is hidden.
 */
export function filterMenuByRole(items: MenuItem[], role: string): MenuItem[] {
  return items
    .filter((item) => item.roles.includes(role as UserRole))
    .map((item) => {
      if (!item.children) return item;
      const filteredChildren = item.children.filter((child) =>
        child.roles.includes(role as UserRole)
      );
      if (filteredChildren.length === 0) return null;
      return { ...item, children: filteredChildren };
    })
    .filter(Boolean) as MenuItem[];
}
