"use client";

import { useState } from "react";
import Link from "next/link";
import { authService } from "@/services/authService";
import { ApiError } from "@/lib/api";

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  companyName?: string;
  contactName?: string;
}

function validateForm(form: {
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  contactName: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!form.email.trim()) {
    errors.email = "邮箱不能为空";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "请输入有效的邮箱地址";
  }

  if (!form.password) {
    errors.password = "密码不能为空";
  } else if (form.password.length < 8) {
    errors.password = "密码至少 8 个字符";
  } else {
    let typeCount = 0;
    if (/[A-Z]/.test(form.password)) typeCount++;
    if (/[a-z]/.test(form.password)) typeCount++;
    if (/[0-9]/.test(form.password)) typeCount++;
    if (typeCount < 2) {
      errors.password = "密码需包含大写字母、小写字母、数字中的至少两种";
    } else if (form.password.toLowerCase() === form.email.toLowerCase()) {
      errors.password = "密码不能与邮箱相同";
    }
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "请确认密码";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "两次密码不一致";
  }

  if (!form.companyName.trim()) {
    errors.companyName = "公司名称不能为空";
  }

  if (!form.contactName.trim()) {
    errors.contactName = "联系人姓名不能为空";
  }

  return errors;
}

export default function RegisterPage() {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm(form);
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
        setServerError("网络错误，请稍后重试");
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
        <h2 className="text-xl font-semibold text-[var(--gray-900)]">验证邮件已发送</h2>
        <p className="text-sm text-[var(--gray-500)]">
          我们已向 <span className="font-medium text-[var(--gray-700)]">{form.email}</span> 发送了一封验证邮件，请查收并点击验证链接完成注册。
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
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">商户注册</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">创建您的 OSLPay 商户账户</p>
      </div>

      {serverError && (
        <div className="bg-[var(--error-soft)] border border-red-200 rounded-lg px-4 py-3 text-sm text-[var(--error)]">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="邮箱" name="email" type="email" value={form.email} error={errors.email} onChange={handleChange} placeholder="your@company.com" />
        <Field label="密码" name="password" type="password" value={form.password} error={errors.password} onChange={handleChange} placeholder="至少 8 位，含大小写和数字" />
        <Field label="确认密码" name="confirmPassword" type="password" value={form.confirmPassword} error={errors.confirmPassword} onChange={handleChange} placeholder="再次输入密码" />
        <Field label="公司名称" name="companyName" type="text" value={form.companyName} error={errors.companyName} onChange={handleChange} placeholder="您的公司全称" />
        <Field label="联系人姓名" name="contactName" type="text" value={form.contactName} error={errors.contactName} onChange={handleChange} placeholder="主联系人姓名" />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--primary-black)] text-white font-medium py-2.5 px-5 rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "注册中..." : "注册"}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--gray-500)]">
        已有账号？{" "}
        <Link href="/login" className="font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] transition-colors">
          去登录
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  value,
  error,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-[var(--gray-700)] mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-4 py-2.5 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
          error ? "border-red-300 bg-[var(--error-soft)]" : "border-[var(--gray-300)]"
        }`}
      />
      {error && <p className="mt-1 text-xs text-[var(--error)]">{error}</p>}
    </div>
  );
}
