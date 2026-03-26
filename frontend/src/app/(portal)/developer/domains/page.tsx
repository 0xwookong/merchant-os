"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/providers/language-provider";
import { domainService, type DomainEntry } from "@/services/domainService";
import { securityService } from "@/services/securityService";
import * as Dialog from "@radix-ui/react-dialog";
import {
  PlusIcon,
  TrashIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function DomainsPage() {
  const { t } = useI18n();
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
  }, []);

  useEffect(() => { fetchDomains(); }, [fetchDomains]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleAddClick = () => {
    if (!newDomain.trim()) return;
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
                <span className="text-xs text-[var(--gray-400)]">{new Date(d.createdAt).toLocaleString("zh-CN")}</span>
                <button onClick={() => handleRemoveClick(d)} title={t("domains.remove")}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-[var(--gray-400)] hover:text-red-600">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verify Dialog */}
      <VerifyDialog
        open={verifyOpen}
        action={verifyAction}
        domain={verifyAction === "add" ? newDomain.trim() : removingDomain?.domain || ""}
        domainId={removingDomain?.id ?? null}
        onClose={() => setVerifyOpen(false)}
        onSuccess={handleVerified}
        onError={(msg) => setError(msg)}
        t={t}
      />

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}

function VerifyDialog({ open, action, domain, domainId, onClose, onSuccess, onError, t }: {
  open: boolean;
  action: "add" | "remove";
  domain: string;
  domainId: number | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
  t: (key: string) => string;
}) {
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  useEffect(() => {
    if (open) {
      setCode("");
      setError("");
      setCodeSent(false);
      securityService.getOtpStatus().then((s) => setOtpEnabled(s.otpEnabled)).catch(() => {});
    }
  }, [open]);

  const handleSendCode = async () => {
    setSendingCode(true);
    try {
      await securityService.sendEmailCode();
      setCodeSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    const verifyData = otpEnabled ? { otpCode: code } : { emailCode: code };
    try {
      if (action === "add") {
        await domainService.add(domain, verifyData);
      } else if (domainId !== null) {
        await domainService.remove(domainId, verifyData);
      }
      onSuccess();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("common.error");
      setError(msg);
      if (action === "add") onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isAdd = action === "add";
  const icon = isAdd
    ? <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
    : <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />;
  const iconBg = isAdd ? "bg-blue-100" : "bg-red-100";
  const title = isAdd ? t("domains.verify.title") : t("domains.remove.title");
  const desc = isAdd ? t("domains.verify.desc") : t("domains.remove.desc");
  const confirmLabel = isAdd ? t("domains.verify.confirm") : t("domains.remove.button");
  const confirmClass = isAdd
    ? "bg-[var(--primary-black)] hover:opacity-90"
    : "bg-red-600 hover:bg-red-700";

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-5"
          aria-describedby="domain-verify-desc"
        >
          <div className={`mx-auto w-12 h-12 rounded-full ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>

          <div className="text-center">
            <Dialog.Title className="text-lg font-semibold text-[var(--gray-900)]">{title}</Dialog.Title>
            <p id="domain-verify-desc" className="text-sm text-[var(--gray-500)] mt-2">{desc}</p>
          </div>

          {/* Domain info */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--gray-50)] border border-[var(--gray-100)]">
            <GlobeAltIcon className="w-5 h-5 text-[var(--gray-400)] shrink-0" />
            <span className="text-sm font-mono text-[var(--gray-900)] truncate">{domain}</span>
          </div>

          {/* Verification code input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)] mb-2">
              {otpEnabled ? t("domains.verify.otpCode") : t("domains.verify.emailCode")}
            </label>
            {!otpEnabled && !codeSent && (
              <button onClick={handleSendCode} disabled={sendingCode}
                className="mb-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50">
                {sendingCode ? t("domains.verify.sendingCode") : t("domains.verify.sendCode")}
              </button>
            )}
            {!otpEnabled && codeSent && (
              <p className="mb-2 text-xs text-green-600">{t("domains.verify.codeSent")}</p>
            )}
            <input type="text" value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              placeholder="000000" maxLength={6}
              className="w-full text-center text-xl font-mono tracking-[0.4em] border border-[var(--gray-300)] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} disabled={loading}
              className="flex-1 px-4 py-2.5 border border-[var(--gray-300)] rounded-lg text-sm font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)]">
              {t("common.cancel")}
            </button>
            <button onClick={handleSubmit} disabled={loading || code.length !== 6}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${confirmClass}`}>
              {loading ? t("common.loading") : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  return (
    <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg border ${
      type === "success"
        ? "bg-white border-green-200 text-green-700"
        : "bg-white border-red-200 text-red-700"
    }`}>
      {type === "success"
        ? <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />
        : <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="p-0.5 rounded hover:bg-[var(--gray-100)] transition-colors ml-2">
        <XMarkIcon className="w-4 h-4 text-[var(--gray-400)]" />
      </button>
    </div>
  );
}
