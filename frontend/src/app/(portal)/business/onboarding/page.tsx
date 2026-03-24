"use client";

import { useEffect, useState } from "react";
import { onboardingService, type OnboardingSaveDraftRequest } from "@/services/onboardingService";
import { ApiError } from "@/lib/api";
import {
  BuildingOffice2Icon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

type Step = 1 | 2 | 3;

const BUSINESS_TYPES = [
  { value: "E_COMMERCE", label: "电商" },
  { value: "GAMING", label: "游戏" },
  { value: "FINANCE", label: "金融" },
  { value: "SAAS", label: "SaaS" },
  { value: "OTHER", label: "其他" },
];

const VOLUME_RANGES = [
  { value: "UNDER_10K", label: "< $10,000" },
  { value: "10K_50K", label: "$10,000 - $50,000" },
  { value: "50K_100K", label: "$50,000 - $100,000" },
  { value: "100K_500K", label: "$100,000 - $500,000" },
  { value: "OVER_500K", label: "> $500,000" },
];

const FIAT_OPTIONS = ["USD", "EUR", "GBP", "HKD", "SGD", "JPY"];
const CRYPTO_OPTIONS = ["BTC", "ETH", "USDT", "USDC", "SOL", "MATIC"];

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);

  const [form, setForm] = useState<OnboardingSaveDraftRequest>({
    submit: false,
    currentStep: 1,
    companyName: "",
    companyAddress: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    businessType: "E_COMMERCE",
    monthlyVolume: "10K_50K",
    supportedFiat: "USD",
    supportedCrypto: "USDT",
    businessDesc: "",
  });

  // Load draft on mount
  useEffect(() => {
    onboardingService.getCurrent()
      .then((res) => {
        if (res) {
          setAppStatus(res.status);
          setStep((res.currentStep ?? 1) as Step);
          setForm({
            submit: false,
            currentStep: res.currentStep ?? 1,
            companyName: res.companyName ?? "",
            companyAddress: res.companyAddress ?? "",
            contactName: res.contactName ?? "",
            contactPhone: res.contactPhone ?? "",
            contactEmail: res.contactEmail ?? "",
            businessType: res.businessType ?? "E_COMMERCE",
            monthlyVolume: res.monthlyVolume ?? "10K_50K",
            supportedFiat: res.supportedFiat ?? "USD",
            supportedCrypto: res.supportedCrypto ?? "USDT",
            businessDesc: res.businessDesc ?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateField = (field: keyof OnboardingSaveDraftRequest, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const saveDraft = async (nextStep: Step) => {
    setSaving(true);
    try {
      await onboardingService.saveDraft({ ...form, currentStep: nextStep, submit: false });
      setStep(nextStep);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await onboardingService.saveDraft({ ...form, submit: true });
      setAppStatus(res.status);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "提交失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full animate-spin" /></div>;
  }

  // Status display
  if (appStatus === "SUBMITTED" || appStatus === "UNDER_REVIEW") {
    return <StatusCard icon={<ClockIcon className="w-8 h-8 text-[var(--warning)]" />} title="入驻申请审核中" desc="您的申请已提交，我们将尽快审核。" />;
  }
  if (appStatus === "APPROVED") {
    return <StatusCard icon={<CheckCircleIcon className="w-8 h-8 text-[var(--success)]" />} title="入驻申请已通过" desc="恭喜！您的商户入驻已通过审核。" />;
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--gray-900)]">入驻申请</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">填写商户入驻信息</p>
        </div>
        {appStatus === "DRAFT" && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--gray-100)] text-[var(--gray-600)]">草稿</span>
        )}
        {appStatus === "REJECTED" && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">已拒绝</span>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              s === step ? "bg-[var(--primary-black)] text-white" : s < step ? "bg-green-500 text-white" : "bg-[var(--gray-200)] text-[var(--gray-500)]"
            }`}>{s < step ? "✓" : s}</div>
            <span className={`text-sm ${s === step ? "font-semibold text-[var(--gray-900)]" : "text-[var(--gray-500)]"}`}>
              {s === 1 ? "公司信息" : s === 2 ? "业务信息" : "确认提交"}
            </span>
            {s < 3 && <div className="w-8 h-px bg-[var(--gray-300)]" />}
          </div>
        ))}
      </div>

      {error && <div className="bg-[var(--error-soft)] border border-red-200 rounded-lg px-4 py-3 text-sm text-[var(--error)]">{error}</div>}

      {/* Step 1 */}
      {step === 1 && (
        <Card icon={<BuildingOffice2Icon className="w-5 h-5 text-[var(--gray-500)]" />} title="公司信息">
          <Field label="公司名称" value={form.companyName ?? ""} onChange={(v) => updateField("companyName", v)} placeholder="商户公司全称" />
          <Field label="公司地址" value={form.companyAddress ?? ""} onChange={(v) => updateField("companyAddress", v)} placeholder="详细地址" />
          <Field label="联系人姓名" value={form.contactName ?? ""} onChange={(v) => updateField("contactName", v)} placeholder="主联系人" />
          <Field label="联系电话" value={form.contactPhone ?? ""} onChange={(v) => updateField("contactPhone", v)} placeholder="+86-13800138000" />
          <Field label="联系邮箱" value={form.contactEmail ?? ""} onChange={(v) => updateField("contactEmail", v)} placeholder="contact@company.com" type="email" />
          <div className="flex justify-end pt-3">
            <button onClick={() => saveDraft(2)} disabled={saving} className="bg-[var(--primary-black)] text-white text-sm font-medium py-2.5 px-6 rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-50">
              {saving ? "保存中..." : "下一步"}
            </button>
          </div>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Card icon={<BriefcaseIcon className="w-5 h-5 text-[var(--gray-500)]" />} title="业务信息">
          <Select label="业务类型" value={form.businessType ?? ""} onChange={(v) => updateField("businessType", v)} options={BUSINESS_TYPES} />
          <Select label="月交易量范围" value={form.monthlyVolume ?? ""} onChange={(v) => updateField("monthlyVolume", v)} options={VOLUME_RANGES} />
          <CheckboxGroup label="支持的法币" options={FIAT_OPTIONS} value={form.supportedFiat ?? ""} onChange={(v) => updateField("supportedFiat", v)} />
          <CheckboxGroup label="支持的加密货币" options={CRYPTO_OPTIONS} value={form.supportedCrypto ?? ""} onChange={(v) => updateField("supportedCrypto", v)} />
          <div>
            <label className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">业务描述</label>
            <textarea value={form.businessDesc ?? ""} onChange={(e) => updateField("businessDesc", e.target.value)} rows={4} placeholder="简述商户业务"
              className="w-full border border-[var(--gray-300)] rounded-lg px-4 py-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
          </div>
          <div className="flex justify-between pt-3">
            <button onClick={() => setStep(1)} className="text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)]">← 上一步</button>
            <button onClick={() => saveDraft(3)} disabled={saving} className="bg-[var(--primary-black)] text-white text-sm font-medium py-2.5 px-6 rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-50">
              {saving ? "保存中..." : "下一步"}
            </button>
          </div>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-8 space-y-6">
          <h2 className="text-lg font-semibold text-[var(--gray-900)]">确认信息</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <Info label="公司名称" value={form.companyName} />
            <Info label="公司地址" value={form.companyAddress} />
            <Info label="联系人" value={form.contactName} />
            <Info label="电话" value={form.contactPhone} />
            <Info label="邮箱" value={form.contactEmail} />
            <Info label="业务类型" value={BUSINESS_TYPES.find((t) => t.value === form.businessType)?.label} />
            <Info label="月交易量" value={VOLUME_RANGES.find((v) => v.value === form.monthlyVolume)?.label} />
            <Info label="法币" value={form.supportedFiat} />
            <Info label="加密货币" value={form.supportedCrypto} />
          </div>
          <div className="text-sm">
            <span className="text-[var(--gray-500)]">业务描述：</span>
            <span className="text-[var(--gray-900)]">{form.businessDesc || "-"}</span>
          </div>
          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(2)} className="text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)]">← 返回修改</button>
            <button onClick={handleSubmit} disabled={saving} className="bg-[var(--primary-black)] text-white text-sm font-medium py-2.5 px-6 rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-50">
              {saving ? "提交中..." : "提交申请"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Sub-components =====

function StatusCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="max-w-lg mx-auto mt-20 text-center space-y-4">
      <div className="w-16 h-16 bg-[var(--gray-50)] rounded-full flex items-center justify-center mx-auto">{icon}</div>
      <h1 className="text-xl font-semibold text-[var(--gray-900)]">{title}</h1>
      <p className="text-sm text-[var(--gray-500)]">{desc}</p>
    </div>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-8 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h2 className="text-lg font-semibold text-[var(--gray-900)]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-[var(--gray-300)] rounded-lg px-4 py-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
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

function CheckboxGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const selected = new Set(value.split(",").filter(Boolean));
  const toggle = (opt: string) => {
    const next = new Set(selected);
    if (next.has(opt)) next.delete(opt); else next.add(opt);
    onChange(Array.from(next).join(","));
  };
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              selected.has(opt) ? "bg-[var(--primary-black)] text-white border-[var(--primary-black)]" : "bg-white text-[var(--gray-600)] border-[var(--gray-300)] hover:border-[var(--gray-400)]"
            }`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[var(--gray-500)]">{label}</dt>
      <dd className="font-medium text-[var(--gray-900)] mt-0.5">{value || "-"}</dd>
    </div>
  );
}
