"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // If user already has a valid session, redirect away from auth pages
  useEffect(() => {
    authService
      .refresh()
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-light)]">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[var(--primary-black)] rounded-lg flex items-center justify-center">
            <span className="text-[var(--neon-green)] font-bold text-lg">O</span>
          </div>
          <span className="text-xl font-semibold text-[var(--gray-900)]">
            OSLPay
          </span>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[var(--gray-200)] p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
