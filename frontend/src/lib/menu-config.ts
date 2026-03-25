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
 * Full menu definition. Roles array defines who can see this item.
 * Parent items with children: if all children are filtered out, parent is hidden too.
 * labelKey is an i18n key — call t(labelKey) in the component to get localized text.
 */
export const MENU_CONFIG: MenuItem[] = [
  {
    key: "getting-started",
    labelKey: "nav.gettingStarted",
    icon: "RocketLaunchIcon",
    path: "/getting-started",
    roles: ["ADMIN", "BUSINESS", "TECH"],
  },
  {
    key: "dashboard",
    labelKey: "nav.dashboard",
    icon: "ChartBarIcon",
    path: "/dashboard",
    roles: ["ADMIN", "BUSINESS"],
  },
  {
    key: "business",
    labelKey: "nav.business",
    icon: "BriefcaseIcon",
    roles: ["ADMIN", "BUSINESS"],
    children: [
      {
        key: "kyb",
        labelKey: "nav.business.kyb",
        icon: "ShieldCheckIcon",
        path: "/kyb",
        roles: ["ADMIN"],
      },
      {
        key: "onboarding",
        labelKey: "nav.business.onboarding",
        icon: "DocumentTextIcon",
        path: "/business/onboarding",
        roles: ["ADMIN", "BUSINESS"],
      },
      {
        key: "members",
        labelKey: "nav.business.members",
        icon: "UsersIcon",
        path: "/business/members",
        roles: ["ADMIN"],
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
