"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuth } from "@/providers/auth-provider";
import { useEnvironment } from "@/providers/environment-provider";
import { useI18n } from "@/providers/language-provider";
import {
  ArrowRightStartOnRectangleIcon,
  KeyIcon,
  LanguageIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import ChangePasswordDialog from "./change-password-dialog";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "管理员",
  BUSINESS: "业务人员",
  TECH: "技术人员",
};

export default function TopBar() {
  const { user, logout } = useAuth();
  const { environment, toggleEnvironment } = useEnvironment();
  const { locale, setLocale } = useI18n();
  const router = useRouter();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handlePasswordChanged = () => {
    setChangePasswordOpen(false);
    // Force re-login since refresh token was revoked
    handleLogout();
  };

  return (
    <>
      <header className="h-16 bg-[var(--primary-black)] flex items-center justify-between px-6 fixed top-0 left-60 right-0 z-30">
        <div />

        <div className="flex items-center gap-5">
          {/* Environment toggle */}
          <button
            onClick={toggleEnvironment}
            className="relative w-[120px] h-8 rounded-full bg-white/10 p-0.5 transition-colors"
            aria-label="切换环境"
          >
            <div
              className={`absolute top-0.5 h-7 w-[58px] rounded-full transition-all duration-200 ${
                environment === "production"
                  ? "left-0.5 bg-red-500/80"
                  : "left-[60px] bg-green-500/80"
              }`}
            />
            <div className="relative flex h-full">
              <span className={`flex-1 flex items-center justify-center text-xs font-medium z-10 transition-colors ${
                environment === "production" ? "text-white" : "text-gray-400"
              }`}>
                生产
              </span>
              <span className={`flex-1 flex items-center justify-center text-xs font-medium z-10 transition-colors ${
                environment === "sandbox" ? "text-white" : "text-gray-400"
              }`}>
                沙箱
              </span>
            </div>
          </button>

          <div className="w-px h-8 bg-white/20" />

          {/* User dropdown */}
          {user && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-medium">{user.companyName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--neon-green)]/20 text-[var(--neon-green)]">
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 text-right">{user.email}</p>
                  </div>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[200px] bg-white rounded-lg shadow-lg border border-[var(--gray-200)] py-1 z-50"
                  sideOffset={8}
                  align="end"
                >
                  <DropdownMenu.Item
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)] cursor-pointer outline-none"
                    onSelect={() => setChangePasswordOpen(true)}
                  >
                    <KeyIcon className="w-4 h-4 text-[var(--gray-500)]" />
                    修改密码
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--gray-400)] cursor-not-allowed outline-none"
                    disabled
                  >
                    <ShieldCheckIcon className="w-4 h-4" />
                    安全设置
                    <span className="ml-auto text-[10px] bg-[var(--gray-100)] text-[var(--gray-400)] px-1.5 py-0.5 rounded">
                      即将上线
                    </span>
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="h-px bg-[var(--gray-100)] my-1" />

                  <DropdownMenu.Item
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)] cursor-pointer outline-none"
                    onSelect={() => setLocale(locale === "zh" ? "en" : "zh")}
                  >
                    <LanguageIcon className="w-4 h-4 text-[var(--gray-500)]" />
                    {locale === "zh" ? "English" : "中文"}
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="h-px bg-[var(--gray-100)] my-1" />

                  <DropdownMenu.Item
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--error)] hover:bg-[var(--error-soft)] cursor-pointer outline-none"
                    onSelect={handleLogout}
                  >
                    <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
                    退出登录
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>
      </header>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        onSuccess={handlePasswordChanged}
      />
    </>
  );
}
