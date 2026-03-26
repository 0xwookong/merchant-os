"use client";

import { useEffect, useState } from "react";
import { kybService, type KybSubmitRequest } from "@/services/kybService";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/providers/language-provider";
import { Select } from "@/components/ui/select";
import {
  BuildingOffice2Icon,
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

type Step = 1 | 2 | 3;

export default function KybPage() {
  const { t } = useI18n();

  const COMPANY_TYPES = [
    { value: "LIMITED", label: t("kyb.companyType.LIMITED") },
    { value: "PARTNERSHIP", label: t("kyb.companyType.PARTNERSHIP") },
    { value: "SOLE_PROPRIETORSHIP", label: t("kyb.companyType.SOLE_PROPRIETORSHIP") },
    { value: "OTHER", label: t("kyb.companyType.OTHER") },
  ];

  const ID_TYPES = [
    { value: "ID_CARD", label: t("kyb.idType.ID_CARD") },
    { value: "PASSPORT", label: t("kyb.idType.PASSPORT") },
    { value: "OTHER", label: t("kyb.idType.OTHER") },
  ];

  const [kybStatus, setKybStatus] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [approvedInfo, setApprovedInfo] = useState<{ companyRegCountry?: string; companyRegNumber?: string; companyType?: string; legalRepName?: string }>({});
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
      .then((res) => {
        setKybStatus(res.kybStatus);
        setRejectReason(res.rejectReason);
        if (res.kybStatus === "APPROVED") {
          setApprovedInfo({
            companyRegCountry: res.companyRegCountry,
            companyRegNumber: res.companyRegNumber,
            companyType: res.companyType,
            legalRepName: res.legalRepName,
          });
        }
        // Pre-fill form with previous data when REJECTED (so user can edit and resubmit)
        if (res.kybStatus === "REJECTED" || res.kybStatus === "NEED_MORE_INFO") {
          setForm({
            companyRegCountry: res.companyRegCountry || "",
            companyRegNumber: res.companyRegNumber || "",
            businessLicenseNo: res.businessLicenseNo || "",
            companyType: res.companyType || "LIMITED",
            legalRepName: res.legalRepName || "",
            legalRepNationality: res.legalRepNationality || "",
            legalRepIdType: res.legalRepIdType || "ID_CARD",
            legalRepIdNumber: res.legalRepIdNumber || "",
            legalRepSharePct: res.legalRepSharePct,
          });
        }
      })
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
      // Reload status (sandbox auto-approves, production goes to PENDING)
      const status = await kybService.getStatus();
      setKybStatus(status.kybStatus);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full animate-spin" /></div>;
  }

  // Status display for non-editable states
  if (kybStatus === "APPROVED") {
    return (
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("kyb.title")}</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">{t("kyb.subtitle")}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800 font-medium">{t("kyb.approved")}</p>
        </div>
        {approvedInfo.companyRegCountry && (
          <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-8">
            <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-5">{t("kyb.info.title")}</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div><dt className="text-[var(--gray-500)]">{t("kyb.info.registrationCountry")}</dt><dd className="font-medium text-[var(--gray-900)] mt-0.5">{approvedInfo.companyRegCountry}</dd></div>
              <div><dt className="text-[var(--gray-500)]">{t("kyb.info.registrationNumber")}</dt><dd className="font-medium text-[var(--gray-900)] mt-0.5">{approvedInfo.companyRegNumber}</dd></div>
              <div><dt className="text-[var(--gray-500)]">{t("kyb.info.companyType")}</dt><dd className="font-medium text-[var(--gray-900)] mt-0.5">{approvedInfo.companyType}</dd></div>
              <div><dt className="text-[var(--gray-500)]">{t("kyb.info.legalRep")}</dt><dd className="font-medium text-[var(--gray-900)] mt-0.5">{approvedInfo.legalRepName}</dd></div>
            </div>
          </div>
        )}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <span className="text-blue-600 text-sm">{t("kyb.updateContact")}<span className="font-medium">support@osl-pay.com</span></span>
        </div>
      </div>
    );
  }
  if (kybStatus === "PENDING") {
    return <StatusCard icon={<ClockIcon className="w-8 h-8 text-[var(--warning)]" />} title={t("kyb.pending.title")} desc={t("kyb.pending.desc")} color="warning" />;
  }

  // Form for NOT_STARTED, REJECTED, NEED_MORE_INFO
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("kyb.title")}</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">{t("kyb.formSubtitle")}</p>
      </div>

      {kybStatus === "NEED_MORE_INFO" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <ClockIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">{t("kyb.needMoreInfo")}</p>
            <p className="text-sm text-[var(--gray-600)] mt-1">{rejectReason || t("kyb.needMoreInfoDesc")}</p>
          </div>
        </div>
      )}

      {kybStatus === "REJECTED" && (
        <div className="bg-[var(--error-soft)] border border-red-200 rounded-lg p-4 flex gap-3">
          <XCircleIcon className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--error)]">{t("kyb.rejectedTitle")}</p>
            <p className="text-sm text-[var(--gray-600)] mt-1">{rejectReason || t("kyb.rejectedDesc")}</p>
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
              {s === 1 ? t("kyb.step.company") : s === 2 ? t("kyb.step.legalRep") : t("kyb.step.confirm")}
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
            <h2 className="text-lg font-semibold text-[var(--gray-900)]">{t("kyb.section.companyInfo")}</h2>
          </div>
          <FormField label={t("kyb.field.registrationCountry")} value={form.companyRegCountry} onChange={(v) => updateField("companyRegCountry", v)} placeholder={t("kyb.placeholder.registrationCountry")} />
          <FormField label={t("kyb.field.registrationNumber")} value={form.companyRegNumber} onChange={(v) => updateField("companyRegNumber", v)} placeholder={t("kyb.placeholder.registrationNumber")} />
          <FormField label={t("kyb.field.businessLicense")} value={form.businessLicenseNo} onChange={(v) => updateField("businessLicenseNo", v)} placeholder={t("kyb.placeholder.businessLicense")} />
          <SelectField label={t("kyb.field.companyType")} value={form.companyType} onChange={(v) => updateField("companyType", v)} options={COMPANY_TYPES} />
          <div className="flex justify-end pt-2">
            <button onClick={() => setStep(2)} className="bg-[var(--primary-black)] text-white text-sm font-medium py-2.5 px-5 rounded-lg hover:bg-[#1a1a1a] transition-colors">
              {t("common.next")}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Legal rep info */}
      {step === 2 && (
        <div className="bg-white rounded-lg border border-[var(--gray-200)] shadow-sm p-8 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <UserIcon className="w-5 h-5 text-[var(--gray-500)]" />
            <h2 className="text-lg font-semibold text-[var(--gray-900)]">{t("kyb.section.legalRepInfo")}</h2>
          </div>
          <FormField label={t("kyb.field.legalRepName")} value={form.legalRepName} onChange={(v) => updateField("legalRepName", v)} placeholder={t("kyb.placeholder.legalRepName")} />
          <FormField label={t("kyb.field.nationality")} value={form.legalRepNationality} onChange={(v) => updateField("legalRepNationality", v)} placeholder={t("kyb.placeholder.nationality")} />
          <SelectField label={t("kyb.field.idType")} value={form.legalRepIdType} onChange={(v) => updateField("legalRepIdType", v)} options={ID_TYPES} />
          <FormField label={t("kyb.field.idNumber")} value={form.legalRepIdNumber} onChange={(v) => updateField("legalRepIdNumber", v)} placeholder={t("kyb.placeholder.idNumber")} />
          <FormField label={t("kyb.field.sharePercentage")} value={form.legalRepSharePct?.toString() ?? ""} onChange={(v) => updateField("legalRepSharePct", v ? Number(v) : undefined)} placeholder={t("kyb.placeholder.sharePercentage")} type="number" />
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(1)} className="text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] transition-colors">
              {t("common.previous")}
            </button>
            <button onClick={() => setStep(3)} className="bg-[var(--primary-black)] text-white text-sm font-medium py-2.5 px-5 rounded-lg hover:bg-[#1a1a1a] transition-colors">
              {t("common.next")}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm & submit */}
      {step === 3 && (
        <div className="bg-white rounded-lg border border-[var(--gray-200)] shadow-sm p-8 space-y-5">
          <h2 className="text-lg font-semibold text-[var(--gray-900)]">{t("common.confirmInfo")}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label={t("kyb.field.registrationCountry")} value={form.companyRegCountry} />
            <InfoRow label={t("kyb.field.registrationNumber")} value={form.companyRegNumber} />
            <InfoRow label={t("kyb.field.businessLicense")} value={form.businessLicenseNo} />
            <InfoRow label={t("kyb.field.companyType")} value={COMPANY_TYPES.find((ct) => ct.value === form.companyType)?.label ?? form.companyType} />
            <InfoRow label={t("kyb.field.legalRepName")} value={form.legalRepName} />
            <InfoRow label={t("kyb.field.nationality")} value={form.legalRepNationality} />
            <InfoRow label={t("kyb.field.idType")} value={ID_TYPES.find((it) => it.value === form.legalRepIdType)?.label ?? form.legalRepIdType} />
            <InfoRow label={t("kyb.field.idNumber")} value={form.legalRepIdNumber} />
            <InfoRow label={t("kyb.field.sharePercentage")} value={form.legalRepSharePct ? `${form.legalRepSharePct}%` : "-"} />
          </div>
          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(2)} className="text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] transition-colors">
              {t("common.previous")}
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="bg-[var(--primary-black)] text-white text-sm font-medium py-2.5 px-5 rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? t("common.submitting") : t("kyb.submit")}
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
      <Select value={value} onChange={(e) => onChange(e.target.value)} className="w-full py-3 text-[var(--gray-900)]">
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </Select>
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
