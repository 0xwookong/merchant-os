"use client";

import { useI18n } from "@/providers/language-provider";
import { Field, Select, PhoneField } from "./form-fields";
import type { PersonInfo, UboInfo, DirectorInfo, AuthorizedPersonInfo } from "@/services/applicationService";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

interface Props {
  legalRep: PersonInfo | undefined;
  ubos: UboInfo[];
  noUboDeclaration: boolean;
  controlStructureDesc: string;
  directors: DirectorInfo[];
  authorizedPersons: AuthorizedPersonInfo[];
  onLegalRepChange: (rep: PersonInfo) => void;
  onUbosChange: (ubos: UboInfo[]) => void;
  onNoUboDeclChange: (v: boolean) => void;
  onControlDescChange: (v: string) => void;
  onDirectorsChange: (d: DirectorInfo[]) => void;
  onAuthorizedPersonsChange: (a: AuthorizedPersonInfo[]) => void;
}

const EMPTY_PERSON: PersonInfo = { name: "", nationality: "", idTypeNumber: "", placeOfBirth: "", dateOfBirth: "" };
const EMPTY_UBO: UboInfo = { ...EMPTY_PERSON, residentialAddress: "", sharePercentage: 25 };
const EMPTY_AUTH: AuthorizedPersonInfo = { ...EMPTY_PERSON, phone: "", email: "" };

export default function StepLegal({
  legalRep, ubos, noUboDeclaration, controlStructureDesc,
  directors, authorizedPersons,
  onLegalRepChange, onUbosChange, onNoUboDeclChange, onControlDescChange,
  onDirectorsChange, onAuthorizedPersonsChange,
}: Props) {
  const { t } = useI18n();
  const rep = legalRep || EMPTY_PERSON;

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

  return (
    <div className="space-y-8">
      {/* ─── UBOs ─── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.section.ubo")}</h3>
          <p className="text-xs text-[var(--gray-500)] mt-0.5">{t("app.ubo.hint")}</p>
        </div>

        <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--gray-200)] cursor-pointer hover:bg-[var(--gray-50)] transition-colors">
          <input type="checkbox" checked={noUboDeclaration} onChange={(e) => onNoUboDeclChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[var(--gray-300)] text-[var(--primary-black)] focus:ring-blue-500" />
          <span className="text-sm text-[var(--gray-700)]">{t("app.ubo.noUboDecl")}</span>
        </label>

        {noUboDeclaration ? (
          <label className="block">
            <span className="text-sm font-medium text-[var(--gray-700)]">{t("app.field.controlStructure")} <span className="text-[var(--error)]">*</span></span>
            <textarea value={controlStructureDesc || ""} onChange={(e) => onControlDescChange(e.target.value)} rows={3}
              placeholder={t("app.ph.controlStructure")}
              className="mt-1 w-full border border-[var(--gray-300)] rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </label>
        ) : (
          <>
            {ubos.map((ubo, idx) => (
              <PersonCard key={idx} title={`${t("app.ubo.title")} #${idx + 1}`}
                onRemove={ubos.length > 1 ? () => onUbosChange(ubos.filter((_, i) => i !== idx)) : undefined}
                extra={!ubo.isLegalRep && (
                  <button type="button" onClick={() => {
                    const next = [...ubos]; next[idx] = { ...next[idx], ...rep, isLegalRep: true }; onUbosChange(next);
                  }} className="text-xs text-blue-600 hover:underline">{t("app.ubo.fillFromRep")}</button>
                )}>
                <PersonFields person={ubo} onChange={(f, v) => { const n = [...ubos]; n[idx] = { ...n[idx], [f]: v }; onUbosChange(n); }} countries={COUNTRIES} t={t} />
                <Field label={t("app.field.residentialAddress")} value={ubo.residentialAddress} onChange={(v) => { const n = [...ubos]; n[idx] = { ...n[idx], residentialAddress: v }; onUbosChange(n); }} required
                  hint={t("app.hint.residentialAddress")} />
                <div>
                  <span className="text-sm font-medium text-[var(--gray-700)]">{t("app.field.sharePercentage")} <span className="text-[var(--error)]">*</span></span>
                  <div className="mt-1 flex items-center gap-2">
                    <input type="number" min={1} max={100} value={ubo.sharePercentage || ""} onChange={(e) => { const n = [...ubos]; n[idx] = { ...n[idx], sharePercentage: Number(e.target.value) }; onUbosChange(n); }}
                      className="w-24 border border-[var(--gray-300)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <span className="text-sm text-[var(--gray-500)]">%</span>
                  </div>
                </div>
              </PersonCard>
            ))}
            {ubos.length < 4 && (
              <AddButton label={t("app.ubo.add")} onClick={() => onUbosChange([...ubos, { ...EMPTY_UBO }])} />
            )}
          </>
        )}
      </section>

      {/* ─── Directors ─── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.section.directors")}</h3>
          <p className="text-xs text-[var(--gray-500)] mt-0.5">{t("app.hint.directors")}</p>
        </div>
        {directors.map((dir, idx) => (
          <PersonCard key={idx} title={`${t("app.director.title")} #${idx + 1}`}
            onRemove={directors.length > 1 ? () => onDirectorsChange(directors.filter((_, i) => i !== idx)) : undefined}>
            <PersonFields person={dir} onChange={(f, v) => { const n = [...directors]; n[idx] = { ...n[idx], [f]: v }; onDirectorsChange(n); }} countries={COUNTRIES} t={t} />
          </PersonCard>
        ))}
        {directors.length < 3 && (
          <AddButton label={t("app.director.add")} onClick={() => onDirectorsChange([...directors, { ...EMPTY_PERSON }])} />
        )}
      </section>

      {/* ─── Authorized Persons ─── */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.section.authorizedPersons")}</h3>
          <p className="text-xs text-[var(--gray-500)] mt-0.5">{t("app.hint.authorizedPersons")}</p>
        </div>
        {authorizedPersons.map((ap, idx) => (
          <PersonCard key={idx} title={`${t("app.authPerson.title")} #${idx + 1}`}
            onRemove={authorizedPersons.length > 1 ? () => onAuthorizedPersonsChange(authorizedPersons.filter((_, i) => i !== idx)) : undefined}>
            <PersonFields person={ap} onChange={(f, v) => { const n = [...authorizedPersons]; n[idx] = { ...n[idx], [f]: v }; onAuthorizedPersonsChange(n); }} countries={COUNTRIES} t={t} />
            <PhoneField label={t("app.field.contactPhone")} value={ap.phone} onChange={(v) => { const n = [...authorizedPersons]; n[idx] = { ...n[idx], phone: v }; onAuthorizedPersonsChange(n); }} required />
            <Field label={t("app.field.contactEmail")} value={ap.email} onChange={(v) => { const n = [...authorizedPersons]; n[idx] = { ...n[idx], email: v }; onAuthorizedPersonsChange(n); }} required type="email" />
          </PersonCard>
        ))}
        {authorizedPersons.length < 3 && (
          <AddButton label={t("app.authPerson.add")} onClick={() => onAuthorizedPersonsChange([...authorizedPersons, { ...EMPTY_AUTH }])} />
        )}
      </section>
    </div>
  );
}

// ─── Shared sub-components ───

function PersonFields({ person, onChange, countries, t }: {
  person: PersonInfo; onChange: (field: string, value: string) => void;
  countries: { value: string; label: string }[]; t: (k: string) => string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label={t("app.field.legalRepName")} value={person.name} onChange={(v) => onChange("name", v)} required />
      <Select label={t("app.field.nationality")} value={person.nationality} onChange={(v) => onChange("nationality", v)} options={countries} required placeholder={t("app.ph.select")} />
      <Field label={t("app.field.idTypeNumber")} value={person.idTypeNumber} onChange={(v) => onChange("idTypeNumber", v)} required
        placeholder={t("app.ph.idTypeNumber")} hint={t("app.hint.idTypeNumber")} />
      <Field label={t("app.field.placeOfBirth")} value={person.placeOfBirth} onChange={(v) => onChange("placeOfBirth", v)} required
        placeholder={t("app.ph.placeOfBirth")} />
      <Field label={t("app.field.dateOfBirth")} value={person.dateOfBirth} onChange={(v) => onChange("dateOfBirth", v)} required type="date" />
    </div>
  );
}

function PersonCard({ title, onRemove, extra, children }: {
  title: string; onRemove?: () => void; extra?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="border border-[var(--gray-200)] rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[var(--gray-900)]">{title}</h4>
        <div className="flex items-center gap-2">
          {extra}
          {onRemove && (
            <button type="button" onClick={onRemove} className="p-1 text-[var(--gray-400)] hover:text-[var(--error)] transition-colors">
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] transition-colors">
      <PlusIcon className="h-4 w-4" /> {label}
    </button>
  );
}
