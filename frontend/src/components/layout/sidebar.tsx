"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/language-provider";
import { filterMenuByRole, MENU_CONFIG, type MenuItem } from "@/lib/menu-config";
import { useApplicationStatus } from "@/hooks/useApplicationStatus";
import {
  RocketLaunchIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UsersIcon,
  CodeBracketIcon,
  BookOpenIcon,
  KeyIcon,
  GlobeAltIcon,
  BellAlertIcon,
  FingerPrintIcon,
  ClipboardDocumentListIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  BuildingOffice2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";

const ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  RocketLaunchIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UsersIcon,
  CodeBracketIcon,
  BookOpenIcon,
  KeyIcon,
  GlobeAltIcon,
  BellAlertIcon,
  FingerPrintIcon,
  ClipboardDocumentListIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  BuildingOffice2Icon,
};

const EXPANDED_WIDTH = 265;
const COLLAPSED_WIDTH = 64;
const COLLAPSED_KEY = "sidebar-collapsed";

export default function Sidebar() {
  const { user } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const { applicationStatus, onboardingComplete } = useApplicationStatus();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(COLLAPSED_KEY) === "true") setCollapsed(true);
  }, []);

  const effectiveWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", `${effectiveWidth}px`);
  }, [effectiveWidth]);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  };

  const menuItems = user ? filterMenuByRole(MENU_CONFIG, user.role) : [];

  const applicationApproved = applicationStatus === "APPROVED";

  useEffect(() => {
    for (const item of menuItems) {
      if (item.children?.some((child) => child.path && pathname.startsWith(child.path))) {
        setExpandedKeys((prev) => new Set(prev).add(item.key));
      }
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <aside
      className="fixed left-0 top-16 bottom-0 z-40 flex flex-col bg-white border-r border-[var(--gray-200)] transition-[width] duration-200"
      style={{ width: effectiveWidth }}
    >
      {/* Nav */}
      <nav className={`flex-1 py-6 overflow-y-auto ${collapsed ? "px-2" : "px-4"}`}>
        {(() => {
          // Hide guide section once all onboarding steps are done (application approved + tech integration)
          const visibleItems = onboardingComplete
            ? menuItems.filter((item) => item.section !== "guide")
            : menuItems;

          const sections: { section: string; items: typeof visibleItems }[] = [];
          for (const item of visibleItems) {
            const sec = item.section || "main";
            const last = sections[sections.length - 1];
            if (last && last.section === sec) {
              last.items.push(item);
            } else {
              sections.push({ section: sec, items: [item] });
            }
          }
          return sections.map((group, gi) => (
            <div key={group.section}>
              {gi > 0 && <div className="my-3 border-t border-[var(--gray-200)]" />}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <MenuItemComponent
                    key={item.key}
                    item={item}
                    t={t}
                    collapsed={collapsed}
                    isExpanded={expandedKeys.has(item.key)}
                    onToggle={() => toggleExpand(item.key)}
                    isActive={isActive}
                    isDisabled={item.key === "orders" && !applicationApproved}
                    disabledTooltip={t("nav.kybRequired")}
                  />
                ))}
              </div>
            </div>
          ));
        })()}
      </nav>

      {/* Collapse/Expand toggle */}
      <div className={`border-t border-[var(--gray-200)] py-3 ${collapsed ? "px-2 flex justify-center" : "px-4"}`}>
        <button
          onClick={toggleCollapse}
          className={`flex items-center gap-3 rounded-lg text-sm font-medium text-[var(--gray-500)] hover:bg-[var(--gray-50)] hover:text-[var(--gray-700)] transition-colors ${
            collapsed ? "p-2 justify-center" : "w-full px-3 py-2"
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronDoubleRightIcon className="w-5 h-5" />
          ) : (
            <>
              <ChevronDoubleLeftIcon className="w-5 h-5 shrink-0" />
              <span className="truncate">{t("nav.collapse")}</span>
            </>
          )}
        </button>
      </div>

    </aside>
  );
}

function MenuItemComponent({
  item,
  t,
  collapsed,
  isExpanded,
  onToggle,
  isActive,
  isDisabled = false,
  disabledTooltip,
}: {
  item: MenuItem;
  t: (key: string) => string;
  collapsed: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  isActive: (path?: string) => boolean;
  isDisabled?: boolean;
  disabledTooltip?: string;
}) {
  const IconComponent = ICON_MAP[item.icon];
  const hasChildren = item.children && item.children.length > 0;
  const active = !hasChildren && !isDisabled && isActive(item.path);
  const label = t(item.labelKey);

  if (collapsed) {
    if (hasChildren) {
      return (
        <>
          {item.children!.map((child) => (
            <MenuItemComponent
              key={child.key}
              item={child}
              t={t}
              collapsed={collapsed}
              isExpanded={false}
              onToggle={() => {}}
              isActive={isActive}
            />
          ))}
        </>
      );
    }

    if (isDisabled) {
      return (
        <div
          className="flex items-center justify-center p-2 rounded-lg text-[var(--gray-400)] cursor-not-allowed"
          title={disabledTooltip}
        >
          {IconComponent && <IconComponent className="w-5 h-5" />}
        </div>
      );
    }

    return (
      <Link
        href={item.path || "#"}
        title={label}
        className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
          active
            ? "bg-[var(--primary-black)] text-white"
            : "text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
        }`}
      >
        {IconComponent && (
          <IconComponent
            className={`w-5 h-5 ${active ? "text-[var(--neon-green)]" : "text-[var(--gray-500)]"}`}
          />
        )}
      </Link>
    );
  }

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            {IconComponent && <IconComponent className="w-5 h-5 text-[var(--gray-500)] shrink-0" />}
            <span className="truncate">{label}</span>
          </div>
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4 text-[var(--gray-400)] shrink-0" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-[var(--gray-400)] shrink-0" />
          )}
        </button>
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children!.map((child) => (
              <MenuItemComponent
                key={child.key}
                item={child}
                t={t}
                collapsed={false}
                isExpanded={false}
                onToggle={() => {}}
                isActive={isActive}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isDisabled) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--gray-400)] cursor-not-allowed"
        title={disabledTooltip}
      >
        {IconComponent && <IconComponent className="w-5 h-5 shrink-0" />}
        <span className="truncate">{label}</span>
      </div>
    );
  }

  return (
    <Link
      href={item.path || "#"}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--primary-black)] text-white"
          : "text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
      }`}
    >
      {IconComponent && (
        <IconComponent
          className={`w-5 h-5 shrink-0 ${active ? "text-[var(--neon-green)]" : "text-[var(--gray-500)]"}`}
        />
      )}
      <span className="truncate">{label}</span>
    </Link>
  );
}
