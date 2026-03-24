"use client";

import { useEffect, useState } from "react";
import { onboardingService, type OnboardingSaveDraftRequest } from "@/services/onboardingService";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/providers/language-provider";
import {
  BuildingOffice2Icon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

type Step = 1 | 2 | 3;

const COUNTRY_CODES = [
  { value: "+86", label: "\u{1F1E8}\u{1F1F3} +86" },
  { value: "+852", label: "\u{1F1ED}\u{1F1F0} +852" },
  { value: "+1", label: "\u{1F1FA}\u{1F1F8} +1" },
  { value: "+44", label: "\u{1F1EC}\u{1F1E7} +44" },
  { value: "+81", label: "\u{1F1EF}\u{1F1F5} +81" },
  { value: "+82", label: "\u{1F1F0}\u{1F1F7} +82" },
  { value: "+65", label: "\u{1F1F8}\u{1F1EC} +65" },
  { value: "+61", label: "\u{1F1E6}\u{1F1FA} +61" },
  { value: "+49", label: "\u{1F1E9}\u{1F1EA} +49" },
  { value: "+33", label: "\u{1F1EB}\u{1F1F7} +33" },
  { value: "+971", label: "\u{1F1E6}\u{1F1EA} +971" },
];

const FIAT_OPTIONS = ["USD", "EUR", "GBP", "HKD", "SGD", "JPY"];
const CRYPTO_OPTIONS = ["BTC", "ETH", "USDT", "USDC", "SOL", "MATIC"];

export default function OnboardingPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);

  const BUSINESS_TYPES = [
    { value: "E_COMMERCE", label: t("onboarding.businessType.E_COMMERCE") },
    { value: "GAMING", label: t("onboarding.businessType.GAMING") },
    { value: "FINANCE", label: t("onboarding.businessType.FINANCE") },
    { value: "SAAS", label: t("onboarding.businessType.SAAS") },
    { value: "OTHER", label: t("onboarding.businessType.OTHER") },
  ];
  const VOLUME_RANGES = [
    { value: "UNDER_10K", label: t("onboarding.volumeRange.UNDER_10K") },
    { value: "10K_50K", label: t("onboarding.volumeRange.10K_50K") },
    { value: "50K_100K", label: t("onboarding.volumeRange.50K_100K") },
    { value: "100K_500K", label: t("onboarding.volumeRange.100K_500K") },
    { value: "OVER_500K", label: t("onboarding.volumeRange.OVER_500K") },
  ];

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
      setError(err instanceof ApiError ? err.message : t("common.saveFailed"));
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
      setError(err instanceof ApiError ? err.message : t("common.submitError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full animate-spin" /></div>;
  }

  const handleReset = async () => {
    setSaving(true);
    try {
      const res = await onboardingService.resetToDraft();
      setAppStatus(res.status);
      setStep(1);
      // Pre-fill form with previous data
      setForm({
        submit: false,
        currentStep: 1,
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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.resetFailed"));
    } finally {
      setSaving(false);
    }
  };

  // Status tracking view (non-DRAFT states)
  if (appStatus && appStatus !== "DRAFT") {
    return (
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("onboarding.title")}</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">{t("onboarding.trackingSubtitle")}</p>
        </div>

        {/* Status banner */}
        {(appStatus === "SUBMITTED" || appStatus === "UNDER_REVIEW") && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <ClockIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800 font-medium">{t("onboarding.submitted.desc")}</p>
          </div>
        )}
        {appStatus === "APPROVED" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 font-medium">{t("onboarding.approved.desc")}</p>
          </div>
        )}
        {appStatus === "REJECTED" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{t("onboarding.rejected.title")}</p>
              <p className="text-sm text-[var(--gray-600)] mt-1">{form.businessDesc ? t("onboarding.rejected.editAndResubmit") : t("onboarding.rejected.contactSupport")}</p>
            </div>
            <button onClick={handleReset} disabled={saving}
              className="text-sm font-medium text-red-700 hover:text-red-900 underline flex-shrink-0">
              {saving ? t("common.resetting") : t("onboarding.resubmit")}
            </button>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-8">
          <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-5">{t("onboarding.timeline.title")}</h2>
          <div className="space-y-4">
            <TimelineItem done label={t("onboarding.timeline.submitted")} active={appStatus === "SUBMITTED"} />
            <TimelineItem done={appStatus === "UNDER_REVIEW" || appStatus === "APPROVED" || appStatus === "REJECTED"} label={t("onboarding.timeline.reviewing")} active={appStatus === "UNDER_REVIEW"} />
            <TimelineItem done={appStatus === "APPROVED"} failed={appStatus === "REJECTED"} label={appStatus === "REJECTED" ? t("onboarding.timeline.rejected") : appStatus === "APPROVED" ? t("onboarding.timeline.approved") : t("onboarding.timeline.result")} />
          </div>
        </div>

        {/* Info preview */}
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-8">
          <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-5">{t("onboarding.submittedInfo")}</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <Info label={t("onboarding.field.companyName")} value={form.companyName} />
            <Info label={t("onboarding.field.companyAddress")} value={form.companyAddress} />
            <Info label={t("onboarding.field.contact")} value={form.contactName} />
            <Info label={t("onboarding.field.phone")} value={form.contactPhone} />
            <Info label={t("onboarding.field.email")} value={form.contactEmail} />
            <Info label={t("onboarding.field.businessType")} value={BUSINESS_TYPES.find((bt) => bt.value === form.businessType)?.label} />
            <Info label={t("onboarding.field.monthlyVolume")} value={VOLUME_RANGES.find((v) => v.value === form.monthlyVolume)?.label} />
            <Info label={t("onboarding.field.fiat")} value={form.supportedFiat} />
            <Info label={t("onboarding.field.crypto")} value={form.supportedCrypto} />
          </div>
          {form.businessDesc && (
            <div className="mt-4 text-sm">
              <span className="text-[var(--gray-500)]">{t("onboarding.field.businessDescLabel")}</span>
              <span className="text-[var(--gray-900)]">{form.businessDesc}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("onboarding.title")}</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">{t("onboarding.draftSubtitle")}</p>
        </div>
        {appStatus === "DRAFT" && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--gray-100)] text-[var(--gray-600)]">{t("common.draft")}</span>
        )}
        {appStatus === "REJECTED" && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">{t("common.rejected")}</span>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              s === step ? "bg-[var(--primary-black)] text-white" : s < step ? "bg-green-500 text-white" : "bg-[var(--gray-200)] text-[var(--gray-500)]"
            }`}>{s < step ? "\u2713" : s}</div>
            <span className={`text-sm ${s === step ? "font-semibold text-[var(--gray-900)]" : "text-[var(--gray-500)]"}`}>
              {s === 1 ? t("onboarding.step.company") : s === 2 ? t("onboarding.step.business") : t("onboarding.step.confirm")}
            </span>
            {s < 3 && <div className="w-8 h-px bg-[var(--gray-300)]" />}
          </div>
        ))}
      </div>

      {error && <div className="bg-[var(--error-soft)] border border-red-200 rounded-lg px-4 py-3 text-sm text-[var(--error)]">{error}</div>}

      {/* Step 1 */}
      {step === 1 && (
        <Card icon={<BuildingOffice2Icon className="w-5 h-5 text-[var(--gray-500)]" />} title={t("onboarding.section.companyInfo")}>
          <Field label={t("onboarding.field.companyName")} value={form.companyName ?? ""} onChange={(v) => updateField("companyName", v)} placeholder={t("onboarding.placeholder.companyName")} />
          <Field label={t("onboarding.field.companyAddress")} value={form.companyAddress ?? ""} onChange={(v) => updateField("companyAddress", v)} placeholder={t("onboarding.placeholder.companyAddress")} />
          <Field label={t("onboarding.field.contactName")} value={form.contactName ?? ""} onChange={(v) => updateField("contactName", v)} placeholder={t("onboarding.placeholder.contactName")} />
          <PhoneField
            label={t("onboarding.field.contactPhone")}
            value={form.contactPhone ?? ""}
            onChange={(v) => updateField("contactPhone", v)}
            phonePlaceholder={t("onboarding.placeholder.phone")}
          />
          <Field label={t("onboarding.field.contactEmail")} value={form.contactEmail ?? ""} onChange={(v) => updateField("contactEmail", v)} placeholder={t("onboarding.placeholder.contactEmail")} type="email" />
          <div className="flex justify-end pt-3">
            <button onClick={() => saveDraft(2)} disabled={saving} className="bg-[var(--primary-black)] text-white text-sm font-medium py-2.5 px-6 rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-50">
              {saving ? t("common.saving") : t("common.next")}
            </button>
          </div>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Card icon={<BriefcaseIcon className="w-5 h-5 text-[var(--gray-500)]" />} title={t("onboarding.section.businessInfo")}>
          <Select label={t("onboarding.field.businessType")} value={form.businessType ?? ""} onChange={(v) => updateField("businessType", v)} options={BUSINESS_TYPES} />
          <Select label={t("onboarding.field.monthlyVolume")} value={form.monthlyVolume ?? ""} onChange={(v) => updateField("monthlyVolume", v)} options={VOLUME_RANGES} />
          <CheckboxGroup label={t("onboarding.field.supportedFiat")} options={FIAT_OPTIONS} value={form.supportedFiat ?? ""} onChange={(v) => updateField("supportedFiat", v)} />
          <CheckboxGroup label={t("onboarding.field.supportedCrypto")} options={CRYPTO_OPTIONS} value={form.supportedCrypto ?? ""} onChange={(v) => updateField("supportedCrypto", v)} />
          <div>
            <label className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">{t("onboarding.field.businessDesc")}</label>
            <textarea value={form.businessDesc ?? ""} onChange={(e) => updateField("businessDesc", e.target.value)} rows={4} placeholder={t("onboarding.placeholder.businessDesc")}
              className="w-full border border-[var(--gray-300)] rounded-lg px-4 py-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
          </div>
          <div className="flex justify-between pt-3">
            <button onClick={() => setStep(1)} className="text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)]">{t("common.previous")}</button>
            <button onClick={() => saveDraft(3)} disabled={saving} className="bg-[var(--primary-black)] text-white text-sm font-medium py-2.5 px-6 rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-50">
              {saving ? t("common.saving") : t("common.next")}
            </button>
          </div>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-8 space-y-6">
          <h2 className="text-lg font-semibold text-[var(--gray-900)]">{t("common.confirmInfo")}</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <Info label={t("onboarding.field.companyName")} value={form.companyName} />
            <Info label={t("onboarding.field.companyAddress")} value={form.companyAddress} />
            <Info label={t("onboarding.field.contact")} value={form.contactName} />
            <Info label={t("onboarding.field.phone")} value={form.contactPhone} />
            <Info label={t("onboarding.field.email")} value={form.contactEmail} />
            <Info label={t("onboarding.field.businessType")} value={BUSINESS_TYPES.find((bt) => bt.value === form.businessType)?.label} />
            <Info label={t("onboarding.field.monthlyVolume")} value={VOLUME_RANGES.find((v) => v.value === form.monthlyVolume)?.label} />
            <Info label={t("onboarding.field.fiat")} value={form.supportedFiat} />
            <Info label={t("onboarding.field.crypto")} value={form.supportedCrypto} />
          </div>
          <div className="text-sm">
            <span className="text-[var(--gray-500)]">{t("onboarding.field.businessDescLabel")}</span>
            <span className="text-[var(--gray-900)]">{form.businessDesc || "-"}</span>
          </div>
          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(2)} className="text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)]">{t("onboarding.editBack")}</button>
            <button onClick={handleSubmit} disabled={saving} className="bg-[var(--primary-black)] text-white text-sm font-medium py-2.5 px-6 rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-50">
              {saving ? t("common.submitting") : t("onboarding.submit")}
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

function PhoneField({ label, value, onChange, phonePlaceholder }: { label: string; value: string; onChange: (v: string) => void; phonePlaceholder: string }) {
  // Parse stored value like "+86-13800138000" into code and number
  const dashIdx = value.indexOf("-");
  const code = dashIdx > 0 ? value.substring(0, dashIdx) : "+86";
  const number = dashIdx > 0 ? value.substring(dashIdx + 1) : value.replace(/^\+\d+/, "");

  const handleCodeChange = (newCode: string) => {
    onChange(number ? `${newCode}-${number}` : newCode);
  };
  const handleNumberChange = (newNumber: string) => {
    onChange(`${code}-${newNumber}`);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">{label}</label>
      <div className="flex gap-2">
        <select
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          className="w-28 border border-[var(--gray-300)] rounded-lg px-3 py-3 text-sm text-[var(--gray-900)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <input
          type="tel"
          value={number}
          onChange={(e) => handleNumberChange(e.target.value)}
          placeholder={phonePlaceholder}
          className="flex-1 border border-[var(--gray-300)] rounded-lg px-4 py-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}

function TimelineItem({ done, active, failed, label }: { done?: boolean; active?: boolean; failed?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
        failed ? "bg-red-500" : done ? "bg-green-500" : active ? "bg-amber-500 animate-pulse" : "bg-[var(--gray-300)]"
      }`} />
      <span className={`text-sm ${
        failed ? "text-red-700 font-medium" : done ? "text-[var(--gray-900)]" : active ? "text-amber-700 font-medium" : "text-[var(--gray-400)]"
      }`}>{label}</span>
    </div>
  );
}
