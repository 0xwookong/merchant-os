type UserRole = "ADMIN" | "BUSINESS" | "TECH";

export interface MenuItem {
  key: string;
  labelKey: string; // i18n key, resolved at render time
  icon: string;     // Heroicon name
  path?: string;    // Link path (leaf menu)
  roles: UserRole[];
  children?: MenuItem[];
}

/**
 * Full menu definition — ordered by usage frequency: high → low.
 * Roles array defines who can see this item.
 * Parent items with children: if all children are filtered out, parent is hidden too.
 */
export const MENU_CONFIG: MenuItem[] = [
  {
    key: "dashboard",
    labelKey: "nav.dashboard",
    icon: "ChartBarIcon",
    path: "/dashboard",
    roles: ["ADMIN", "BUSINESS"],
  },
  {
    key: "transactions",
    labelKey: "nav.transactions",
    icon: "BanknotesIcon",
    roles: ["ADMIN", "BUSINESS"],
    children: [
      {
        key: "orders",
        labelKey: "nav.transactions.orders",
        icon: "ShoppingCartIcon",
        path: "/transactions/orders",
        roles: ["ADMIN", "BUSINESS"],
      },
    ],
  },
  {
    key: "developer",
    labelKey: "nav.developer",
    icon: "CodeBracketIcon",
    roles: ["ADMIN", "TECH"],
    children: [
      {
        key: "docs",
        labelKey: "nav.developer.docs",
        icon: "BookOpenIcon",
        path: "/developer/docs",
        roles: ["ADMIN", "TECH"],
      },
      {
        key: "credentials",
        labelKey: "nav.developer.credentials",
        icon: "KeyIcon",
        path: "/developer/credentials",
        roles: ["ADMIN", "TECH"],
      },
      {
        key: "domains",
        labelKey: "nav.developer.domains",
        icon: "GlobeAltIcon",
        path: "/developer/domains",
        roles: ["ADMIN", "TECH"],
      },
      {
        key: "webhooks",
        labelKey: "nav.developer.webhooks",
        icon: "BellAlertIcon",
        path: "/developer/webhooks",
        roles: ["ADMIN", "TECH"],
      },
      {
        key: "signature",
        labelKey: "nav.developer.signature",
        icon: "FingerPrintIcon",
        path: "/developer/signature",
        roles: ["ADMIN", "TECH"],
      },
      {
        key: "logs",
        labelKey: "nav.developer.logs",
        icon: "ClipboardDocumentListIcon",
        path: "/developer/logs",
        roles: ["ADMIN", "TECH"],
      },
      {
        key: "mcp",
        labelKey: "nav.developer.mcp",
        icon: "CpuChipIcon",
        path: "/developer/mcp",
        roles: ["ADMIN", "TECH"],
      },
    ],
  },
  {
    key: "organization",
    labelKey: "nav.organization",
    icon: "BuildingOffice2Icon",
    roles: ["ADMIN"],
    children: [
      {
        key: "kyb",
        labelKey: "nav.organization.kyb",
        icon: "ShieldCheckIcon",
        path: "/organization/kyb",
        roles: ["ADMIN"],
      },
      {
        key: "onboarding",
        labelKey: "nav.organization.onboarding",
        icon: "DocumentTextIcon",
        path: "/organization/onboarding",
        roles: ["ADMIN"],
      },
      {
        key: "members",
        labelKey: "nav.organization.members",
        icon: "UsersIcon",
        path: "/organization/members",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    key: "getting-started",
    labelKey: "nav.gettingStarted",
    icon: "RocketLaunchIcon",
    path: "/getting-started",
    roles: ["ADMIN", "BUSINESS", "TECH"],
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
