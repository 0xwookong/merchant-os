"use client";

import { useI18n } from "@/providers/language-provider";
import { Field, Select, CheckboxGroup, TextArea, DateSelect } from "./form-fields";
import type { ApplicationSaveDraftRequest, LicenceInfo } from "@/services/applicationService";

interface Props {
  form: ApplicationSaveDraftRequest;
  update: (field: string, value: string) => void;
  licenceInfo: LicenceInfo | undefined;
  onLicenceInfoChange: (l: LicenceInfo) => void;
}

export default function StepBusiness({ form, update, licenceInfo, onLicenceInfoChange }: Props) {
  const { t } = useI18n();
  const lic = licenceInfo || { regulated: false };

  const BUSINESS_TYPES = [
    { value: "E_COMMERCE", label: t("app.bizType.E_COMMERCE") },
    { value: "GAMING", label: t("app.bizType.GAMING") },
    { value: "SAAS", label: t("app.bizType.SAAS") },
    { value: "CROSS_BORDER", label: t("app.bizType.CROSS_BORDER") },
    { value: "FINANCE", label: t("app.bizType.FINANCE") },
    { value: "OTHER", label: t("app.bizType.OTHER") },
  ];

  const FIAT_OPTIONS = [
    { value: "USD", label: "USD" }, { value: "EUR", label: "EUR" },
    { value: "GBP", label: "GBP" }, { value: "HKD", label: "HKD" },
    { value: "SGD", label: "SGD" }, { value: "JPY", label: "JPY" },
  ];

  const CRYPTO_OPTIONS = [
    { value: "USDT", label: "USDT" }, { value: "USDC", label: "USDC" },
    { value: "BTC", label: "BTC" }, { value: "ETH", label: "ETH" },
  ];

  const USE_CASES = [
    { value: "ONLINE_PAYMENT", label: t("app.useCase.ONLINE_PAYMENT") },
    { value: "FIAT_ONRAMP", label: t("app.useCase.FIAT_ONRAMP") },
    { value: "CROSS_BORDER", label: t("app.useCase.CROSS_BORDER") },
    { value: "OTC", label: t("app.useCase.OTC") },
    { value: "OTHER", label: t("app.useCase.OTHER") },
  ];

  const updateLic = (field: string, value: string | boolean) => {
    onLicenceInfoChange({ ...lic, [field]: value });
  };

  return (
    <div className="space-y-8">
      {/* ─── Section B: Business ─── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.section.business")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label={t("app.field.businessType")} value={form.businessType || ""} onChange={(v) => update("businessType", v)} options={BUSINESS_TYPES} required placeholder={t("app.ph.select")} />
          <Field label={t("app.field.website")} value={form.website || ""} onChange={(v) => update("website", v)} placeholder="https://" />
        </div>

        <TextArea label={t("app.field.businessDesc")} value={form.businessDesc || ""} onChange={(v) => update("businessDesc", v)} required
          placeholder={t("app.ph.businessDesc")} hint={t("app.hint.businessDesc")} rows={3} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextArea label={t("app.field.purposeOfAccount")} value={form.purposeOfAccount || ""} onChange={(v) => update("purposeOfAccount", v)} required
            placeholder={t("app.ph.purposeOfAccount")} hint={t("app.hint.purposeOfAccount")} rows={2} />
          <TextArea label={t("app.field.sourceOfIncome")} value={form.sourceOfIncome || ""} onChange={(v) => update("sourceOfIncome", v)} required
            placeholder={t("app.ph.sourceOfIncome")} hint={t("app.hint.sourceOfIncome")} rows={2} />
        </div>
      </section>

      {/* Transaction estimates */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.section.txEstimates")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t("app.field.estAmountPerTxFrom")} value={form.estAmountPerTxFrom || ""} onChange={(v) => update("estAmountPerTxFrom", v)}
            placeholder="100" hint={t("app.hint.estAmountPerTx")} />
          <Field label={t("app.field.estAmountPerTxTo")} value={form.estAmountPerTxTo || ""} onChange={(v) => update("estAmountPerTxTo", v)}
            placeholder="10000" />
          <Field label={t("app.field.estTxPerYear")} value={form.estTxPerYear || ""} onChange={(v) => update("estTxPerYear", v)}
            placeholder="5000" />
        </div>
      </section>

      {/* Currencies & Use Cases */}
      <section className="space-y-4">
        <CheckboxGroup label={t("app.field.supportedFiat")} value={form.supportedFiat || ""} onChange={(v) => update("supportedFiat", v)} options={FIAT_OPTIONS} required />
        <CheckboxGroup label={t("app.field.supportedCrypto")} value={form.supportedCrypto || ""} onChange={(v) => update("supportedCrypto", v)} options={CRYPTO_OPTIONS} required />
        <CheckboxGroup label={t("app.field.useCases")} value={form.useCases || ""} onChange={(v) => update("useCases", v)} options={USE_CASES} required />
      </section>

      {/* ─── Section C: Licence Info ─── */}
      <section className="space-y-4 pt-6 border-t border-[var(--gray-200)]">
        <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.section.licence")}</h3>
        <p className="text-xs text-[var(--gray-500)]">{t("app.hint.licence")}</p>

        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--gray-700)]">{t("app.field.isRegulated")}</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name="regulated" checked={lic.regulated === true} onChange={() => updateLic("regulated", true)} className="text-[var(--primary-black)] focus:ring-blue-500" />
            <span className="text-sm">{t("common.yes")}</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name="regulated" checked={lic.regulated !== true} onChange={() => updateLic("regulated", false)} className="text-[var(--primary-black)] focus:ring-blue-500" />
            <span className="text-sm">{t("common.no")}</span>
          </label>
        </div>

        {lic.regulated && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[var(--gray-50)] rounded-lg">
            <Field label={t("app.field.jurisdiction")} value={lic.jurisdiction || ""} onChange={(v) => updateLic("jurisdiction", v)} required
              hint={t("app.hint.jurisdiction")} placeholder={t("app.ph.jurisdiction")} />
            <Field label={t("app.field.regulatorName")} value={lic.regulatorName || ""} onChange={(v) => updateLic("regulatorName", v)} required
              placeholder={t("app.ph.regulatorName")} />
            <Field label={t("app.field.licenceType")} value={lic.licenceType || ""} onChange={(v) => updateLic("licenceType", v)} required
              placeholder={t("app.ph.licenceType")} hint={t("app.hint.licenceType")} />
            <Field label={t("app.field.licenceNumber")} value={lic.licenceNumber || ""} onChange={(v) => updateLic("licenceNumber", v)} required />
            <DateSelect label={t("app.field.licenceDate")} value={lic.licenceDate || ""} onChange={(v) => updateLic("licenceDate", v)} required minYear={2000} />
            <DateSelect label={t("app.field.lastAuditDate")} value={lic.lastAuditDate || ""} onChange={(v) => updateLic("lastAuditDate", v)}
              hint={t("app.hint.lastAuditDate")} />
          </div>
        )}
      </section>
    </div>
  );
}
