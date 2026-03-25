"use client";

import { useState, useRef } from "react";
import { useI18n } from "@/providers/language-provider";
import { applicationService } from "@/services/applicationService";
import type { DocumentResponse, UboInfo } from "@/services/applicationService";
import { ArrowUpTrayIcon, TrashIcon, DocumentIcon } from "@heroicons/react/24/outline";

interface Props {
  ubos: UboInfo[];
  isVaspCasp: boolean;
  docs: DocumentResponse[];
  onDocsChange: (docs: DocumentResponse[]) => void;
}

export default function StepDocuments({ ubos, isVaspCasp, docs, onDocsChange }: Props) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleUpload(file: File, docType: string, uboIndex?: number) {
    setUploading(docType + (uboIndex !== undefined ? `-${uboIndex}` : ""));
    setError("");
    try {
      const doc = await applicationService.uploadDocument(file, docType, uboIndex);
      onDocsChange([...docs, doc]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setUploading(null); }
  }

  async function handleDelete(docId: number) {
    try {
      await applicationService.deleteDocument(docId);
      onDocsChange(docs.filter((d) => d.id !== docId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function getDoc(docType: string, uboIndex?: number) {
    return docs.find((d) => d.docType === docType && (uboIndex === undefined ? d.uboIndex === null : d.uboIndex === uboIndex));
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-[var(--gray-500)]">{t("app.doc.ctcNote")}</p>
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

      {/* Required for all counterparts */}
      <DocSection title={t("app.doc.section.companyDocs")}>
        <UploadSlot label={t("app.doc.formation")} hint={t("app.doc.hint.formation")} required doc={getDoc("BUSINESS_LICENSE")}
          uploading={uploading === "BUSINESS_LICENSE"} onUpload={(f) => handleUpload(f, "BUSINESS_LICENSE")} onDelete={handleDelete} t={t} />
        <UploadSlot label={t("app.doc.businessProfile")} hint={t("app.doc.hint.businessProfile")} required doc={getDoc("BUSINESS_PROFILE")}
          uploading={uploading === "BUSINESS_PROFILE"} onUpload={(f) => handleUpload(f, "BUSINESS_PROFILE")} onDelete={handleDelete} t={t} />
        <UploadSlot label={t("app.doc.articles")} hint={t("app.doc.hint.articles")} required doc={getDoc("ARTICLES")}
          uploading={uploading === "ARTICLES"} onUpload={(f) => handleUpload(f, "ARTICLES")} onDelete={handleDelete} t={t} />
        <UploadSlot label={t("app.doc.orgChart")} hint={t("app.doc.hint.orgChart")} required doc={getDoc("SHARE_STRUCTURE")}
          uploading={uploading === "SHARE_STRUCTURE"} onUpload={(f) => handleUpload(f, "SHARE_STRUCTURE")} onDelete={handleDelete} t={t} />
        <UploadSlot label={t("app.doc.shareholderList")} required doc={getDoc("SHAREHOLDER_LIST")}
          uploading={uploading === "SHAREHOLDER_LIST"} onUpload={(f) => handleUpload(f, "SHAREHOLDER_LIST")} onDelete={handleDelete} t={t} />
        <UploadSlot label={t("app.doc.directorList")} required doc={getDoc("DIRECTOR_LIST")}
          uploading={uploading === "DIRECTOR_LIST"} onUpload={(f) => handleUpload(f, "DIRECTOR_LIST")} onDelete={handleDelete} t={t} />
      </DocSection>

      {/* Identity documents */}
      <DocSection title={t("app.doc.section.identity")}>
        <p className="text-xs text-[var(--gray-500)]">{t("app.doc.hint.identity")}</p>
        {ubos.map((ubo, idx) => (
          <div key={idx} className="space-y-2">
            <p className="text-sm font-medium text-[var(--gray-700)]">{ubo.name || `UBO #${idx + 1}`}</p>
            <UploadSlot label={t("app.doc.uboFront")} required doc={getDoc("UBO_ID_FRONT", idx)}
              uploading={uploading === `UBO_ID_FRONT-${idx}`} onUpload={(f) => handleUpload(f, "UBO_ID_FRONT", idx)} onDelete={handleDelete} t={t} />
            <UploadSlot label={t("app.doc.uboBack")} doc={getDoc("UBO_ID_BACK", idx)}
              uploading={uploading === `UBO_ID_BACK-${idx}`} onUpload={(f) => handleUpload(f, "UBO_ID_BACK", idx)} onDelete={handleDelete} t={t} />
          </div>
        ))}
        <UploadSlot label={t("app.doc.directorId")} required doc={getDoc("DIRECTOR_ID")}
          uploading={uploading === "DIRECTOR_ID"} onUpload={(f) => handleUpload(f, "DIRECTOR_ID")} onDelete={handleDelete} t={t} />
      </DocSection>

      {/* Address proof */}
      <DocSection title={t("app.doc.section.address")}>
        <UploadSlot label={t("app.doc.addressProof")} hint={t("app.doc.hint.addressProof")} required doc={getDoc("ADDRESS_PROOF")}
          uploading={uploading === "ADDRESS_PROOF"} onUpload={(f) => handleUpload(f, "ADDRESS_PROOF")} onDelete={handleDelete} t={t} />
      </DocSection>

      {/* Additional for VASP/CASP */}
      {isVaspCasp && (
        <DocSection title={t("app.doc.section.vaspCasp")}>
          <UploadSlot label={t("app.doc.regulatoryPermit")} required doc={getDoc("REGULATORY_PERMIT")}
            uploading={uploading === "REGULATORY_PERMIT"} onUpload={(f) => handleUpload(f, "REGULATORY_PERMIT")} onDelete={handleDelete} t={t} />
          <UploadSlot label={t("app.doc.amlPolicy")} required doc={getDoc("AML_POLICY")}
            uploading={uploading === "AML_POLICY"} onUpload={(f) => handleUpload(f, "AML_POLICY")} onDelete={handleDelete} t={t} />
          <UploadSlot label={t("app.doc.cddPolicy")} doc={getDoc("CDD_POLICY")}
            uploading={uploading === "CDD_POLICY"} onUpload={(f) => handleUpload(f, "CDD_POLICY")} onDelete={handleDelete} t={t} />
          <UploadSlot label={t("app.doc.sanctionsPolicy")} doc={getDoc("SANCTIONS_POLICY")}
            uploading={uploading === "SANCTIONS_POLICY"} onUpload={(f) => handleUpload(f, "SANCTIONS_POLICY")} onDelete={handleDelete} t={t} />
        </DocSection>
      )}
    </div>
  );
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-semibold text-[var(--gray-900)]">{title}</h3>
      {children}
    </section>
  );
}

function UploadSlot({ label, hint, required, doc, uploading, onUpload, onDelete, t }: {
  label: string; hint?: string; required?: boolean; doc?: DocumentResponse; uploading: boolean;
  onUpload: (f: File) => void; onDelete: (id: number) => void; t: (k: string) => string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  function handleFile(files: FileList | null) { if (files && files[0]) onUpload(files[0]); }
  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file") {
        const file = items[i].getAsFile();
        if (file) { e.preventDefault(); onUpload(file); return; }
      }
    }
  }

  if (doc) {
    return (
      <div className="flex items-center gap-3 p-3 border border-[var(--gray-200)] rounded-lg bg-[var(--gray-50)]">
        <DocumentIcon className="h-5 w-5 text-[var(--gray-500)] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--gray-900)] truncate">{doc.docName}</p>
          <p className="text-xs text-[var(--gray-500)]">{formatSize(doc.fileSize)}</p>
        </div>
        <button type="button" onClick={() => onDelete(doc.id)} className="p-1 text-[var(--gray-400)] hover:text-[var(--error)] transition-colors" aria-label={t("common.delete")}>
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed border-[var(--gray-200)] rounded-lg p-4 text-center hover:border-[var(--gray-400)] focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-colors cursor-pointer outline-none"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onPaste={handlePaste}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFile(e.dataTransfer.files); }}>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
        onChange={(e) => { handleFile(e.target.files); e.target.value = ""; }} />
      {uploading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full" />
          <span className="text-sm text-[var(--gray-500)]">{t("common.loading")}</span>
        </div>
      ) : (
        <>
          <ArrowUpTrayIcon className="h-5 w-5 text-[var(--gray-400)] mx-auto" />
          <p className="text-sm text-[var(--gray-700)] mt-1">{label} {required && <span className="text-[var(--error)]">*</span>}</p>
          {hint && <p className="text-xs text-[var(--gray-400)] mt-0.5">{hint}</p>}
          <p className="text-xs text-[var(--gray-400)] mt-0.5">{t("app.doc.hint")}</p>
        </>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
