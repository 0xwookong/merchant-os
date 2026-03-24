"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useEnvironment } from "@/providers/environment-provider";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "管理员",
  BUSINESS: "业务人员",
  TECH: "技术人员",
};

export default function TopBar() {
  const { user, logout } = useAuth();
  const { environment, toggleEnvironment } = useEnvironment();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <header className="h-16 bg-[var(--primary-black)] flex items-center justify-between px-6 fixed top-0 left-60 right-0 z-30">
      {/* Left: placeholder */}
      <div />

      {/* Right: env switch + user info + logout */}
      <div className="flex items-center gap-5">
        {/* Environment toggle switch */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleEnvironment}
            className="relative w-[120px] h-8 rounded-full bg-white/10 p-0.5 transition-colors"
            aria-label="切换环境"
          >
            {/* Sliding indicator */}
            <div
              className={`absolute top-0.5 h-7 w-[58px] rounded-full transition-all duration-200 ${
                environment === "production"
                  ? "left-0.5 bg-red-500/80"
                  : "left-[60px] bg-green-500/80"
              }`}
            />
            {/* Labels */}
            <div className="relative flex h-full">
              <span
                className={`flex-1 flex items-center justify-center text-xs font-medium z-10 transition-colors ${
                  environment === "production" ? "text-white" : "text-gray-400"
                }`}
              >
                生产
              </span>
              <span
                className={`flex-1 flex items-center justify-center text-xs font-medium z-10 transition-colors ${
                  environment === "sandbox" ? "text-white" : "text-gray-400"
                }`}
              >
                沙箱
              </span>
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/20" />

        {/* User info + role */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <p className="text-sm text-white font-medium leading-tight">{user.companyName}</p>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--neon-green)]/20 text-[var(--neon-green)]">
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-tight mt-0.5">{user.email}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="登出"
        >
          <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
