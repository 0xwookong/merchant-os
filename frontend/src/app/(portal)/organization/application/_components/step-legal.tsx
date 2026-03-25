"use client";

import { useI18n } from "@/providers/language-provider";
import { Field, Select } from "./form-fields";
import type { LegalRepInfo, UboInfo } from "@/services/applicationService";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

interface Props {
  legalRep: LegalRepInfo | undefined;
  ubos: UboInfo[];
  noUboDeclaration: boolean;
  controlStructureDesc: string;
  onLegalRepChange: (rep: LegalRepInfo) => void;
  onUbosChange: (ubos: UboInfo[]) => void;
  onNoUboDeclChange: (v: boolean) => void;
  onControlDescChange: (v: string) => void;
}

const EMPTY_LEGAL_REP: LegalRepInfo = { name: "", nationality: "", idType: "", idNumber: "", dateOfBirth: "" };
const EMPTY_UBO: UboInfo = { name: "", nationality: "", idType: "", idNumber: "", dateOfBirth: "", sharePercentage: 25, isLegalRep: false };

export default function StepLegal({
  legalRep, ubos, noUboDeclaration, controlStructureDesc,
  onLegalRepChange, onUbosChange, onNoUboDeclChange, onControlDescChange,
}: Props) {
  const { t } = useI18n();
  const rep = legalRep || EMPTY_LEGAL_REP;

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

  const ID_TYPES = [
    { value: "PASSPORT", label: t("app.idType.PASSPORT") },
    { value: "ID_CARD", label: t("app.idType.ID_CARD") },
    { value: "DRIVERS_LICENSE", label: t("app.idType.DRIVERS_LICENSE") },
  ];

  const updateRep = (field: keyof LegalRepInfo, value: string) => {
    onLegalRepChange({ ...rep, [field]: value });
  };

  const updateUbo = (index: number, field: keyof UboInfo, value: string | number | boolean) => {
    const next = [...ubos];
    next[index] = { ...next[index], [field]: value };
    onUbosChange(next);
  };

  const addUbo = () => {
    if (ubos.length >= 10) return;
    onUbosChange([...ubos, { ...EMPTY_UBO }]);
  };

  const removeUbo = (index: number) => {
    onUbosChange(ubos.filter((_, i) => i !== index));
  };

  const fillFromLegalRep = (index: number) => {
    const next = [...ubos];
    next[index] = { ...next[index], name: rep.name, nationality: rep.nationality, idType: rep.idType, idNumber: rep.idNumber, dateOfBirth: rep.dateOfBirth, isLegalRep: true };
    onUbosChange(next);
  };

  return (
    <div className="space-y-6">
      {/* Legal Representative */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.section.legalRep")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t("app.field.legalRepName")} value={rep.name} onChange={(v) => updateRep("name", v)} required />
          <Select label={t("app.field.nationality")} value={rep.nationality} onChange={(v) => updateRep("nationality", v)} options={COUNTRIES} required placeholder={t("app.ph.select")} />
          <Select label={t("app.field.idType")} value={rep.idType} onChange={(v) => updateRep("idType", v)} options={ID_TYPES} required placeholder={t("app.ph.select")} />
          <Field label={t("app.field.idNumber")} value={rep.idNumber} onChange={(v) => updateRep("idNumber", v)} required />
          <Field label={t("app.field.dateOfBirth")} value={rep.dateOfBirth} onChange={(v) => updateRep("dateOfBirth", v)} required type="date" />
        </div>
      </section>

      {/* UBOs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.section.ubo")}</h3>
            <p className="text-xs text-[var(--gray-500)] mt-0.5">{t("app.ubo.hint")}</p>
          </div>
        </div>

        {/* No UBO declaration checkbox */}
        <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--gray-200)] cursor-pointer hover:bg-[var(--gray-50)] transition-colors">
          <input
            type="checkbox"
            checked={noUboDeclaration}
            onChange={(e) => onNoUboDeclChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[var(--gray-300)] text-[var(--primary-black)] focus:ring-blue-500"
          />
          <span className="text-sm text-[var(--gray-700)]">{t("app.ubo.noUboDecl")}</span>
        </label>

        {noUboDeclaration ? (
          <div>
            <label className="block">
              <span className="text-sm font-medium text-[var(--gray-700)]">
                {t("app.field.controlStructure")} <span className="text-[var(--error)]">*</span>
              </span>
              <textarea
                value={controlStructureDesc || ""}
                onChange={(e) => onControlDescChange(e.target.value)}
                rows={3}
                placeholder={t("app.ph.controlStructure")}
                className="mt-1 w-full border border-[var(--gray-300)] rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </label>
          </div>
        ) : (
          <>
            {ubos.map((ubo, idx) => (
              <div key={idx} className="border border-[var(--gray-200)] rounded-lg p-5 space-y-4 relative">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                    {t("app.ubo.title")} #{idx + 1}
                  </h4>
                  <div className="flex items-center gap-2">
                    {!ubo.isLegalRep && (
                      <button type="button" onClick={() => fillFromLegalRep(idx)} className="text-xs text-blue-600 hover:underline">
                        {t("app.ubo.fillFromRep")}
                      </button>
                    )}
                    {ubos.length > 1 && (
                      <button type="button" onClick={() => removeUbo(idx)} className="p-1 text-[var(--gray-400)] hover:text-[var(--error)] transition-colors" aria-label={t("common.delete")}>
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label={t("app.field.legalRepName")} value={ubo.name} onChange={(v) => updateUbo(idx, "name", v)} required />
                  <Select label={t("app.field.nationality")} value={ubo.nationality} onChange={(v) => updateUbo(idx, "nationality", v)} options={COUNTRIES} required placeholder={t("app.ph.select")} />
                  <Select label={t("app.field.idType")} value={ubo.idType} onChange={(v) => updateUbo(idx, "idType", v)} options={ID_TYPES} required placeholder={t("app.ph.select")} />
                  <Field label={t("app.field.idNumber")} value={ubo.idNumber} onChange={(v) => updateUbo(idx, "idNumber", v)} required />
                  <Field label={t("app.field.dateOfBirth")} value={ubo.dateOfBirth} onChange={(v) => updateUbo(idx, "dateOfBirth", v)} required type="date" />
                  <label className="block">
                    <span className="text-sm font-medium text-[var(--gray-700)]">
                      {t("app.field.sharePercentage")} <span className="text-[var(--error)]">*</span>
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={ubo.sharePercentage || ""}
                        onChange={(e) => updateUbo(idx, "sharePercentage", Number(e.target.value))}
                        className="w-24 border border-[var(--gray-300)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-sm text-[var(--gray-500)]">%</span>
                    </div>
                  </label>
                </div>
              </div>
            ))}

            {ubos.length < 10 && (
              <button type="button" onClick={addUbo} className="flex items-center gap-1.5 text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] transition-colors">
                <PlusIcon className="h-4 w-4" />
                {t("app.ubo.add")}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
