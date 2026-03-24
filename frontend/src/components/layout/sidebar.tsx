"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { filterMenuByRole, MENU_CONFIG, type MenuItem } from "@/lib/menu-config";
import { kybService } from "@/services/kybService";
import {
  RocketLaunchIcon,
  ChartBarIcon,
  BriefcaseIcon,
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
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  RocketLaunchIcon,
  ChartBarIcon,
  BriefcaseIcon,
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
};

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [kybApproved, setKybApproved] = useState(false);

  const menuItems = user ? filterMenuByRole(MENU_CONFIG, user.role) : [];

  // Check KYB status for onboarding gate
  useEffect(() => {
    kybService.getStatus()
      .then((res) => setKybApproved(res.kybStatus === "APPROVED"))
      .catch(() => {});
  }, []);

  // Auto-expand parent menu when a child path matches
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
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Logo area */}
      <div className="h-16 bg-[var(--primary-black)] flex items-center px-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[var(--neon-green)] rounded-lg flex items-center justify-center">
            <span className="text-[var(--primary-black)] font-bold text-sm">O</span>
          </div>
          <span className="text-white font-semibold text-lg">OSL Pay</span>
        </div>
      </div>

      {/* Nav area */}
      <nav className="flex-1 bg-white border-r border-[var(--gray-200)] px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <MenuItemComponent
            key={item.key}
            item={item}
            isExpanded={expandedKeys.has(item.key)}
            onToggle={() => toggleExpand(item.key)}
            isActive={isActive}
            isDisabled={item.key === "onboarding" && !kybApproved}
            disabledTooltip="请先完成 KYB 认证"
          />
        ))}
      </nav>
    </aside>
  );
}

function MenuItemComponent({
  item,
  isExpanded,
  onToggle,
  isActive,
  isDisabled = false,
  disabledTooltip,
}: {
  item: MenuItem;
  isExpanded: boolean;
  onToggle: () => void;
  isActive: (path?: string) => boolean;
  isDisabled?: boolean;
  disabledTooltip?: string;
}) {
  const IconComponent = ICON_MAP[item.icon];
  const hasChildren = item.children && item.children.length > 0;
  const active = !hasChildren && !isDisabled && isActive(item.path);

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition-colors"
        >
          <div className="flex items-center gap-3">
            {IconComponent && <IconComponent className="w-5 h-5 text-[var(--gray-500)]" />}
            <span>{item.label}</span>
          </div>
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4 text-[var(--gray-400)]" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-[var(--gray-400)]" />
          )}
        </button>
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children!.map((child) => (
              <MenuItemComponent
                key={child.key}
                item={child}
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
        {IconComponent && <IconComponent className="w-5 h-5" />}
        <span>{item.label}</span>
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
          className={`w-5 h-5 ${active ? "text-[var(--neon-green)]" : "text-[var(--gray-500)]"}`}
        />
      )}
      <span>{item.label}</span>
    </Link>
  );
}
