"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/providers/language-provider";
import { useEnvironment } from "@/providers/environment-provider";
import { domainService, type DomainEntry } from "@/services/domainService";
import {
  PlusIcon,
  TrashIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { VerifyActionDialog, type VerifyData } from "@/components/ui/verify-action-dialog";
import { Toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";

function validateDomain(value: string, existing: DomainEntry[], t: (key: string) => string): string | null {
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return t("domains.error.protocol");
  if (trimmed.includes("*")) return t("domains.error.wildcard");
  try {
    const url = new URL(trimmed);
    if (!url.hostname || url.hostname.includes(" ")) return t("domains.error.invalid");
  } catch {
    return t("domains.error.invalid");
  }
  const origin = trimmed.replace(/\/+$/, "").toLowerCase();
  if (existing.some((d) => d.domain.replace(/\/+$/, "").toLowerCase() === origin)) {
    return t("domains.error.duplicate");
  }
  return null;
}

export default function DomainsPage() {
  const { t, locale } = useI18n();
  const { environment } = useEnvironment();
  const [domains, setDomains] = useState<DomainEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Verify dialog state
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyAction, setVerifyAction] = useState<"add" | "remove">("add");
  const [removingDomain, setRemovingDomain] = useState<DomainEntry | null>(null);

  const fetchDomains = useCallback(() => {
    setLoading(true);
    domainService.list()
      .then(setDomains)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [environment]);

  useEffect(() => { fetchDomains(); }, [fetchDomains]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleAddClick = () => {
    if (!newDomain.trim()) return;
    const validationError = validateDomain(newDomain, domains, t);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setVerifyAction("add");
    setRemovingDomain(null);
    setVerifyOpen(true);
  };

  const handleRemoveClick = (domain: DomainEntry) => {
    setVerifyAction("remove");
    setRemovingDomain(domain);
    setVerifyOpen(true);
  };

  const handleVerified = () => {
    setVerifyOpen(false);
    if (verifyAction === "add") {
      setNewDomain("");
      setToast({ type: "success", message: t("domains.add.success") });
    } else {
      setToast({ type: "success", message: t("domains.remove.success") });
    }
    fetchDomains();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("domains.title")}</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">{t("domains.subtitle")}</p>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <InformationCircleIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">{t("domains.info")}</p>
      </div>

      {/* Add domain */}
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-5">
        <div className="flex gap-3">
          <input
            type="text" value={newDomain} onChange={(e) => { setNewDomain(e.target.value); setError(""); }}
            placeholder={t("domains.add.placeholder")}
            onKeyDown={(e) => e.key === "Enter" && handleAddClick()}
            className="flex-1 border border-[var(--gray-300)] rounded-lg px-3 py-2.5 text-sm font-mono placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button onClick={handleAddClick} disabled={!newDomain.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
            <PlusIcon className="w-4 h-4" />
            {t("domains.add")}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {/* Domain list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-[var(--gray-200)] p-4 animate-pulse">
              <div className="h-4 bg-[var(--gray-200)] rounded w-64" />
            </div>
          ))}
        </div>
      ) : domains.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-12 text-center">
          <GlobeAltIcon className="w-10 h-10 text-[var(--gray-300)] mx-auto mb-3" />
          <p className="text-sm text-[var(--gray-500)]">{t("domains.empty")}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm divide-y divide-[var(--gray-100)]">
          {domains.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <GlobeAltIcon className="w-4 h-4 text-[var(--gray-400)] shrink-0" />
                <span className="text-sm font-mono text-[var(--gray-900)] truncate">{d.domain}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs text-[var(--gray-400)]">{new Date(d.createdAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}</span>
                <Tooltip content={t("domains.remove")}>
                  <button onClick={() => handleRemoveClick(d)} aria-label={t("domains.remove")}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-[var(--gray-400)] hover:text-red-600">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verify Dialog */}
      <VerifyActionDialog
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onSubmit={async (verifyData: VerifyData) => {
          if (verifyAction === "add") {
            await domainService.add(newDomain.trim(), verifyData);
          } else if (removingDomain) {
            await domainService.remove(removingDomain.id, verifyData);
          }
          handleVerified();
        }}
        title={verifyAction === "add" ? t("domains.verify.title") : t("domains.remove.title")}
        description={verifyAction === "add" ? t("domains.verify.desc") : t("domains.remove.desc")}
        confirmLabel={verifyAction === "add" ? t("domains.verify.confirm") : t("domains.remove.button")}
        icon={verifyAction === "add"
          ? <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
          : <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />}
        iconBg={verifyAction === "add" ? "bg-blue-100" : "bg-red-100"}
        confirmClass={verifyAction === "add" ? "bg-[var(--primary-black)] hover:opacity-90" : "bg-red-600 hover:bg-red-700"}
      >
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--gray-50)] border border-[var(--gray-100)]">
          <GlobeAltIcon className="w-5 h-5 text-[var(--gray-400)] shrink-0" />
          <span className="text-sm font-mono text-[var(--gray-900)] truncate">
            {verifyAction === "add" ? newDomain.trim() : removingDomain?.domain || ""}
          </span>
        </div>
      </VerifyActionDialog>

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
