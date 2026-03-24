"use client";

import { useEffect, useState } from "react";
import { kybService, type KybSubmitRequest } from "@/services/kybService";
import { ApiError } from "@/lib/api";
import {
  BuildingOffice2Icon,
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

type Step = 1 | 2 | 3;

const COMPANY_TYPES = [
  { value: "LIMITED", label: "有限公司" },
  { value: "PARTNERSHIP", label: "合伙企业" },
  { value: "SOLE_PROPRIETORSHIP", label: "个人独资" },
  { value: "OTHER", label: "其他" },
];

const ID_TYPES = [
  { value: "ID_CARD", label: "身份证" },
  { value: "PASSPORT", label: "护照" },
  { value: "OTHER", label: "其他" },
];

export default function KybPage() {
  const [kybStatus, setKybStatus] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<KybSubmitRequest>({
    companyRegCountry: "",
    companyRegNumber: "",
    businessLicenseNo: "",
    companyType: "LIMITED",
    legalRepName: "",
    legalRepNationality: "",
    legalRepIdType: "ID_CARD",
    legalRepIdNumber: "",
    legalRepSharePct: undefined,
  });

  useEffect(() => {
    kybService.getStatus()
      .then((res) => { setKybStatus(res.kybStatus); setRejectReason(res.rejectReason); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateField = (field: keyof KybSubmitRequest, value: string | number | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await kybService.submit(form);
      setKybStatus("PENDING");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full animate-spin" /></div>;
  }

  // Status display for non-editable states
  if (kybStatus === "APPROVED") {
    return <StatusCard icon={<CheckCircleIcon className="w-8 h-8 text-[var(--success)]" />} title="KYB 认证已通过" desc="您的商户资质已通过审核，可正常使用所有功能。" color="success" />;
  }
  if (kybStatus === "PENDING") {
    return <StatusCard icon={<ClockIcon className="w-8 h-8 text-[var(--warning)]" />} title="KYB 认证审核中" desc="您的认证申请已提交，我们将尽快完成审核。审核结果将通过邮件通知。" color="warning" />;
  }

  // Form for NOT_STARTED, REJECTED, NEED_MORE_INFO
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">KYB 认证</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">完成商户资质认证以开通全部功能</p>
      </div>

      {kybStatus === "REJECTED" && rejectReason && (
        <div className="bg-[var(--error-soft)] border border-red-200 rounded-lg p-4 flex gap-3">
          <XCircleIcon className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--error)]">审核未通过</p>
            <p className="text-sm text-[var(--gray-600)] mt-1">{rejectReason}</p>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              s === step ? "bg-[var(--primary-black)] text-white" : s < step ? "bg-green-500 text-white" : "bg-[var(--gray-200)] text-[var(--gray-500)]"
            }`}>{s < step ? "✓" : s}</div>
            <span className={`text-sm ${s === step ? "font-semibold text-[var(--gray-900)]" : "text-[var(--gray-500)]"}`}>
              {s === 1 ? "公司信息" : s === 2 ? "法人信息" : "确认提交"}
            </span>
            {s < 3 && <div className="w-8 h-px bg-[var(--gray-300)]" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-[var(--error-soft)] border border-red-200 rounded-lg px-4 py-3 text-sm text-[var(--error)]">{error}</div>
      )}

      {/* Step 1: Company info */}
      {step === 1 && (
        <div className="bg-white rounded-lg border border-[var(--gray-200)] shadow-sm p-8 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <BuildingOffice2Icon className="w-5 h-5 text-[var(--gray-500)]" />
            <h2 className="text-lg font-semibold text-[var(--gray-900)]">公司基本信息</h2>
          </div>
          <FormField label="公司注册地" value={form.companyRegCountry} onChange={(v) => updateField("companyRegCountry", v)} placeholder="如：Hong Kong" />
          <FormField label="公司注册号" value={form.companyRegNumber} onChange={(v) => updateField("companyRegNumber", v)} placeholder="公司注册号码" />
          <FormField label="营业执照号" value={form.businessLicenseNo} onChange={(v) => updateField("businessLicenseNo", v)} placeholder="营业执照编号" />
          <SelectField label="公司类型" value={form.companyType} onChange={(v) => updateField("companyType", v)} options={COMPANY_TYPES} />
          <div className="flex justify-end pt-2">
            <button onClick={() => setStep(2)} className="bg-[var(--primary-black)] text-white text-sm font-medium py-2.5 px-5 rounded-lg hover:bg-[#1a1a1a] transition-colors">
              下一步
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Legal rep info */}
      {step === 2 && (
        <div className="bg-white rounded-lg border border-[var(--gray-200)] shadow-sm p-8 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <UserIcon className="w-5 h-5 text-[var(--gray-500)]" />
            <h2 className="text-lg font-semibold text-[var(--gray-900)]">法人/实控人信息</h2>
          </div>
          <FormField label="法人姓名" value={form.legalRepName} onChange={(v) => updateField("legalRepName", v)} placeholder="法定代表人姓名" />
          <FormField label="国籍" value={form.legalRepNationality} onChange={(v) => updateField("legalRepNationality", v)} placeholder="如：中国" />
          <SelectField label="证件类型" value={form.legalRepIdType} onChange={(v) => updateField("legalRepIdType", v)} options={ID_TYPES} />
          <FormField label="证件号码" value={form.legalRepIdNumber} onChange={(v) => updateField("legalRepIdNumber", v)} placeholder="证件号码" />
          <FormField label="持股比例 (%)" value={form.legalRepSharePct?.toString() ?? ""} onChange={(v) => updateField("legalRepSharePct", v ? Number(v) : undefined)} placeholder="如：80" type="number" />
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(1)} className="text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] transition-colors">
              ← 上一步
            </button>
            <button onClick={() => setStep(3)} className="bg-[var(--primary-black)] text-white text-sm font-medium py-2.5 px-5 rounded-lg hover:bg-[#1a1a1a] transition-colors">
              下一步
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm & submit */}
      {step === 3 && (
        <div className="bg-white rounded-lg border border-[var(--gray-200)] shadow-sm p-8 space-y-5">
          <h2 className="text-lg font-semibold text-[var(--gray-900)]">确认信息</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="公司注册地" value={form.companyRegCountry} />
            <InfoRow label="公司注册号" value={form.companyRegNumber} />
            <InfoRow label="营业执照号" value={form.businessLicenseNo} />
            <InfoRow label="公司类型" value={COMPANY_TYPES.find((t) => t.value === form.companyType)?.label ?? form.companyType} />
            <InfoRow label="法人姓名" value={form.legalRepName} />
            <InfoRow label="国籍" value={form.legalRepNationality} />
            <InfoRow label="证件类型" value={ID_TYPES.find((t) => t.value === form.legalRepIdType)?.label ?? form.legalRepIdType} />
            <InfoRow label="证件号码" value={form.legalRepIdNumber} />
            <InfoRow label="持股比例" value={form.legalRepSharePct ? `${form.legalRepSharePct}%` : "-"} />
          </div>
          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(2)} className="text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] transition-colors">
              ← 上一步
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="bg-[var(--primary-black)] text-white text-sm font-medium py-2.5 px-5 rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? "提交中..." : "提交认证"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusCard({ icon, title, desc, color }: { icon: React.ReactNode; title: string; desc: string; color: string }) {
  const bgMap: Record<string, string> = { success: "bg-[var(--success-soft)]", warning: "bg-[var(--warning-soft)]" };
  return (
    <div className="max-w-lg mx-auto mt-20 text-center space-y-4">
      <div className={`w-16 h-16 ${bgMap[color] ?? ""} rounded-full flex items-center justify-center mx-auto`}>{icon}</div>
      <h1 className="text-xl font-semibold text-[var(--gray-900)]">{title}</h1>
      <p className="text-sm text-[var(--gray-500)]">{desc}</p>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-[var(--gray-300)] rounded-lg px-4 py-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[var(--gray-300)] rounded-lg px-4 py-3 text-sm text-[var(--gray-900)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--gray-500)]">{label}</dt>
      <dd className="font-medium text-[var(--gray-900)] mt-0.5">{value || "-"}</dd>
    </div>
  );
}
