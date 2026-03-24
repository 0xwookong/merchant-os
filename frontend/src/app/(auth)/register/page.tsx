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
  BuildingOffice2Icon,
  UserIcon,
} from "@heroicons/react/24/outline";

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  companyName?: string;
  contactName?: string;
}

export default function RegisterPage() {
  const { t } = useI18n();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    contactName: "",
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

    if (!form.companyName.trim()) {
      errs.companyName = t("auth.validation.companyNameRequired");
    }

    if (!form.contactName.trim()) {
      errs.contactName = t("auth.validation.contactNameRequired");
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

        {/* Company Name */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
            {t("auth.register.companyName")}
          </label>
          <div className="relative">
            <BuildingOffice2Icon className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gray-400)]" />
            <input
              id="companyName"
              name="companyName"
              type="text"
              value={form.companyName}
              onChange={handleChange}
              placeholder={t("auth.register.companyName.placeholder")}
              className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-black)] focus:border-transparent transition-shadow ${
                errors.companyName ? "border-red-300 bg-[var(--error-soft)]" : "border-[var(--gray-300)]"
              }`}
            />
          </div>
          {errors.companyName && <p className="mt-1 text-xs text-[var(--error)]">{errors.companyName}</p>}
        </div>

        {/* Contact Name */}
        <div>
          <label htmlFor="contactName" className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
            {t("auth.register.contactName")}
          </label>
          <div className="relative">
            <UserIcon className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gray-400)]" />
            <input
              id="contactName"
              name="contactName"
              type="text"
              value={form.contactName}
              onChange={handleChange}
              placeholder={t("auth.register.contactName.placeholder")}
              className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-black)] focus:border-transparent transition-shadow ${
                errors.contactName ? "border-red-300 bg-[var(--error-soft)]" : "border-[var(--gray-300)]"
              }`}
            />
          </div>
          {errors.contactName && <p className="mt-1 text-xs text-[var(--error)]">{errors.contactName}</p>}
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

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--gray-200)]" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-[var(--gray-400)]">{t("auth.register.hasAccount")}</span></div>
      </div>

      <Link
        href="/login"
        className="block w-full text-center border border-[var(--gray-300)] text-[var(--gray-700)] font-medium py-3 px-5 rounded-xl hover:bg-[var(--gray-50)] hover:border-[var(--gray-400)] transition-all text-sm"
      >
        {t("auth.register.goLogin")}
      </Link>
    </div>
  );
}
