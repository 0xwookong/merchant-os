"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { getRefreshToken } from "@/lib/auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // If user already has a valid session, redirect away from auth pages
  useEffect(() => {
    const token = getRefreshToken();
    if (!token) {
      setChecking(false);
      return;
    }
    authService
      .refresh(token)
      .then((res) => {
        if (res.authenticated) {
          router.replace("/");
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        setChecking(false);
      });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-light)]">
        <div className="w-8 h-8 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — brand area */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[var(--primary-black)] flex-col justify-between p-12 overflow-hidden">
        {/* Decorative grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMSIgeD0iMCIgeT0iMCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-100" />
        {/* Decorative gradient orb */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[var(--neon-green)] opacity-10 blur-3xl" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[var(--neon-green)] opacity-5 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center">
            <span className="text-[var(--neon-green)] font-bold text-lg">O</span>
          </div>
          <span className="text-xl font-semibold text-white">OSL Pay</span>
        </div>

        {/* Tagline */}
        <div className="relative">
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
            安全合规的<br />
            加密货币<br />
            <span className="text-[var(--neon-green)]">支付网关</span>
          </h2>
          <p className="text-gray-400 mt-6 max-w-md leading-relaxed">
            OSL Pay 是 OSL Group (HKEX: 863) 旗下的专业支付解决方案，为金融机构和金融科技平台提供安全的法币与数字资产转换服务。
          </p>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-gray-600">
          &copy; {new Date().getFullYear()} OSL Group. All rights reserved.
        </p>
      </div>

      {/* Right — form area */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--bg-light)]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-[var(--primary-black)] rounded-lg flex items-center justify-center">
              <span className="text-[var(--neon-green)] font-bold text-lg">O</span>
            </div>
            <span className="text-xl font-semibold text-[var(--gray-900)]">OSL Pay</span>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--gray-200)] p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
