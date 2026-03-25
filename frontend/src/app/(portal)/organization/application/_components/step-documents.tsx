"use client";

import { useEffect, useState, useRef } from "react";
import { useI18n } from "@/providers/language-provider";
import { applicationService } from "@/services/applicationService";
import type { DocumentResponse, UboInfo } from "@/services/applicationService";
import { ArrowUpTrayIcon, TrashIcon, DocumentIcon } from "@heroicons/react/24/outline";

interface Props {
  ubos: UboInfo[];
}

const DOC_SECTIONS = [
  { type: "BUSINESS_LICENSE", labelKey: "app.doc.businessLicense", required: true },
  { type: "ARTICLES", labelKey: "app.doc.articles", required: true },
] as const;

const LEGAL_REP_DOCS = [
  { type: "LEGAL_REP_ID_FRONT", labelKey: "app.doc.legalRepFront", required: true },
  { type: "LEGAL_REP_ID_BACK", labelKey: "app.doc.legalRepBack", required: true },
] as const;

const BANK_DOCS = [
  { type: "BANK_STATEMENT", labelKey: "app.doc.bankStatement", required: true },
] as const;

const OPTIONAL_DOCS = [
  { type: "SHARE_STRUCTURE", labelKey: "app.doc.shareStructure", required: false },
] as const;

export default function StepDocuments({ ubos }: Props) {
  const { t } = useI18n();
  const [docs, setDocs] = useState<DocumentResponse[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    applicationService.listDocuments().then(setDocs).catch(() => {});
  }, []);

  async function handleUpload(file: File, docType: string, uboIndex?: number) {
    setUploading(docType + (uboIndex !== undefined ? `-${uboIndex}` : ""));
    setError("");
    try {
      const doc = await applicationService.uploadDocument(file, docType, uboIndex);
      setDocs((prev) => [...prev, doc]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(null);
    }
  }

  async function handleDelete(docId: number) {
    try {
      await applicationService.deleteDocument(docId);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function getDoc(docType: string, uboIndex?: number) {
    return docs.find((d) => d.docType === docType && (uboIndex === undefined ? d.uboIndex === null : d.uboIndex === uboIndex));
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Company documents */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.doc.section.company")}</h3>
        {DOC_SECTIONS.map((d) => (
          <UploadSlot key={d.type} label={t(d.labelKey)} required={d.required} doc={getDoc(d.type)}
            uploading={uploading === d.type} onUpload={(f) => handleUpload(f, d.type)} onDelete={(id) => handleDelete(id)} t={t} />
        ))}
      </section>

      {/* Legal rep ID */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.doc.section.legalRep")}</h3>
        {LEGAL_REP_DOCS.map((d) => (
          <UploadSlot key={d.type} label={t(d.labelKey)} required={d.required} doc={getDoc(d.type)}
            uploading={uploading === d.type} onUpload={(f) => handleUpload(f, d.type)} onDelete={(id) => handleDelete(id)} t={t} />
        ))}
      </section>

      {/* UBO IDs */}
      {ubos.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.doc.section.ubo")}</h3>
          {ubos.map((ubo, idx) => (
            <div key={idx} className="space-y-3">
              <p className="text-sm font-medium text-[var(--gray-700)]">
                {ubo.name || `UBO #${idx + 1}`}
              </p>
              <UploadSlot label={t("app.doc.uboFront")} required doc={getDoc("UBO_ID_FRONT", idx)}
                uploading={uploading === `UBO_ID_FRONT-${idx}`} onUpload={(f) => handleUpload(f, "UBO_ID_FRONT", idx)} onDelete={(id) => handleDelete(id)} t={t} />
              <UploadSlot label={t("app.doc.uboBack")} required doc={getDoc("UBO_ID_BACK", idx)}
                uploading={uploading === `UBO_ID_BACK-${idx}`} onUpload={(f) => handleUpload(f, "UBO_ID_BACK", idx)} onDelete={(id) => handleDelete(id)} t={t} />
            </div>
          ))}
        </section>
      )}

      {/* Bank statement */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.doc.section.bank")}</h3>
        {BANK_DOCS.map((d) => (
          <UploadSlot key={d.type} label={t(d.labelKey)} required={d.required} doc={getDoc(d.type)}
            uploading={uploading === d.type} onUpload={(f) => handleUpload(f, d.type)} onDelete={(id) => handleDelete(id)} t={t} />
        ))}
      </section>

      {/* Optional */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--gray-900)]">{t("app.doc.section.optional")}</h3>
        {OPTIONAL_DOCS.map((d) => (
          <UploadSlot key={d.type} label={t(d.labelKey)} required={false} doc={getDoc(d.type)}
            uploading={uploading === d.type} onUpload={(f) => handleUpload(f, d.type)} onDelete={(id) => handleDelete(id)} t={t} />
        ))}
      </section>
    </div>
  );
}

function UploadSlot({ label, required, doc, uploading, onUpload, onDelete, t }: {
  label: string; required?: boolean; doc?: DocumentResponse; uploading: boolean;
  onUpload: (f: File) => void; onDelete: (id: number) => void; t: (k: string) => string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(files: FileList | null) {
    if (files && files[0]) onUpload(files[0]);
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
    <div
      className="border-2 border-dashed border-[var(--gray-200)] rounded-lg p-4 text-center hover:border-[var(--gray-400)] transition-colors cursor-pointer"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFile(e.dataTransfer.files); }}
    >
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
          <p className="text-sm text-[var(--gray-700)] mt-1">
            {label} {required && <span className="text-[var(--error)]">*</span>}
          </p>
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
