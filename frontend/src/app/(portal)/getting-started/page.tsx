"use client";

import { useAuth } from "@/providers/auth-provider";

export default function GettingStartedPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">
          快速开始
        </h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">
          欢迎使用 OSLPay Merchant Portal
        </p>
      </div>

      {user && (
        <div className="bg-white rounded-lg shadow-sm border border-[var(--gray-200)] p-6 space-y-3">
          <h2 className="text-lg font-semibold text-[var(--gray-900)]">当前登录信息</h2>
          <div className="text-sm text-[var(--gray-600)] space-y-1">
            <p>邮箱: {user.email}</p>
            <p>公司: {user.companyName}</p>
            <p>角色: {user.role}</p>
          </div>
        </div>
      )}
    </div>
  );
}
