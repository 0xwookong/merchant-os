"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/providers/language-provider";
import { authService, type LoginResponse, type MerchantSelectItem } from "@/services/authService";
import { setAccessToken, setRefreshToken } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState<MerchantSelectItem[] | null>(null);

  const handleLogin = async (merchantId?: number) => {
    if (!email.trim() || !password) {
      setError(t("auth.login.inputRequired"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res: LoginResponse = await authService.login({ email, password, merchantId });
      if (res.authenticated) {
        setAccessToken(res.accessToken!);
        if (res.refreshToken) setRefreshToken(res.refreshToken);
        router.push("/");
      } else if (res.merchants) {
        setMerchants(res.merchants);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.login.networkError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); handleLogin(); };

  if (merchants) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-[var(--gray-100)] rounded-xl flex items-center justify-center mx-auto mb-4">
            <BuildingOffice2Icon className="w-6 h-6 text-[var(--gray-600)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--gray-900)]">{t("auth.login.selectMerchant.title")}</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">{t("auth.login.selectMerchant.subtitle")}</p>
        </div>
        <div className="space-y-2.5">
          {merchants.map((m) => (
            <button key={m.merchantId} onClick={() => handleLogin(m.merchantId)} disabled={loading}
              className="w-full text-left border border-[var(--gray-200)] rounded-xl p-4 hover:bg-[var(--gray-50)] hover:border-[var(--gray-300)] transition-all disabled:opacity-50 group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[var(--gray-900)]">{m.companyName}</div>
                  <div className="text-xs text-[var(--gray-500)] mt-0.5">
                    {m.role === "ADMIN" ? t("auth.login.role.admin") : m.role === "BUSINESS" ? t("auth.login.role.business") : t("auth.login.role.tech")}
                  </div>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-[var(--gray-400)] group-hover:text-[var(--gray-700)] transition-colors" />
              </div>
            </button>
          ))}
        </div>
        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
        <button onClick={() => { setMerchants(null); setError(""); }}
          className="w-full text-sm text-[var(--gray-500)] hover:text-[var(--gray-700)] transition-colors">
          {t("auth.login.selectMerchant.back")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-12 h-12 bg-[var(--primary-black)] rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-[var(--neon-green)] font-bold text-xl">O</span>
        </div>
        <h1 className="text-xl font-semibold text-[var(--gray-900)]">{t("auth.login.title")}</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">{t("auth.login.subtitle")}</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">{t("auth.login.email")}</label>
          <div className="relative">
            <EnvelopeIcon className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gray-400)]" />
            <input id="email" type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder={t("auth.login.email.placeholder")}
              className="w-full border border-[var(--gray-300)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-black)] focus:border-transparent transition-shadow" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-[var(--gray-700)]">{t("auth.login.password")}</label>
            <Link href="/forgot-password" className="text-xs text-[var(--gray-500)] hover:text-[var(--gray-900)] transition-colors">{t("auth.login.forgotPassword")}</Link>
          </div>
          <div className="relative">
            <LockClosedIcon className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gray-400)]" />
            <input id="password" type={showPassword ? "text" : "password"} value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder={t("auth.login.password.placeholder")}
              className="w-full border border-[var(--gray-300)] rounded-xl pl-10 pr-11 py-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-black)] focus:border-transparent transition-shadow" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[var(--gray-400)] hover:text-[var(--gray-600)] transition-colors"
              aria-label={showPassword ? t("auth.login.password.hide") : t("auth.login.password.show")}>
              {showPassword ? <EyeSlashIcon className="w-4.5 h-4.5" /> : <EyeIcon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[var(--primary-black)] text-white font-medium py-3 px-5 rounded-xl hover:bg-[#1a1a1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2">
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("auth.login.submitting")}</>
          ) : (
            <>{t("auth.login.submit")}<ArrowRightIcon className="w-4 h-4" /></>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--gray-500)]">
        {t("auth.login.noAccount")}{" "}
        <Link href="/register" className="font-medium text-[var(--gray-900)] hover:underline inline-flex items-center gap-0.5">
          {t("auth.login.goRegister")} <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </p>
    </div>
  );
}
