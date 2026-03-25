"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/providers/language-provider";
import { getEnvironment } from "@/lib/environment";
import { applicationService } from "@/services/applicationService";
import type { ApplicationSaveDraftRequest, ApplicationResponse, LegalRepInfo, UboInfo } from "@/services/applicationService";
import StepCompany from "./_components/step-company";
import StepLegal from "./_components/step-legal";
import StepBusiness from "./_components/step-business";
import StepDocuments from "./_components/step-documents";
import StepConfirm from "./_components/step-confirm";
import { InfoRow } from "./_components/form-fields";
import { CheckIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function ApplicationPage() {
  const { t } = useI18n();
  const isSandbox = getEnvironment() === "sandbox";
  // Production: 5 steps (1-company, 2-legal, 3-business, 4-docs, 5-confirm)
  // Sandbox: 4 steps (1-company, 2-legal, 3-business, 4-confirm, skip docs)
  const totalSteps = isSandbox ? 4 : 5;
  const confirmStep = totalSteps;
  const docsStep = isSandbox ? -1 : 4; // -1 = skip

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [appData, setAppData] = useState<ApplicationResponse | null>(null);

  // Form state
  const [form, setForm] = useState<ApplicationSaveDraftRequest>({ currentStep: 1 });
  const [legalRep, setLegalRep] = useState<LegalRepInfo | undefined>();
  const [ubos, setUbos] = useState<UboInfo[]>([{ name: "", nationality: "", idType: "", idNumber: "", dateOfBirth: "", sharePercentage: 25 }]);
  const [noUboDecl, setNoUboDecl] = useState(false);
  const [controlDesc, setControlDesc] = useState("");
  const [declarations, setDeclarations] = useState({ info: false, sanctions: false, terms: false });

  useEffect(() => { loadCurrent(); }, []);

  async function loadCurrent() {
    try {
      const data = await applicationService.getCurrent();
      if (data) {
        setAppData(data);
        setAppStatus(data.status);
        const savedStep = data.currentStep || 1;
        setStep(Math.min(savedStep, totalSteps));
        populateForm(data);
      }
    } catch { /* fresh start */ }
    finally { setLoading(false); }
  }

  function populateForm(data: ApplicationResponse) {
    setForm({
      currentStep: data.currentStep,
      companyName: data.companyName || undefined, companyNameEn: data.companyNameEn || undefined,
      regCountry: data.regCountry || undefined, regNumber: data.regNumber || undefined,
      businessLicenseNo: data.businessLicenseNo || undefined, companyType: data.companyType || undefined,
      incorporationDate: data.incorporationDate || undefined,
      addressLine1: data.addressLine1 || undefined, addressLine2: data.addressLine2 || undefined,
      city: data.city || undefined, stateProvince: data.stateProvince || undefined,
      postalCode: data.postalCode || undefined, country: data.country || undefined,
      contactName: data.contactName || undefined, contactTitle: data.contactTitle || undefined,
      contactEmail: data.contactEmail || undefined, contactPhone: data.contactPhone || undefined,
      businessType: data.businessType || undefined, website: data.website || undefined,
      monthlyVolume: data.monthlyVolume || undefined, monthlyTxCount: data.monthlyTxCount || undefined,
      supportedFiat: data.supportedFiat || undefined, supportedCrypto: data.supportedCrypto || undefined,
      useCases: data.useCases || undefined, businessDesc: data.businessDesc || undefined,
    });
    if (data.legalRep) setLegalRep(data.legalRep);
    if (data.ubos && data.ubos.length > 0) setUbos(data.ubos);
    setNoUboDecl(data.noUboDeclaration || false);
    setControlDesc(data.controlStructureDesc || "");
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function validateCurrentStep(): string | null {
    const blank = (v: string | undefined) => !v || v.trim() === "";

    if (step === 1) {
      if (blank(form.companyName)) return t("app.field.companyName") + t("app.validate.required");
      if (blank(form.regCountry)) return t("app.field.regCountry") + t("app.validate.required");
      if (blank(form.regNumber)) return t("app.field.regNumber") + t("app.validate.required");
      if (blank(form.companyType)) return t("app.field.companyType") + t("app.validate.required");
      if (blank(form.incorporationDate)) return t("app.field.incorporationDate") + t("app.validate.required");
      if (blank(form.addressLine1)) return t("app.field.addressLine1") + t("app.validate.required");
      if (blank(form.city)) return t("app.field.city") + t("app.validate.required");
      if (blank(form.postalCode)) return t("app.field.postalCode") + t("app.validate.required");
      if (blank(form.country)) return t("app.field.country") + t("app.validate.required");
      if (blank(form.contactName)) return t("app.field.contactName") + t("app.validate.required");
      if (blank(form.contactTitle)) return t("app.field.contactTitle") + t("app.validate.required");
      if (blank(form.contactEmail)) return t("app.field.contactEmail") + t("app.validate.required");
      if (blank(form.contactPhone)) return t("app.field.contactPhone") + t("app.validate.required");
    }

    if (step === 2) {
      if (!legalRep || blank(legalRep.name)) return t("app.field.legalRepName") + t("app.validate.required");
      if (blank(legalRep?.nationality)) return t("app.field.nationality") + t("app.validate.required");
      if (blank(legalRep?.idType)) return t("app.field.idType") + t("app.validate.required");
      if (blank(legalRep?.idNumber)) return t("app.field.idNumber") + t("app.validate.required");
      if (blank(legalRep?.dateOfBirth)) return t("app.field.dateOfBirth") + t("app.validate.required");
      if (!noUboDecl) {
        if (ubos.length === 0) return t("app.validate.uboRequired");
        for (let i = 0; i < ubos.length; i++) {
          if (blank(ubos[i].name)) return `UBO #${i + 1} — ${t("app.field.legalRepName")}${t("app.validate.required")}`;
          if (!ubos[i].sharePercentage || ubos[i].sharePercentage <= 0) return `UBO #${i + 1} — ${t("app.field.sharePercentage")}${t("app.validate.required")}`;
        }
      } else if (blank(controlDesc)) {
        return t("app.field.controlStructure") + t("app.validate.required");
      }
    }

    if (step === 3) {
      if (blank(form.businessType)) return t("app.field.businessType") + t("app.validate.required");
      if (blank(form.monthlyVolume)) return t("app.field.monthlyVolume") + t("app.validate.required");
      if (blank(form.monthlyTxCount)) return t("app.field.monthlyTxCount") + t("app.validate.required");
      if (blank(form.supportedFiat)) return t("app.field.supportedFiat") + t("app.validate.required");
      if (blank(form.supportedCrypto)) return t("app.field.supportedCrypto") + t("app.validate.required");
      if (blank(form.useCases)) return t("app.field.useCases") + t("app.validate.required");
      if (blank(form.businessDesc)) return t("app.field.businessDesc") + t("app.validate.required");
    }

    return null;
  }

  async function saveDraft(nextStep: number) {
    // Validate current step before saving
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload: ApplicationSaveDraftRequest = {
        ...form, currentStep: nextStep,
        legalRep, ubos: noUboDecl ? undefined : ubos,
        noUboDeclaration: noUboDecl, controlStructureDesc: noUboDecl ? controlDesc : undefined,
      };
      const result = await applicationService.saveDraft(payload);
      setAppData(result);
      setStep(nextStep);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const isResubmit = appStatus === "REJECTED" || appStatus === "NEED_MORE_INFO";
      const req = { infoAccuracyConfirmed: declarations.info, sanctionsDeclared: declarations.sanctions, termsAccepted: declarations.terms };
      const result = isResubmit
        ? await applicationService.resubmit(req)
        : await applicationService.submit(req);
      setAppData(result);
      setAppStatus(result.status);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setSubmitting(false); }
  }

  const isEditable = !appStatus || appStatus === "DRAFT" || appStatus === "REJECTED" || appStatus === "NEED_MORE_INFO";
  const allDeclared = declarations.info && declarations.sanctions && declarations.terms;

  const STEP_LABELS = isSandbox
    ? [t("app.step.company"), t("app.step.legal"), t("app.step.business"), t("app.step.confirm")]
    : [t("app.step.company"), t("app.step.legal"), t("app.step.business"), t("app.step.documents"), t("app.step.confirm")];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full" />
      </div>
    );
  }

  // Non-editable submitted view
  if (appStatus && !isEditable) {
    return (
      <div className="max-w-3xl space-y-8">
        <PageHeader t={t} status={appStatus} />
        <SubmittedView data={appData!} t={t} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader t={t} status={appStatus} />

      {/* Reject banner */}
      {appStatus === "REJECTED" && appData?.rejectReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">{t("app.rejected.title")}</p>
            <p className="text-sm text-red-700 mt-1">{appData.rejectReason}</p>
          </div>
        </div>
      )}
      {appStatus === "NEED_MORE_INFO" && appData?.needInfoDetails && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-800">{t("app.needInfo.title")}</p>
            <ul className="text-sm text-orange-700 mt-1 list-disc list-inside">
              {appData.needInfoDetails.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold transition-all ${
              step > s ? "bg-[var(--primary-black)] text-[var(--neon-green)]" :
              step === s ? "bg-[var(--primary-black)] text-white" :
              "bg-[var(--gray-100)] text-[var(--gray-500)]"
            }`}>
              {step > s ? <CheckIcon className="h-3.5 w-3.5" /> : s}
            </div>
            <span className={`text-xs ${step === s ? "font-semibold text-[var(--gray-900)]" : "text-[var(--gray-500)]"} hidden sm:inline`}>
              {STEP_LABELS[i]}
            </span>
            {i < totalSteps - 1 && <div className="w-6 h-px bg-[var(--gray-200)]" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Form card */}
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-8">
        {step === 1 && <StepCompany form={form} update={updateField} />}
        {step === 2 && (
          <StepLegal legalRep={legalRep} ubos={ubos} noUboDeclaration={noUboDecl} controlStructureDesc={controlDesc}
            onLegalRepChange={setLegalRep} onUbosChange={setUbos} onNoUboDeclChange={setNoUboDecl} onControlDescChange={setControlDesc} />
        )}
        {step === 3 && <StepBusiness form={form} update={updateField} />}
        {step === docsStep && <StepDocuments ubos={noUboDecl ? [] : ubos} />}
        {step === confirmStep && (
          <StepConfirm form={form} legalRep={legalRep} ubos={ubos} noUboDeclaration={noUboDecl}
            controlStructureDesc={controlDesc} declarations={declarations} onDeclarationsChange={setDeclarations}
            onEditStep={(s) => setStep(s)} />
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-[var(--gray-100)]">
          {step > 1 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] transition-colors">
              {t("common.back")}
            </button>
          ) : <div />}

          {step === confirmStep ? (
            <button type="button" onClick={handleSubmit} disabled={submitting || !allDeclared}
              className="bg-[var(--primary-black)] text-white text-sm font-medium py-2.5 px-6 rounded-lg hover:bg-[#1a1a1a] disabled:opacity-50 transition-all">
              {submitting ? t("common.loading") : t("app.submit")}
            </button>
          ) : (
            <button type="button" onClick={() => saveDraft(step + 1)} disabled={saving}
              className="bg-[var(--primary-black)] text-white text-sm font-medium py-2.5 px-6 rounded-lg hover:bg-[#1a1a1a] disabled:opacity-50 transition-all">
              {saving ? t("common.loading") : t("app.next")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function PageHeader({ t, status }: { t: (k: string) => string; status: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("app.title")}</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">{t("app.subtitle")}</p>
      </div>
      {status && <StatusBadge status={status} t={t} />}
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-[var(--gray-100)] text-[var(--gray-700)]",
    SUBMITTED: "bg-blue-50 text-blue-700 border-blue-200",
    UNDER_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
    APPROVED: "bg-green-50 text-green-700 border-green-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    NEED_MORE_INFO: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.DRAFT}`}>
      {t(`app.status.${status}`)}
    </span>
  );
}

function SubmittedView({ data, t }: { data: ApplicationResponse; t: (k: string) => string }) {
  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--gray-900)]">{t("app.timeline.title")}</h2>
        <div className="space-y-3">
          <TimelineItem done label={t("app.timeline.submitted")} date={data.submittedAt} />
          <TimelineItem active={data.status === "SUBMITTED" || data.status === "UNDER_REVIEW"} done={data.status === "APPROVED"} label={t("app.timeline.reviewing")} />
          <TimelineItem done={data.status === "APPROVED"} label={data.status === "APPROVED" ? t("app.timeline.approved") : t("app.timeline.result")} />
        </div>

        {/* Sandbox hint */}
        {data.status === "SUBMITTED" || data.status === "UNDER_REVIEW" ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-sm text-blue-700">{t("app.timeline.hint")}</p>
          </div>
        ) : null}
      </div>

      {/* Info preview */}
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-[var(--gray-900)]">{t("app.submittedInfo")}</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <InfoRow label={t("app.field.companyName")} value={data.companyName} />
          <InfoRow label={t("app.field.regCountry")} value={data.regCountry} />
          <InfoRow label={t("app.field.regNumber")} value={data.regNumber} />
          <InfoRow label={t("app.field.companyType")} value={data.companyType} />
          <InfoRow label={t("app.field.contactName")} value={data.contactName} />
          <InfoRow label={t("app.field.contactEmail")} value={data.contactEmail} />
          <InfoRow label={t("app.field.businessType")} value={data.businessType} />
          <InfoRow label={t("app.field.monthlyVolume")} value={data.monthlyVolume} />
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ done, active, label, date }: { done?: boolean; active?: boolean; label: string; date?: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full shrink-0 ${
        done ? "bg-green-500" : active ? "bg-amber-400 animate-pulse" : "bg-[var(--gray-200)]"
      }`} />
      <span className={`text-sm ${done || active ? "text-[var(--gray-900)]" : "text-[var(--gray-400)]"}`}>{label}</span>
      {date && <span className="text-xs text-[var(--gray-400)] ml-auto">{date.slice(0, 10)}</span>}
    </div>
  );
}
