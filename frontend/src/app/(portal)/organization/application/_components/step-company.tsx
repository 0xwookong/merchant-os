"use client";

import { useI18n } from "@/providers/language-provider";
import { Field, Select, PhoneField, DateSelect } from "./form-fields";
import type { ApplicationSaveDraftRequest } from "@/services/applicationService";

interface Props {
  form: ApplicationSaveDraftRequest;
  update: (field: string, value: string) => void;
}

export default function StepCompany({ form, update }: Props) {
  const { t } = useI18n();

  const COUNTRIES = [
    { value: "CN", label: t("app.country.CN") },
    { value: "HK", label: t("app.country.HK") },
    { value: "TW", label: t("app.country.TW") },
    { value: "MO", label: t("app.country.MO") },
    { value: "US", label: t("app.country.US") },
    { value: "GB", label: t("app.country.GB") },
    { value: "SG", label: t("app.country.SG") },
    { value: "JP", label: t("app.country.JP") },
    { value: "KR", label: t("app.country.KR") },
    { value: "AU", label: t("app.country.AU") },
    { value: "CA", label: t("app.country.CA") },
    { value: "DE", label: t("app.country.DE") },
    { value: "IT", label: t("app.country.IT") },
    { value: "FR", label: t("app.country.FR") },
  ];

  const COMPANY_TYPES = [
    { value: "LIMITED", label: t("app.companyType.LIMITED") },
    { value: "PARTNERSHIP", label: t("app.companyType.PARTNERSHIP") },
    { value: "SOLE_PROPRIETORSHIP", label: t("app.companyType.SOLE_PROPRIETORSHIP") },
    { value: "OTHER", label: t("app.companyType.OTHER") },
  ];

  const COUNTERPARTY_TYPES = [
    { value: "MICAR_LICENSED", label: t("app.counterpartyType.MICAR") },
    { value: "CASP", label: t("app.counterpartyType.CASP") },
    { value: "VASP", label: t("app.counterpartyType.VASP") },
    { value: "REFERRAL", label: t("app.counterpartyType.REFERRAL") },
  ];

  return (
    <div className="space-y-6">
      {/* Counterparty Type */}
      <section className="space-y-4">
        <Select label={t("app.field.counterpartyType")} value={form.counterpartyType || ""} onChange={(v) => update("counterpartyType", v)}
          options={COUNTERPARTY_TYPES} required placeholder={t("app.ph.select")}
          hint={t("app.hint.counterpartyType")} />
      </section>

      {/* Company Registration */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.section.registration")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t("app.field.companyName")} value={form.companyName || ""} onChange={(v) => update("companyName", v)} required
            placeholder={t("app.ph.companyName")} hint={t("app.hint.companyName")} />
          <Field label={t("app.field.companyNameEn")} value={form.companyNameEn || ""} onChange={(v) => update("companyNameEn", v)}
            placeholder={t("app.ph.companyNameEn")} />
          <Select label={t("app.field.regCountry")} value={form.regCountry || ""} onChange={(v) => { update("regCountry", v); update("country", v); }}
            options={COUNTRIES} required placeholder={t("app.ph.select")} />
          <Field label={t("app.field.regNumber")} value={form.regNumber || ""} onChange={(v) => update("regNumber", v)} required
            placeholder={t("app.ph.regNumber")} hint={t("app.hint.regNumber")} />
          <Field label={t("app.field.taxIdNumber")} value={form.taxIdNumber || ""} onChange={(v) => update("taxIdNumber", v)} required
            placeholder={t("app.ph.taxIdNumber")} hint={t("app.hint.taxIdNumber")} />
          <Select label={t("app.field.companyType")} value={form.companyType || ""} onChange={(v) => update("companyType", v)}
            options={COMPANY_TYPES} required placeholder={t("app.ph.select")} />
          <DateSelect label={t("app.field.incorporationDate")} value={form.incorporationDate || ""} onChange={(v) => update("incorporationDate", v)} required minYear={1950} />
        </div>
      </section>

      {/* Registered Address */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.section.address")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Field label={t("app.field.addressLine1")} value={form.addressLine1 || ""} onChange={(v) => update("addressLine1", v)} required placeholder={t("app.ph.addressLine1")} />
          </div>
          <div className="md:col-span-2">
            <Field label={t("app.field.addressLine2")} value={form.addressLine2 || ""} onChange={(v) => update("addressLine2", v)} placeholder={t("app.ph.addressLine2")} />
          </div>
          <Field label={t("app.field.city")} value={form.city || ""} onChange={(v) => update("city", v)} required />
          <Field label={t("app.field.stateProvince")} value={form.stateProvince || ""} onChange={(v) => update("stateProvince", v)} />
          <Field label={t("app.field.postalCode")} value={form.postalCode || ""} onChange={(v) => update("postalCode", v)} />
          <Select label={t("app.field.country")} value={form.country || ""} onChange={(v) => update("country", v)} options={COUNTRIES} required placeholder={t("app.ph.select")} />
        </div>
      </section>

      {/* Primary Contact */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.section.contact")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t("app.field.contactName")} value={form.contactName || ""} onChange={(v) => update("contactName", v)} required placeholder={t("app.ph.contactName")} />
          <Field label={t("app.field.contactTitle")} value={form.contactTitle || ""} onChange={(v) => update("contactTitle", v)} placeholder={t("app.ph.contactTitle")} />
          <Field label={t("app.field.contactEmail")} value={form.contactEmail || ""} onChange={(v) => update("contactEmail", v)} required type="email" placeholder={t("app.ph.contactEmail")} />
          <PhoneField label={t("app.field.contactPhone")} value={form.contactPhone || ""} onChange={(v) => update("contactPhone", v)} />
        </div>
      </section>
    </div>
  );
}
