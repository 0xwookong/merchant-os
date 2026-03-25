"use client";

import { useI18n } from "@/providers/language-provider";
import { Field, Select, CheckboxGroup, TextArea } from "./form-fields";
import type { ApplicationSaveDraftRequest } from "@/services/applicationService";

interface Props {
  form: ApplicationSaveDraftRequest;
  update: (field: string, value: string) => void;
}

export default function StepBusiness({ form, update }: Props) {
  const { t } = useI18n();

  const BUSINESS_TYPES = [
    { value: "E_COMMERCE", label: t("app.bizType.E_COMMERCE") },
    { value: "GAMING", label: t("app.bizType.GAMING") },
    { value: "SAAS", label: t("app.bizType.SAAS") },
    { value: "CROSS_BORDER", label: t("app.bizType.CROSS_BORDER") },
    { value: "FINANCE", label: t("app.bizType.FINANCE") },
    { value: "OTHER", label: t("app.bizType.OTHER") },
  ];

  const VOLUME_RANGES = [
    { value: "UNDER_10K", label: "< $10K" },
    { value: "10K_100K", label: "$10K – $100K" },
    { value: "100K_1M", label: "$100K – $1M" },
    { value: "OVER_1M", label: "> $1M" },
  ];

  const TX_COUNT_RANGES = [
    { value: "UNDER_100", label: "< 100" },
    { value: "100_1K", label: "100 – 1,000" },
    { value: "1K_10K", label: "1,000 – 10,000" },
    { value: "OVER_10K", label: "> 10,000" },
  ];

  const FIAT_OPTIONS = [
    { value: "USD", label: "USD" },
    { value: "EUR", label: "EUR" },
    { value: "GBP", label: "GBP" },
    { value: "HKD", label: "HKD" },
    { value: "SGD", label: "SGD" },
    { value: "JPY", label: "JPY" },
  ];

  const CRYPTO_OPTIONS = [
    { value: "USDT", label: "USDT" },
    { value: "USDC", label: "USDC" },
    { value: "BTC", label: "BTC" },
    { value: "ETH", label: "ETH" },
  ];

  const USE_CASES = [
    { value: "ONLINE_PAYMENT", label: t("app.useCase.ONLINE_PAYMENT") },
    { value: "FIAT_ONRAMP", label: t("app.useCase.FIAT_ONRAMP") },
    { value: "CROSS_BORDER", label: t("app.useCase.CROSS_BORDER") },
    { value: "OTC", label: t("app.useCase.OTC") },
    { value: "OTHER", label: t("app.useCase.OTHER") },
  ];

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.section.business")}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label={t("app.field.businessType")} value={form.businessType || ""} onChange={(v) => update("businessType", v)} options={BUSINESS_TYPES} required placeholder={t("app.ph.select")} />
          <Field label={t("app.field.website")} value={form.website || ""} onChange={(v) => update("website", v)} placeholder="https://" />
          <Select label={t("app.field.monthlyVolume")} value={form.monthlyVolume || ""} onChange={(v) => update("monthlyVolume", v)} options={VOLUME_RANGES} required placeholder={t("app.ph.select")} />
          <Select label={t("app.field.monthlyTxCount")} value={form.monthlyTxCount || ""} onChange={(v) => update("monthlyTxCount", v)} options={TX_COUNT_RANGES} required placeholder={t("app.ph.select")} />
        </div>
      </section>

      <section className="space-y-4">
        <CheckboxGroup label={t("app.field.supportedFiat")} value={form.supportedFiat || ""} onChange={(v) => update("supportedFiat", v)} options={FIAT_OPTIONS} required />
        <CheckboxGroup label={t("app.field.supportedCrypto")} value={form.supportedCrypto || ""} onChange={(v) => update("supportedCrypto", v)} options={CRYPTO_OPTIONS} required />
        <CheckboxGroup label={t("app.field.useCases")} value={form.useCases || ""} onChange={(v) => update("useCases", v)} options={USE_CASES} required />
      </section>

      <section className="space-y-4">
        <TextArea label={t("app.field.businessDesc")} value={form.businessDesc || ""} onChange={(v) => update("businessDesc", v)} required placeholder={t("app.ph.businessDesc")} rows={4} />
      </section>
    </div>
  );
}
