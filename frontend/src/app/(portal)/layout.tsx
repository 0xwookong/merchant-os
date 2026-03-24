"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { EnvironmentProvider } from "@/providers/environment-provider";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import KybBanner from "@/components/layout/kyb-banner";

function PortalGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-light)]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[var(--gray-500)]">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-light)]">
      <Sidebar />
      <TopBar />
      <main className="ml-60 pt-24 pb-8">
        <div className="max-w-6xl mx-auto px-8">
          <KybBanner />
          {children}
        </div>
      </main>
    </div>
  );
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <EnvironmentProvider>
        <PortalGuard>{children}</PortalGuard>
      </EnvironmentProvider>
    </AuthProvider>
  );
}
