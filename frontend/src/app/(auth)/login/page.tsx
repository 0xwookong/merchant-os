"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService, type LoginResponse, type MerchantSelectItem } from "@/services/authService";
import { setAccessToken, setRefreshToken } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        <div>
          <h1 className="text-2xl font-semibold text-[var(--gray-900)]">选择商户</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            您的账号关联了多个商户，请选择要登录的商户
          </p>
        </div>

        <div className="space-y-3">
          {merchants.map((m) => (
            <button
              key={m.merchantId}
              onClick={() => handleLogin(m.merchantId)}
              disabled={loading}
              className="w-full text-left bg-white border border-[var(--gray-200)] rounded-lg p-4 hover:bg-[var(--gray-50)] hover:shadow-sm transition-all disabled:opacity-50"
            >
              <div className="font-medium text-[var(--gray-900)]">{m.companyName}</div>
              <div className="text-xs text-[var(--gray-500)] mt-1">
                角色: {m.role === "ADMIN" ? "管理员" : m.role === "BUSINESS" ? "业务人员" : "技术人员"}
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-[var(--error-soft)] border border-red-200 rounded-lg px-4 py-3 text-sm text-[var(--error)]">
            {error}
          </div>
        )}

        <button
          onClick={() => { setMerchants(null); setError(""); }}
          className="w-full text-sm text-[var(--gray-500)] hover:text-[var(--gray-700)] transition-colors"
        >
          ← 返回登录
        </button>
      </div>
    );
  }

  // Login form
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">登录</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">登录您的 OSLPay 商户账户</p>
      </div>

      {error && (
        <div className="bg-[var(--error-soft)] border border-red-200 rounded-lg px-4 py-3 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--gray-700)] mb-1">
            邮箱
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="your@company.com"
            className="w-full border border-[var(--gray-300)] rounded-lg px-4 py-2.5 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-[var(--gray-700)]">
              密码
            </label>
            <Link href="/forgot-password" className="text-xs text-[var(--gray-500)] hover:text-[var(--gray-700)] transition-colors">
              忘记密码？
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="输入密码"
            className="w-full border border-[var(--gray-300)] rounded-lg px-4 py-2.5 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--primary-black)] text-white font-medium py-2.5 px-5 rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "登录中..." : "登录"}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--gray-500)]">
        没有账号？{" "}
        <Link href="/register" className="font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] transition-colors">
          去注册
        </Link>
      </p>
    </div>
  );
}
