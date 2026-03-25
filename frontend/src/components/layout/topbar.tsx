"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuth } from "@/providers/auth-provider";
import { useEnvironment } from "@/providers/environment-provider";
import { useI18n } from "@/providers/language-provider";
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  KeyIcon,
  LanguageIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import ChangePasswordDialog from "./change-password-dialog";

export default function TopBar() {
  const { user, logout } = useAuth();
  const { environment, toggleEnvironment } = useEnvironment();
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handlePasswordChanged = () => {
    setChangePasswordOpen(false);
    handleLogout();
  };

  return (
    <>
      <header className="h-16 bg-[var(--primary-black)] flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[var(--neon-green)] rounded-lg flex items-center justify-center">
            <span className="text-[var(--primary-black)] font-bold text-sm">O</span>
          </div>
          <span className="text-white font-semibold text-lg">OSL Pay</span>
          <span className="text-gray-500 text-xl leading-none">·</span>
          <span className="text-gray-400 text-sm font-medium">Merchant Portal</span>
        </div>

        <div className="flex items-center gap-5">
          {/* Environment toggle */}
          <button
            onClick={toggleEnvironment}
            className="relative w-[148px] h-8 rounded-full bg-white/10 p-0.5 transition-colors"
            aria-label={t("env.toggleLabel")}
          >
            <div
              className={`absolute top-0.5 h-7 w-[72px] rounded-full transition-all duration-200 ${
                environment === "production"
                  ? "left-0.5 bg-red-500/80"
                  : "left-[74px] bg-green-500/80"
              }`}
            />
            <div className="relative flex h-full">
              <span className={`flex-1 flex items-center justify-center text-xs z-10 transition-colors ${
                environment === "production" ? "text-white font-semibold" : "text-gray-400 font-medium"
              }`}>
                {t("env.production")}
              </span>
              <span className={`flex-1 flex items-center justify-center text-xs z-10 transition-colors ${
                environment === "sandbox" ? "text-white font-semibold" : "text-gray-400 font-medium"
              }`}>
                {t("env.sandbox")}
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
                        {t(`user.role.${user.role}`) || user.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 text-right">{user.email}</p>
                  </div>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[220px] bg-white rounded-xl shadow-lg border border-[var(--gray-200)] py-1.5 z-50"
                  sideOffset={8}
                  align="end"
                >
                  <DropdownMenu.Item
                    className="flex items-center gap-3 mx-1.5 px-3 py-2.5 text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)] rounded-lg cursor-pointer outline-none transition-colors"
                    onSelect={() => setChangePasswordOpen(true)}
                  >
                    <KeyIcon className="w-4 h-4 text-[var(--gray-500)]" />
                    <span className="flex-1">{t("user.menu.changePassword")}</span>
                    <ChevronRightIcon className="w-4 h-4 text-[var(--gray-400)]" />
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    className="flex items-center gap-3 mx-1.5 px-3 py-2.5 text-sm text-[var(--gray-400)] rounded-lg cursor-not-allowed outline-none"
                    disabled
                  >
                    <ShieldCheckIcon className="w-4 h-4" />
                    <span className="flex-1">{t("user.menu.securitySettings")}</span>
                    <span className="text-[10px] bg-[var(--gray-100)] text-[var(--gray-400)] px-1.5 py-0.5 rounded-full font-medium">
                      {t("user.menu.comingSoon")}
                    </span>
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="h-px bg-[var(--gray-100)] my-1" />

                  <DropdownMenu.Item
                    className="flex items-center gap-3 mx-1.5 px-3 py-2.5 text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)] rounded-lg cursor-pointer outline-none transition-colors"
                    onSelect={() => setLocale(locale === "zh" ? "en" : "zh")}
                  >
                    <LanguageIcon className="w-4 h-4 text-[var(--gray-500)]" />
                    <span className="flex-1">{locale === "zh" ? "English" : "中文"}</span>
                    <ChevronRightIcon className="w-4 h-4 text-[var(--gray-400)]" />
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="h-px bg-[var(--gray-100)] my-1" />

                  <DropdownMenu.Item
                    className="flex items-center gap-3 mx-1.5 px-3 py-2.5 text-sm text-[var(--error)] hover:bg-[var(--error-soft)] rounded-lg cursor-pointer outline-none transition-colors"
                    onSelect={handleLogout}
                  >
                    <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
                    {t("user.menu.logout")}
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
