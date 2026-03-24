"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/providers/language-provider";
import { authService } from "@/services/authService";
import { ApiError } from "@/lib/api";
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const { t } = useI18n();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function validateForm(): FormErrors {
    const errs: FormErrors = {};

    if (!form.email.trim()) {
      errs.email = t("auth.validation.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = t("auth.validation.emailInvalid");
    }

    if (!form.password) {
      errs.password = t("auth.validation.passwordRequired");
    } else if (form.password.length < 8) {
      errs.password = t("auth.validation.passwordMinLength");
    } else {
      let typeCount = 0;
      if (/[A-Z]/.test(form.password)) typeCount++;
      if (/[a-z]/.test(form.password)) typeCount++;
      if (/[0-9]/.test(form.password)) typeCount++;
      if (typeCount < 2) {
        errs.password = t("auth.validation.passwordComplexity");
      } else if (form.password.toLowerCase() === form.email.toLowerCase()) {
        errs.password = t("auth.validation.passwordSameAsEmail");
      }
    }

    if (!form.confirmPassword) {
      errs.confirmPassword = t("auth.validation.confirmPasswordRequired");
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = t("auth.validation.confirmPasswordMismatch");
    }

    return errs;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      await authService.register(form);
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError(t("auth.register.networkError"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-[var(--success-soft)] rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-[var(--success)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[var(--gray-900)]">{t("auth.register.success.title")}</h2>
        <p className="text-sm text-[var(--gray-500)]">
          {t("auth.register.success.message", { email: form.email })}
        </p>
        <Link
          href="/login"
          className="inline-block mt-4 text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] transition-colors"
        >
          {t("auth.register.goLoginLink")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-[var(--primary-black)] rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-[var(--neon-green)] font-bold text-xl">O</span>
        </div>
        <h1 className="text-xl font-semibold text-[var(--gray-900)]">{t("auth.register.title")}</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">{t("auth.register.subtitle")}</p>
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
            {t("auth.register.email")}
          </label>
          <div className="relative">
            <EnvelopeIcon className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gray-400)]" />
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder={t("auth.register.email.placeholder")}
              className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-black)] focus:border-transparent transition-shadow ${
                errors.email ? "border-red-300 bg-[var(--error-soft)]" : "border-[var(--gray-300)]"
              }`}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-[var(--error)]">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
            {t("auth.register.password")}
          </label>
          <div className="relative">
            <LockClosedIcon className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gray-400)]" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder={t("auth.register.password.placeholder")}
              className={`w-full border rounded-xl pl-10 pr-11 py-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-black)] focus:border-transparent transition-shadow ${
                errors.password ? "border-red-300 bg-[var(--error-soft)]" : "border-[var(--gray-300)]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[var(--gray-400)] hover:text-[var(--gray-600)] transition-colors"
              aria-label={showPassword ? t("auth.register.password.hide") : t("auth.register.password.show")}
            >
              {showPassword ? <EyeSlashIcon className="w-4.5 h-4.5" /> : <EyeIcon className="w-4.5 h-4.5" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-[var(--error)]">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
            {t("auth.register.confirmPassword")}
          </label>
          <div className="relative">
            <LockClosedIcon className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gray-400)]" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder={t("auth.register.confirmPassword.placeholder")}
              className={`w-full border rounded-xl pl-10 pr-11 py-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-black)] focus:border-transparent transition-shadow ${
                errors.confirmPassword ? "border-red-300 bg-[var(--error-soft)]" : "border-[var(--gray-300)]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[var(--gray-400)] hover:text-[var(--gray-600)] transition-colors"
              aria-label={showConfirmPassword ? t("auth.register.password.hide") : t("auth.register.password.show")}
            >
              {showConfirmPassword ? <EyeSlashIcon className="w-4.5 h-4.5" /> : <EyeIcon className="w-4.5 h-4.5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs text-[var(--error)]">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--primary-black)] text-white font-medium py-3 px-5 rounded-xl hover:bg-[#1a1a1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("auth.register.submitting")}</>
          ) : (
            <>{t("auth.register.submit")}<ArrowRightIcon className="w-4 h-4" /></>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--gray-500)]">
        {t("auth.register.hasAccount")}{" "}
        <Link href="/login" className="font-medium text-[var(--gray-900)] hover:underline inline-flex items-center gap-0.5">
          {t("auth.register.goLogin")} <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </p>
    </div>
  );
}
