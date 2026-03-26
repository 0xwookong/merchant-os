"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/providers/language-provider";
import { applicationService } from "@/services/applicationService";
import type { ApplicationSaveDraftRequest, ApplicationResponse, PersonInfo, UboInfo, DirectorInfo, AuthorizedPersonInfo, LicenceInfo, SignatureInfo, StatusHistoryItem } from "@/services/applicationService";
import StepCompany from "./_components/step-company";
import StepLegal from "./_components/step-legal";
import StepBusiness from "./_components/step-business";
import StepDocuments from "./_components/step-documents";
import StepConfirm from "./_components/step-confirm";
import { InfoRow } from "./_components/form-fields";
import { CheckIcon, ExclamationTriangleIcon, ClockIcon, DocumentCheckIcon, MagnifyingGlassIcon, XCircleIcon, InformationCircleIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

const EMPTY_PERSON: PersonInfo = { name: "", nationality: "", idType: "", idNumber: "", placeOfBirth: "", dateOfBirth: "" };
const EMPTY_UBO: UboInfo = { ...EMPTY_PERSON, residentialAddress: "", sharePercentage: 25 };
const EMPTY_AUTH: AuthorizedPersonInfo = { ...EMPTY_PERSON, phone: "", email: "" };

export default function ApplicationPage() {
  const { t } = useI18n();
  const totalSteps = 5;
  const confirmStep = 5;
  const docsStep = 4;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [appData, setAppData] = useState<ApplicationResponse | null>(null);

  // Form state
  const [form, setForm] = useState<ApplicationSaveDraftRequest>({ currentStep: 1 });
  const [legalRep, setLegalRep] = useState<PersonInfo | undefined>();
  const [ubos, setUbos] = useState<UboInfo[]>([{ ...EMPTY_UBO }]);
  const [noUboDecl, setNoUboDecl] = useState(false);
  const [controlDesc, setControlDesc] = useState("");
  const [directors, setDirectors] = useState<DirectorInfo[]>([{ ...EMPTY_PERSON }]);
  const [authorizedPersons, setAuthorizedPersons] = useState<AuthorizedPersonInfo[]>([{ ...EMPTY_AUTH }]);
  const [licenceInfo, setLicenceInfo] = useState<LicenceInfo | undefined>();
  const [uploadedDocs, setUploadedDocs] = useState<import("@/services/applicationService").DocumentResponse[]>([]);
  const [declarations, setDeclarations] = useState({ info: false, sanctions: false, terms: false });
  const EMPTY_SIG: SignatureInfo = { name: "", title: "", email: "", confirmed: false };
  const [signatures, setSignatures] = useState({ director: { ...EMPTY_SIG }, cco: { ...EMPTY_SIG } });
  const errorRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Abort previous load if component remounts (e.g., rapid navigation)
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    loadCurrent(controller.signal);
    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadCurrent(signal: AbortSignal) {
    try {
      const [data, docs] = await Promise.all([
        applicationService.getCurrent(signal),
        applicationService.listDocuments(signal).catch(() => [] as import("@/services/applicationService").DocumentResponse[]),
      ]);
      if (signal.aborted) return; // Don't update state if navigated away
      if (docs.length > 0) setUploadedDocs(docs);
      if (data) {
        setAppData(data);
        setAppStatus(data.status);
        setStep(Math.min(data.currentStep || 1, totalSteps));
        populateForm(data);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
    finally { if (!signal.aborted) setLoading(false); }
  }

  function populateForm(d: ApplicationResponse) {
    setForm({
      currentStep: d.currentStep, counterpartyType: d.counterpartyType || undefined,
      companyName: d.companyName || undefined, companyNameEn: d.companyNameEn || undefined,
      regCountry: d.regCountry || undefined, regNumber: d.regNumber || undefined,
      taxIdNumber: d.taxIdNumber || undefined, businessLicenseNo: d.businessLicenseNo || undefined,
      companyType: d.companyType || undefined, incorporationDate: d.incorporationDate || undefined,
      addressLine1: d.addressLine1 || undefined, addressLine2: d.addressLine2 || undefined,
      city: d.city || undefined, stateProvince: d.stateProvince || undefined,
      postalCode: d.postalCode || undefined, country: d.country || undefined,
      contactName: d.contactName || undefined, contactTitle: d.contactTitle || undefined,
      contactEmail: d.contactEmail || undefined, contactPhone: d.contactPhone || undefined,
      businessType: d.businessType || undefined, website: d.website || undefined,
      purposeOfAccount: d.purposeOfAccount || undefined, sourceOfIncome: d.sourceOfIncome || undefined,
      estAmountPerTxFrom: d.estAmountPerTxFrom || undefined, estAmountPerTxTo: d.estAmountPerTxTo || undefined,
      estTxPerYear: d.estTxPerYear || undefined, monthlyVolume: d.monthlyVolume || undefined,
      monthlyTxCount: d.monthlyTxCount || undefined, supportedFiat: d.supportedFiat || undefined,
      supportedCrypto: d.supportedCrypto || undefined, useCases: d.useCases || undefined,
      businessDesc: d.businessDesc || undefined,
    });
    if (d.legalRep) setLegalRep(d.legalRep);
    if (d.ubos && d.ubos.length > 0) setUbos(d.ubos);
    if (d.directors && d.directors.length > 0) setDirectors(d.directors);
    if (d.authorizedPersons && d.authorizedPersons.length > 0) setAuthorizedPersons(d.authorizedPersons);
    if (d.licenceInfo) setLicenceInfo(d.licenceInfo);
    setNoUboDecl(d.noUboDeclaration || false);
    setControlDesc(d.controlStructureDesc || "");
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function validateCurrentStep(): string | null {
    const blank = (v: string | undefined) => !v || v.trim() === "";
    const badEmail = (v: string | undefined) => !v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (step === 1) {
      if (blank(form.counterpartyType)) return t("app.field.counterpartyType") + t("app.validate.required");
      if (blank(form.companyName)) return t("app.field.companyName") + t("app.validate.required");
      if (blank(form.regCountry)) return t("app.field.regCountry") + t("app.validate.required");
      if (blank(form.regNumber)) return t("app.field.regNumber") + t("app.validate.required");
      if (blank(form.taxIdNumber)) return t("app.field.taxIdNumber") + t("app.validate.required");
      if (blank(form.companyType)) return t("app.field.companyType") + t("app.validate.required");
      if (blank(form.incorporationDate)) return t("app.field.incorporationDate") + t("app.validate.required");
      if (blank(form.addressLine1)) return t("app.field.addressLine1") + t("app.validate.required");
      if (blank(form.city)) return t("app.field.city") + t("app.validate.required");
      if (blank(form.country)) return t("app.field.country") + t("app.validate.required");
      if (blank(form.contactName)) return t("app.field.contactName") + t("app.validate.required");
      if (blank(form.contactEmail)) return t("app.field.contactEmail") + t("app.validate.required");
      if (badEmail(form.contactEmail)) return t("app.validate.invalidEmail");
    }
    if (step === 2) {
      if (!noUboDecl) {
        if (ubos.length === 0) return t("app.validate.uboRequired");
        for (let i = 0; i < ubos.length; i++) {
          const u = ubos[i];
          if (blank(u.name)) return `UBO #${i + 1} — ${t("app.field.legalRepName")}${t("app.validate.required")}`;
          if (blank(u.idType)) return `UBO #${i + 1} — ${t("app.field.idType")}${t("app.validate.required")}`;
          if (blank(u.idNumber)) return `UBO #${i + 1} — ${t("app.field.idNumber")}${t("app.validate.required")}`;
          if (!u.sharePercentage || u.sharePercentage <= 0) return `UBO #${i + 1} — ${t("app.field.sharePercentage")}${t("app.validate.required")}`;
        }
      } else {
        if (blank(controlDesc)) return t("app.field.controlStructure") + t("app.validate.required");
      }
      if (directors.length === 0) return t("app.section.directors") + t("app.validate.required");
      for (let i = 0; i < directors.length; i++) {
        if (blank(directors[i].name)) return `${t("app.director.title")} #${i + 1} — ${t("app.field.legalRepName")}${t("app.validate.required")}`;
        if (blank(directors[i].idType)) return `${t("app.director.title")} #${i + 1} — ${t("app.field.idType")}${t("app.validate.required")}`;
        if (blank(directors[i].idNumber)) return `${t("app.director.title")} #${i + 1} — ${t("app.field.idNumber")}${t("app.validate.required")}`;
      }
      if (authorizedPersons.length === 0) return t("app.section.authorizedPersons") + t("app.validate.required");
      for (let i = 0; i < authorizedPersons.length; i++) {
        const ap = authorizedPersons[i];
        if (blank(ap.name)) return `${t("app.authPerson.title")} #${i + 1} — ${t("app.field.legalRepName")}${t("app.validate.required")}`;
        if (blank(ap.email)) return `${t("app.authPerson.title")} #${i + 1} — ${t("app.field.contactEmail")}${t("app.validate.required")}`;
        if (badEmail(ap.email)) return `${t("app.authPerson.title")} #${i + 1} — ${t("app.validate.invalidEmail")}`;
        if (blank(ap.phone)) return `${t("app.authPerson.title")} #${i + 1} — ${t("app.field.contactPhone")}${t("app.validate.required")}`;
      }
    }
    if (step === 3) {
      if (blank(form.businessType)) return t("app.field.businessType") + t("app.validate.required");
      if (blank(form.businessDesc)) return t("app.field.businessDesc") + t("app.validate.required");
      if (blank(form.purposeOfAccount)) return t("app.field.purposeOfAccount") + t("app.validate.required");
      if (blank(form.sourceOfIncome)) return t("app.field.sourceOfIncome") + t("app.validate.required");
      if (blank(form.supportedFiat)) return t("app.field.supportedFiat") + t("app.validate.required");
      if (blank(form.supportedCrypto)) return t("app.field.supportedCrypto") + t("app.validate.required");
    }
    if (step === docsStep) {
      const hasDoc = (type: string) => uploadedDocs.some((d) => d.docType === type);
      if (!hasDoc("BUSINESS_LICENSE")) return t("app.doc.formation") + t("app.validate.required");
      if (!hasDoc("BUSINESS_PROFILE")) return t("app.doc.businessProfile") + t("app.validate.required");
      if (!hasDoc("ARTICLES")) return t("app.doc.articles") + t("app.validate.required");
      if (!hasDoc("SHARE_STRUCTURE")) return t("app.doc.orgChart") + t("app.validate.required");
      if (!hasDoc("SHAREHOLDER_LIST")) return t("app.doc.shareholderList") + t("app.validate.required");
      if (!hasDoc("DIRECTOR_LIST")) return t("app.doc.directorList") + t("app.validate.required");
      if (!hasDoc("DIRECTOR_ID")) return t("app.doc.directorId") + t("app.validate.required");
      if (!hasDoc("ADDRESS_PROOF")) return t("app.doc.addressProof") + t("app.validate.required");
      // UBO ID for each UBO
      if (!noUboDecl) {
        for (let i = 0; i < ubos.length; i++) {
          if (!uploadedDocs.some((d) => d.docType === "UBO_ID_FRONT" && d.uboIndex === i)) {
            return `${ubos[i].name || "UBO #" + (i + 1)} — ${t("app.doc.uboFront")}${t("app.validate.required")}`;
          }
        }
      }
      // VASP/CASP additional required docs
      if (isVaspCasp) {
        if (!hasDoc("REGULATORY_PERMIT")) return t("app.doc.regulatoryPermit") + t("app.validate.required");
        if (!hasDoc("AML_POLICY")) return t("app.doc.amlPolicy") + t("app.validate.required");
      }
    }
    return null;
  }

  async function saveDraft(nextStep: number) {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      return;
    }

    setSaving(true); setError("");
    try {
      const payload: ApplicationSaveDraftRequest = {
        ...form, currentStep: nextStep,
        legalRep, ubos: noUboDecl ? undefined : ubos,
        noUboDeclaration: noUboDecl, controlStructureDesc: noUboDecl ? controlDesc : undefined,
        directors, authorizedPersons, licenceInfo,
      };
      const result = await applicationService.saveDraft(payload);
      setAppData(result);
      setStep(nextStep);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setSaving(false); }
  }

  async function handleSubmit() {
    setSubmitting(true); setError("");
    try {
      const isResubmit = appStatus === "REJECTED" || appStatus === "NEED_MORE_INFO";
      const req = { infoAccuracyConfirmed: declarations.info, sanctionsDeclared: declarations.sanctions, termsAccepted: declarations.terms, signatures };
      const result = isResubmit ? await applicationService.resubmit(req) : await applicationService.submit(req);
      setAppData(result);
      setAppStatus(result.status);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setSubmitting(false); }
  }

  const isEditable = !appStatus || appStatus === "DRAFT" || appStatus === "REJECTED" || appStatus === "NEED_MORE_INFO";
  const allDeclared = declarations.info && declarations.sanctions && declarations.terms;
  const allSigned = signatures.director.confirmed && signatures.cco.confirmed;
  const canSubmit = allDeclared && allSigned;
  const isVaspCasp = form.counterpartyType === "CASP" || form.counterpartyType === "VASP";

  const STEP_LABELS = [t("app.step.company"), t("app.step.legal"), t("app.step.business"), t("app.step.documents"), t("app.step.confirm")];

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin h-8 w-8 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full" /></div>;
  }

  if (appStatus && !isEditable) {
    return (
      <div className="space-y-8">
        <PageHeader t={t} status={appStatus} />
        <SubmittedView data={appData!} t={t} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader t={t} status={appStatus} />

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

      {error && <div ref={errorRef} className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-8">
        {step === 1 && <StepCompany form={form} update={updateField} />}
        {step === 2 && (
          <StepLegal legalRep={legalRep} ubos={ubos} noUboDeclaration={noUboDecl} controlStructureDesc={controlDesc}
            directors={directors} authorizedPersons={authorizedPersons}
            onLegalRepChange={setLegalRep} onUbosChange={setUbos} onNoUboDeclChange={setNoUboDecl} onControlDescChange={setControlDesc}
            onDirectorsChange={setDirectors} onAuthorizedPersonsChange={setAuthorizedPersons} />
        )}
        {step === 3 && <StepBusiness form={form} update={updateField} licenceInfo={licenceInfo} onLicenceInfoChange={setLicenceInfo} />}
        {step === docsStep && <StepDocuments ubos={noUboDecl ? [] : ubos} isVaspCasp={isVaspCasp} docs={uploadedDocs} onDocsChange={setUploadedDocs} />}
        {step === confirmStep && (
          <StepConfirm form={form} legalRep={legalRep} ubos={ubos} noUboDeclaration={noUboDecl}
            controlStructureDesc={controlDesc} declarations={declarations} onDeclarationsChange={setDeclarations}
            signatures={signatures} onSignaturesChange={setSignatures}
            onEditStep={(s) => setStep(s)} />
        )}

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-[var(--gray-100)]">
          {step > 1 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] transition-colors">
              {t("common.back")}
            </button>
          ) : <div />}

          {step === confirmStep ? (
            <button type="button" onClick={handleSubmit} disabled={submitting || !canSubmit}
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

function PageHeader({ t, status }: { t: (k: string) => string; status: string | null }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-[var(--gray-100)] text-[var(--gray-700)]", SUBMITTED: "bg-blue-50 text-blue-700 border-blue-200",
    UNDER_REVIEW: "bg-amber-50 text-amber-700 border-amber-200", APPROVED: "bg-green-50 text-green-700 border-green-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200", NEED_MORE_INFO: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("app.title")}</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">{t("app.subtitle")}</p>
      </div>
      {status && <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.DRAFT}`}>{t(`app.status.${status}`)}</span>}
    </div>
  );
}

function SubmittedView({ data, t }: { data: ApplicationResponse; t: (k: string) => string }) {
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [timelineOpen, setTimelineOpen] = useState(false);

  useEffect(() => {
    applicationService.getHistory().then(setHistory).catch(() => {});
  }, []);

  const STATUS_META: Record<string, { icon: typeof ClockIcon; color: string; bgColor: string }> = {
    DRAFT: { icon: DocumentCheckIcon, color: "text-[var(--gray-500)]", bgColor: "bg-[var(--gray-100)]" },
    SUBMITTED: { icon: ClockIcon, color: "text-blue-600", bgColor: "bg-blue-100" },
    UNDER_REVIEW: { icon: MagnifyingGlassIcon, color: "text-amber-600", bgColor: "bg-amber-100" },
    NEED_MORE_INFO: { icon: InformationCircleIcon, color: "text-orange-600", bgColor: "bg-orange-100" },
    REJECTED: { icon: XCircleIcon, color: "text-red-600", bgColor: "bg-red-100" },
    APPROVED: { icon: CheckCircleIcon, color: "text-green-600", bgColor: "bg-green-100" },
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Reviewing hint */}
      {(data.status === "SUBMITTED" || data.status === "UNDER_REVIEW") && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">{t("app.timeline.hint")}</p>
        </div>
      )}

      {/* Submitted Info */}
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-[var(--gray-900)]">{t("app.submittedInfo")}</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <InfoRow label={t("app.field.companyName")} value={data.companyName} />
          <InfoRow label={t("app.field.regCountry")} value={data.regCountry} />
          <InfoRow label={t("app.field.regNumber")} value={data.regNumber} />
          <InfoRow label={t("app.field.taxIdNumber")} value={data.taxIdNumber} />
          <InfoRow label={t("app.field.companyType")} value={data.companyType} />
          <InfoRow label={t("app.field.businessType")} value={data.businessType} />
          <InfoRow label={t("app.field.contactName")} value={data.contactName} />
          <InfoRow label={t("app.field.contactEmail")} value={data.contactEmail} />
        </div>
      </div>

      {/* Timeline — collapsible, default collapsed */}
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm">
        <button
          onClick={() => setTimelineOpen(!timelineOpen)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-[var(--gray-50)] transition-colors rounded-xl"
        >
          <div className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-[var(--gray-500)]" />
            <h2 className="text-sm font-semibold text-[var(--gray-900)]">{t("app.timeline.title")}</h2>
            <span className="text-xs text-[var(--gray-400)]">{history.length > 0 ? `${history.length} ${t("app.timeline.events")}` : ""}</span>
          </div>
          <ChevronDownIcon className={`w-5 h-5 text-[var(--gray-400)] transition-transform duration-200 ${timelineOpen ? "rotate-180" : ""}`} />
        </button>

        {timelineOpen && history.length > 0 && (
          <div className="px-6 pb-6">
            <div className="relative overflow-hidden">
              {history.length > 1 && (
                <div className="absolute left-[15px] top-[16px] bottom-0 w-0.5 bg-[var(--gray-200)]" />
              )}

              {history.map((item, i) => {
                const meta = STATUS_META[item.toStatus] || STATUS_META.DRAFT;
                const Icon = meta.icon;
                const isLast = i === history.length - 1;

                return (
                  <div key={item.id} className={`flex gap-4 relative ${isLast ? "" : "mb-6"}`}>
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.bgColor} ${meta.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="pt-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--gray-900)]">
                          {t(`app.status.${item.toStatus}`)}
                        </span>
                        <span className="text-xs text-[var(--gray-400)]">{formatDate(item.createdAt)}</span>
                      </div>
                      {item.remark && (
                        <p className="text-xs text-[var(--gray-500)] mt-1">{item.remark}</p>
                      )}
                      {item.operator && !item.operator.startsWith("system") && (
                        <p className="text-[11px] text-[var(--gray-400)] mt-0.5">
                          {item.operator.startsWith("reviewer:") ? item.operator.replace("reviewer:", "Reviewer: ") : item.operator}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
