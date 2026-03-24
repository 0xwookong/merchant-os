"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/providers/language-provider";
import { authService } from "@/services/authService";
import { ApiError } from "@/lib/api";
import {
  EnvelopeIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(t("auth.forgotPassword.inputRequired"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.forgotPassword.networkError"));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-[var(--info-soft)] rounded-full flex items-center justify-center mx-auto">
          <EnvelopeIcon className="w-6 h-6 text-[var(--info)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--gray-900)]">{t("auth.forgotPassword.sent.title")}</h2>
        <p className="text-sm text-[var(--gray-500)]">
          {t("auth.forgotPassword.sent.message", { email })}
        </p>
        <Link
          href="/login"
          className="inline-block mt-4 text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] transition-colors"
        >
          {t("auth.forgotPassword.sent.goLoginLink")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-12 h-12 bg-[var(--primary-black)] rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-[var(--neon-green)] font-bold text-xl">O</span>
        </div>
        <h1 className="text-xl font-semibold text-[var(--gray-900)]">{t("auth.forgotPassword.title")}</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">{t("auth.forgotPassword.subtitle")}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
            {t("auth.forgotPassword.email")}
          </label>
          <div className="relative">
            <EnvelopeIcon className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gray-400)]" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder={t("auth.forgotPassword.email.placeholder")}
              className="w-full border border-[var(--gray-300)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-black)] focus:border-transparent transition-shadow"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--primary-black)] text-white font-medium py-3 px-5 rounded-xl hover:bg-[#1a1a1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("auth.forgotPassword.submitting")}</>
          ) : (
            <>{t("auth.forgotPassword.submit")}<ArrowRightIcon className="w-4 h-4" /></>
          )}
        </button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-[var(--gray-500)] hover:text-[var(--gray-700)] transition-colors"
        >
          {t("auth.forgotPassword.backToLogin")}
        </Link>
      </div>
    </div>
  );
}
