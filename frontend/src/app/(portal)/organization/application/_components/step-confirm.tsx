"use client";

import { useI18n } from "@/providers/language-provider";
import { Field, InfoRow } from "./form-fields";
import type { ApplicationSaveDraftRequest, PersonInfo, UboInfo, SignatureInfo } from "@/services/applicationService";

interface Props {
  form: ApplicationSaveDraftRequest;
  legalRep?: PersonInfo;
  ubos: UboInfo[];
  noUboDeclaration: boolean;
  controlStructureDesc: string;
  declarations: { info: boolean; sanctions: boolean; terms: boolean };
  onDeclarationsChange: (d: { info: boolean; sanctions: boolean; terms: boolean }) => void;
  signatures: { director: SignatureInfo; cco: SignatureInfo };
  onSignaturesChange: (s: { director: SignatureInfo; cco: SignatureInfo }) => void;
  onEditStep: (step: number) => void;
}

export default function StepConfirm({
  form, legalRep, ubos, noUboDeclaration, controlStructureDesc,
  declarations, onDeclarationsChange, signatures, onSignaturesChange, onEditStep,
}: Props) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <Section title={t("app.section.registration")} onEdit={() => onEditStep(1)}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <InfoRow label={t("app.field.companyName")} value={form.companyName} />
          <InfoRow label={t("app.field.companyNameEn")} value={form.companyNameEn} />
          <InfoRow label={t("app.field.regCountry")} value={form.regCountry} />
          <InfoRow label={t("app.field.regNumber")} value={form.regNumber} />
          <InfoRow label={t("app.field.companyType")} value={form.companyType} />
          <InfoRow label={t("app.field.incorporationDate")} value={form.incorporationDate} />
        </div>
      </Section>

      <Section title={t("app.section.address")} onEdit={() => onEditStep(1)}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <InfoRow label={t("app.field.addressLine1")} value={form.addressLine1} />
          <InfoRow label={t("app.field.city")} value={form.city} />
          <InfoRow label={t("app.field.postalCode")} value={form.postalCode} />
          <InfoRow label={t("app.field.country")} value={form.country} />
        </div>
      </Section>

      <Section title={t("app.section.contact")} onEdit={() => onEditStep(1)}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <InfoRow label={t("app.field.contactName")} value={form.contactName} />
          <InfoRow label={t("app.field.contactTitle")} value={form.contactTitle} />
          <InfoRow label={t("app.field.contactEmail")} value={form.contactEmail} />
          <InfoRow label={t("app.field.contactPhone")} value={form.contactPhone} />
        </div>
      </Section>

      {/* Legal Rep + UBO */}
      <Section title={t("app.section.legalRep")} onEdit={() => onEditStep(2)}>
        {legalRep ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <InfoRow label={t("app.field.legalRepName")} value={legalRep.name} />
            <InfoRow label={t("app.field.nationality")} value={legalRep.nationality} />
            <InfoRow label={t("app.field.idType")} value={legalRep.idType} />
            <InfoRow label={t("app.field.idNumber")} value={legalRep.idNumber} />
            <InfoRow label={t("app.field.placeOfBirth")} value={legalRep.placeOfBirth} />
            <InfoRow label={t("app.field.dateOfBirth")} value={legalRep.dateOfBirth} />
          </div>
        ) : (
          <p className="text-sm text-[var(--gray-400)]">—</p>
        )}
      </Section>

      <Section title={t("app.section.ubo")} onEdit={() => onEditStep(2)}>
        {noUboDeclaration ? (
          <div className="space-y-2">
            <p className="text-sm text-[var(--gray-600)]">{t("app.ubo.noUboDecl")}</p>
            {controlStructureDesc && (
              <p className="text-sm text-[var(--gray-700)]">{controlStructureDesc}</p>
            )}
          </div>
        ) : ubos.length > 0 ? (
          <div className="space-y-3">
            {ubos.map((ubo, i) => (
              <div key={i} className="text-sm text-[var(--gray-700)]">
                <span className="font-medium">{ubo.name || `UBO #${i + 1}`}</span>
                <span className="text-[var(--gray-500)] ml-2">— {ubo.sharePercentage}%</span>
                {ubo.nationality && <span className="text-[var(--gray-400)] ml-2">({ubo.nationality})</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--gray-400)]">—</p>
        )}
      </Section>

      {/* Business Info */}
      <Section title={t("app.section.business")} onEdit={() => onEditStep(3)}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <InfoRow label={t("app.field.businessType")} value={form.businessType} />
          <InfoRow label={t("app.field.website")} value={form.website} />
          <InfoRow label={t("app.field.monthlyVolume")} value={form.monthlyVolume} />
          <InfoRow label={t("app.field.monthlyTxCount")} value={form.monthlyTxCount} />
          <InfoRow label={t("app.field.supportedFiat")} value={form.supportedFiat} />
          <InfoRow label={t("app.field.supportedCrypto")} value={form.supportedCrypto} />
          <InfoRow label={t("app.field.useCases")} value={form.useCases} />
        </div>
        <div className="mt-3">
          <InfoRow label={t("app.field.businessDesc")} value={form.businessDesc} />
        </div>
      </Section>

      {/* Compliance declarations */}
      <div className="border-t border-[var(--gray-200)] pt-6 space-y-4">
        <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.confirm.declarations")}</h3>

        <DeclCheckbox checked={declarations.info}
          onChange={(v) => onDeclarationsChange({ ...declarations, info: v })}
          label={t("app.confirm.declInfo")} />

        <DeclCheckbox checked={declarations.sanctions}
          onChange={(v) => onDeclarationsChange({ ...declarations, sanctions: v })}
          label={t("app.confirm.declSanctions")} />

        <DeclCheckbox checked={declarations.terms}
          onChange={(v) => onDeclarationsChange({ ...declarations, terms: v })}
          label={t("app.confirm.declTerms")} />
      </div>

      {/* Signatures */}
      <div className="border-t border-[var(--gray-200)] pt-6 space-y-6">
        <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.sign.title")}</h3>

        <SignatureBlock
          title={t("app.sign.director")}
          sig={signatures.director}
          onChange={(s) => onSignaturesChange({ ...signatures, director: s })}
          confirmLabel={t("app.sign.directorConfirm")}
          t={t}
        />

        <SignatureBlock
          title={t("app.sign.cco")}
          sig={signatures.cco}
          onChange={(s) => onSignaturesChange({ ...signatures, cco: s })}
          confirmLabel={t("app.sign.ccoConfirm")}
          t={t}
        />
      </div>

      <p className="text-xs text-[var(--gray-400)]">{t("app.confirm.submitNote")}</p>
    </div>
  );
}

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--gray-900)]">{title}</h3>
        <button type="button" onClick={onEdit} className="text-xs text-blue-600 hover:underline">{t("common.edit")}</button>
      </div>
      {children}
    </div>
  );
}

function DeclCheckbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-[var(--gray-300)] text-[var(--primary-black)] focus:ring-blue-500" />
      <span className="text-sm text-[var(--gray-700)]">{label}</span>
    </label>
  );
}

function SignatureBlock({ title, sig, onChange, confirmLabel, t }: {
  title: string; sig: SignatureInfo; onChange: (s: SignatureInfo) => void;
  confirmLabel: string; t: (k: string) => string;
}) {
  const displayDate = sig.signedAt || new Date().toISOString().slice(0, 19).replace("T", " ");
  return (
    <div className="border border-[var(--gray-200)] rounded-lg p-5 space-y-4">
      <h4 className="text-sm font-semibold text-[var(--gray-900)]">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={t("app.sign.name")} value={sig.name} onChange={(v) => onChange({ ...sig, name: v })} required placeholder={t("app.ph.contactName")} />
        <Field label={t("app.sign.position")} value={sig.title} onChange={(v) => onChange({ ...sig, title: v })} required placeholder={t("app.ph.contactTitle")} />
        <Field label={t("app.sign.email")} value={sig.email} onChange={(v) => onChange({ ...sig, email: v })} required type="email" placeholder={t("app.ph.contactEmail")} />
        <div className="flex items-end">
          <div>
            <span className="text-xs text-[var(--gray-500)]">{t("app.sign.date")}</span>
            <p className="text-sm text-[var(--gray-900)] mt-0.5">{displayDate}</p>
          </div>
        </div>
      </div>
      <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-[var(--gray-100)]">
        <input type="checkbox" checked={sig.confirmed} onChange={(e) => {
          const signedAt = e.target.checked ? new Date().toISOString().slice(0, 19).replace("T", " ") : undefined;
          onChange({ ...sig, confirmed: e.target.checked, signedAt });
        }}
          className="mt-0.5 h-4 w-4 rounded border-[var(--gray-300)] text-[var(--primary-black)] focus:ring-blue-500" />
        <span className="text-sm text-[var(--gray-700)]">{confirmLabel}</span>
      </label>
    </div>
  );
}
