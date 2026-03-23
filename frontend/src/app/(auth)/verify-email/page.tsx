"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/authService";
import { ApiError } from "@/lib/api";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center space-y-4 py-8">
          <div className="w-8 h-8 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[var(--gray-500)]">加载中...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("验证链接无效：缺少 token 参数");
      return;
    }

    authService
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err instanceof ApiError ? err.message : "验证失败，请稍后重试");
      });
  }, [token]);

  if (status === "loading") {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="w-8 h-8 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[var(--gray-500)]">正在验证邮箱...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-[var(--success-soft)] rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-[var(--success)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[var(--gray-900)]">邮箱验证成功</h2>
        <p className="text-sm text-[var(--gray-500)]">您的邮箱已验证成功，现在可以登录平台了。</p>
        <Link
          href="/login"
          className="inline-block mt-4 bg-[var(--primary-black)] text-white font-medium py-2.5 px-5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
        >
          去登录
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <div className="w-12 h-12 bg-[var(--error-soft)] rounded-full flex items-center justify-center mx-auto">
        <svg className="w-6 h-6 text-[var(--error)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-[var(--gray-900)]">验证失败</h2>
      <p className="text-sm text-[var(--gray-500)]">{errorMessage}</p>
      <Link
        href="/register"
        className="inline-block mt-4 text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] transition-colors"
      >
        重新注册 →
      </Link>
    </div>
  );
}
