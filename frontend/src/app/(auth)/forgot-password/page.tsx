"use client";

import { useState } from "react";
import Link from "next/link";
import { authService } from "@/services/authService";
import { ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("请输入邮箱");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-[var(--info-soft)] rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-[var(--info)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[var(--gray-900)]">邮件已发送</h2>
        <p className="text-sm text-[var(--gray-500)]">
          如果 <span className="font-medium text-[var(--gray-700)]">{email}</span> 已注册，您将收到密码重置邮件。
        </p>
        <Link
          href="/login"
          className="inline-block mt-4 text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] transition-colors"
        >
          返回登录 →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">忘记密码</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">输入您的注册邮箱，我们将发送密码重置链接</p>
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--primary-black)] text-white font-medium py-2.5 px-5 rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "发送中..." : "发送重置链接"}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--gray-500)]">
        <Link href="/login" className="font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] transition-colors">
          ← 返回登录
        </Link>
      </p>
    </div>
  );
}
