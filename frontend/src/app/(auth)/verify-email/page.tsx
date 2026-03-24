"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/authService";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/providers/language-provider";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center space-y-4 py-8">
          <div className="w-8 h-8 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[var(--gray-500)]">Loading...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage(t("auth.verifyEmail.error.noToken"));
      return;
    }

    // Prevent double-call in React Strict Mode (dev mode runs effects twice)
    if (calledRef.current) return;
    calledRef.current = true;

    authService
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err instanceof ApiError ? err.message : t("auth.verifyEmail.error.generic"));
      });
  }, [token]);

  if (status === "loading") {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="w-8 h-8 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[var(--gray-500)]">{t("auth.verifyEmail.loading")}</p>
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
        <h2 className="text-xl font-semibold text-[var(--gray-900)]">{t("auth.verifyEmail.success.title")}</h2>
        <p className="text-sm text-[var(--gray-500)]">{t("auth.verifyEmail.success.message")}</p>
        <Link
          href="/login"
          className="inline-block mt-4 bg-[var(--primary-black)] text-white font-medium py-2.5 px-5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
        >
          {t("auth.verifyEmail.success.goLogin")}
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
      <h2 className="text-xl font-semibold text-[var(--gray-900)]">{t("auth.verifyEmail.error.title")}</h2>
      <p className="text-sm text-[var(--gray-500)]">{errorMessage}</p>
      <Link
        href="/register"
        className="inline-block mt-4 text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] transition-colors"
      >
        {t("auth.verifyEmail.error.goRegister")}
      </Link>
    </div>
  );
}
