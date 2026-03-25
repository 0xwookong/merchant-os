"use client";

import { useI18n } from "@/providers/language-provider";
import { Field, Select, PhoneField } from "./form-fields";
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
  ];

  const COMPANY_TYPES = [
    { value: "LIMITED", label: t("app.companyType.LIMITED") },
    { value: "PARTNERSHIP", label: t("app.companyType.PARTNERSHIP") },
    { value: "SOLE_PROPRIETORSHIP", label: t("app.companyType.SOLE_PROPRIETORSHIP") },
    { value: "OTHER", label: t("app.companyType.OTHER") },
  ];

  return (
    <div className="space-y-6">
      {/* Company Registration */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.section.registration")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t("app.field.companyName")} value={form.companyName || ""} onChange={(v) => update("companyName", v)} required placeholder={t("app.ph.companyName")} />
          <Field label={t("app.field.companyNameEn")} value={form.companyNameEn || ""} onChange={(v) => update("companyNameEn", v)} placeholder={t("app.ph.companyNameEn")} />
          <Select label={t("app.field.regCountry")} value={form.regCountry || ""} onChange={(v) => { update("regCountry", v); update("country", v); }} options={COUNTRIES} required placeholder={t("app.ph.select")} />
          <Field label={t("app.field.regNumber")} value={form.regNumber || ""} onChange={(v) => update("regNumber", v)} required placeholder={t("app.ph.regNumber")} />
          <Field label={t("app.field.businessLicenseNo")} value={form.businessLicenseNo || ""} onChange={(v) => update("businessLicenseNo", v)} placeholder={t("app.ph.businessLicenseNo")} />
          <Select label={t("app.field.companyType")} value={form.companyType || ""} onChange={(v) => update("companyType", v)} options={COMPANY_TYPES} required placeholder={t("app.ph.select")} />
          <Field label={t("app.field.incorporationDate")} value={form.incorporationDate || ""} onChange={(v) => update("incorporationDate", v)} required type="date" />
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
          <Field label={t("app.field.postalCode")} value={form.postalCode || ""} onChange={(v) => update("postalCode", v)} required />
          <Select label={t("app.field.country")} value={form.country || ""} onChange={(v) => update("country", v)} options={COUNTRIES} required placeholder={t("app.ph.select")} />
        </div>
      </section>

      {/* Primary Contact */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.section.contact")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t("app.field.contactName")} value={form.contactName || ""} onChange={(v) => update("contactName", v)} required placeholder={t("app.ph.contactName")} />
          <Field label={t("app.field.contactTitle")} value={form.contactTitle || ""} onChange={(v) => update("contactTitle", v)} required placeholder={t("app.ph.contactTitle")} />
          <Field label={t("app.field.contactEmail")} value={form.contactEmail || ""} onChange={(v) => update("contactEmail", v)} required type="email" placeholder={t("app.ph.contactEmail")} />
          <PhoneField label={t("app.field.contactPhone")} value={form.contactPhone || ""} onChange={(v) => update("contactPhone", v)} required />
        </div>
      </section>
    </div>
  );
}
