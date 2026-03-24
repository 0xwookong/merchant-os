"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState<MerchantSelectItem[] | null>(null);

  const handleLogin = async (merchantId?: number) => {
    if (!email.trim() || !password) {
      setError("请输入邮箱和密码");
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
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("网络错误，请稍后重试");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  // Merchant selection screen
  if (merchants) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-[var(--gray-100)] rounded-xl flex items-center justify-center mx-auto mb-4">
            <BuildingOffice2Icon className="w-6 h-6 text-[var(--gray-600)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--gray-900)]">选择商户</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            您的账号关联了多个商户，请选择要登录的商户
          </p>
        </div>

        <div className="space-y-2.5">
          {merchants.map((m) => (
            <button
              key={m.merchantId}
              onClick={() => handleLogin(m.merchantId)}
              disabled={loading}
              className="w-full text-left border border-[var(--gray-200)] rounded-xl p-4 hover:bg-[var(--gray-50)] hover:border-[var(--gray-300)] transition-all disabled:opacity-50 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[var(--gray-900)]">{m.companyName}</div>
                  <div className="text-xs text-[var(--gray-500)] mt-0.5">
                    {m.role === "ADMIN" ? "管理员" : m.role === "BUSINESS" ? "业务人员" : "技术人员"}
                  </div>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-[var(--gray-400)] group-hover:text-[var(--gray-700)] transition-colors" />
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={() => { setMerchants(null); setError(""); }}
          className="w-full text-sm text-[var(--gray-500)] hover:text-[var(--gray-700)] transition-colors"
        >
          &larr; 返回登录
        </button>
      </div>
    );
  }

  // Login form
  return (
    <div className="space-y-8">
      {/* Header with logo */}
      <div className="text-center">
        <div className="w-12 h-12 bg-[var(--primary-black)] rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-[var(--neon-green)] font-bold text-xl">O</span>
        </div>
        <h1 className="text-xl font-semibold text-[var(--gray-900)]">欢迎回来</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">登录您的 OSL Pay 商户账户</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
            邮箱
          </label>
          <div className="relative">
            <EnvelopeIcon className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gray-400)]" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="your@company.com"
              className="w-full border border-[var(--gray-300)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-black)] focus:border-transparent transition-shadow"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-[var(--gray-700)]">
              密码
            </label>
            <Link href="/forgot-password" className="text-xs text-[var(--gray-500)] hover:text-[var(--gray-900)] transition-colors">
              忘记密码？
            </Link>
          </div>
          <div className="relative">
            <LockClosedIcon className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gray-400)]" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="输入密码"
              className="w-full border border-[var(--gray-300)] rounded-xl pl-10 pr-11 py-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-black)] focus:border-transparent transition-shadow"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[var(--gray-400)] hover:text-[var(--gray-600)] transition-colors"
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
            >
              {showPassword ? <EyeSlashIcon className="w-4.5 h-4.5" /> : <EyeIcon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--primary-black)] text-white font-medium py-3 px-5 rounded-xl hover:bg-[#1a1a1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              登录中...
            </>
          ) : (
            <>
              登录
              <ArrowRightIcon className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--gray-200)]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-[var(--gray-400)]">还没有账号？</span>
        </div>
      </div>

      <Link
        href="/register"
        className="block w-full text-center border border-[var(--gray-300)] text-[var(--gray-700)] font-medium py-3 px-5 rounded-xl hover:bg-[var(--gray-50)] hover:border-[var(--gray-400)] transition-all text-sm"
      >
        创建商户账户
      </Link>
    </div>
  );
}
