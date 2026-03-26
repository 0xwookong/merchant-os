"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useI18n } from "@/providers/language-provider";
import { securityService } from "@/services/securityService";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import * as Dialog from "@radix-ui/react-dialog";

export interface VerifyData {
  otpCode?: string;
  emailCode?: string;
}

interface VerifyActionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (verifyData: VerifyData) => Promise<void>;
  title: string;
  description: string;
  confirmLabel: string;
  icon: ReactNode;
  iconBg: string;
  confirmClass: string;
  children?: ReactNode;
}

export function VerifyActionDialog({
  open,
  onClose,
  onSubmit,
  title,
  description,
  confirmLabel,
  icon,
  iconBg,
  confirmClass,
  children,
}: VerifyActionDialogProps) {
  const { t } = useI18n();
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
    const verifyData: VerifyData = otpEnabled ? { otpCode: code } : { emailCode: code };
    try {
      await onSubmit(verifyData);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-5"
          aria-describedby="verify-action-desc"
        >
          <div className={`mx-auto w-12 h-12 rounded-full ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>

          <div className="text-center">
            <Dialog.Title className="text-lg font-semibold text-[var(--gray-900)]">{title}</Dialog.Title>
            <p id="verify-action-desc" className="text-sm text-[var(--gray-500)] mt-2">{description}</p>
          </div>

          {children}

          {/* Verification code input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)] mb-2">
              {otpEnabled ? t("common.verify.otpCode") : t("common.verify.emailCode")}
            </label>
            {!otpEnabled && !codeSent && (
              <button onClick={handleSendCode} disabled={sendingCode}
                className="mb-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50">
                {sendingCode ? t("common.verify.sendingCode") : t("common.verify.sendCode")}
              </button>
            )}
            {!otpEnabled && codeSent && (
              <p className="mb-2 text-xs text-green-600">{t("common.verify.codeSent")}</p>
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
              className="flex-1 px-4 py-2.5 border border-[var(--gray-300)] rounded-lg text-sm font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition-colors">
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
