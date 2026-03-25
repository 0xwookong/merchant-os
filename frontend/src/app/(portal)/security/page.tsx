"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useI18n } from "@/providers/language-provider";
import { securityService, type OtpSetupResponse } from "@/services/securityService";
import { ApiError } from "@/lib/api";
import {
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { ShieldCheckIcon as ShieldCheckSolidIcon } from "@heroicons/react/24/solid";

export default function SecurityPage() {
  const { t } = useI18n();
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBindDialog, setShowBindDialog] = useState(false);
  const [showUnbindDialog, setShowUnbindDialog] = useState(false);

  useEffect(() => {
    securityService.getOtpStatus()
      .then((res) => setOtpEnabled(res.otpEnabled))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleBound = () => {
    setOtpEnabled(true);
    setShowBindDialog(false);
  };

  const handleUnbound = () => {
    setOtpEnabled(false);
    setShowUnbindDialog(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("security.title")}</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">{t("security.subtitle")}</p>
      </div>

      {/* OTP Card */}
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--gray-100)] flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5 text-[var(--gray-400)]" />
          <h2 className="font-semibold text-[var(--gray-900)]">{t("security.otp.title")}</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="h-20 bg-[var(--gray-100)] rounded-lg animate-pulse" />
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  otpEnabled ? "bg-green-100" : "bg-[var(--gray-100)]"
                }`}>
                  <DevicePhoneMobileIcon className={`w-6 h-6 ${otpEnabled ? "text-green-600" : "text-[var(--gray-400)]"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--gray-900)]">{t("security.otp.authenticator")}</span>
                    {otpEnabled ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                        {t("security.otp.enabled")}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--gray-100)] text-[var(--gray-500)]">
                        {t("security.otp.disabled")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--gray-500)] mt-0.5">{t("security.otp.desc")}</p>
                </div>
              </div>
              {otpEnabled ? (
                <button
                  onClick={() => setShowUnbindDialog(true)}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  {t("security.otp.unbind")}
                </button>
              ) : (
                <button
                  onClick={() => setShowBindDialog(true)}
                  className="px-4 py-2 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  {t("security.otp.bind")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <OtpBindDialog open={showBindDialog} onClose={() => setShowBindDialog(false)} onSuccess={handleBound} t={t} />
      <OtpUnbindDialog open={showUnbindDialog} onClose={() => setShowUnbindDialog(false)} onSuccess={handleUnbound} t={t} />
    </div>
  );
}

// ===== Bind Dialog =====

function OtpBindDialog({ open, onClose, onSuccess, t }: {
  open: boolean; onClose: () => void; onSuccess: () => void; t: (key: string) => string;
}) {
  const [step, setStep] = useState<"qr" | "verify">("qr");
  const [setup, setSetup] = useState<OtpSetupResponse | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("qr");
      setSetup(null);
      setCode("");
      setError("");
      securityService.otpSetup().then(setSetup).catch((e) => {
        setError(e instanceof ApiError ? e.message : t("common.error"));
      });
    }
  }, [open, t]);

  const handleVerify = async () => {
    setLoading(true);
    setError("");
    try {
      await securityService.otpVerifyBind(code);
      onSuccess();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (setup) {
      navigator.clipboard.writeText(setup.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--gray-100)]">
            <div className="flex items-center gap-2">
              <QrCodeIcon className="w-5 h-5 text-[var(--gray-400)]" />
              <Dialog.Title className="font-semibold text-[var(--gray-900)]">{t("security.otp.bind.title")}</Dialog.Title>
            </div>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--gray-100)] text-[var(--gray-400)]">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {!setup ? (
              <div className="h-48 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full animate-spin" />
              </div>
            ) : step === "qr" ? (
              <>
                {/* Step 1: Show QR */}
                <p className="text-sm text-[var(--gray-600)]">{t("security.otp.bind.step1")}</p>

                {/* QR Code */}
                <div className="flex justify-center py-4">
                  <div className="p-4 bg-white border-2 border-[var(--gray-200)] rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setup.otpAuthUri)}`}
                      alt="OTP QR Code"
                      width={200}
                      height={200}
                      className="rounded"
                    />
                  </div>
                </div>

                {/* Manual entry */}
                <div className="bg-[var(--gray-50)] rounded-lg p-4">
                  <p className="text-xs text-[var(--gray-500)] mb-2">{t("security.otp.bind.manualEntry")}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono text-[var(--gray-700)] break-all select-all">{setup.secret}</code>
                    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-[var(--gray-200)] transition-colors shrink-0">
                      {copied
                        ? <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        : <ClipboardDocumentIcon className="w-4 h-4 text-[var(--gray-400)]" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setStep("verify")}
                  className="w-full px-4 py-2.5 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  {t("security.otp.bind.next")}
                </button>
              </>
            ) : (
              <>
                {/* Step 2: Verify code */}
                <p className="text-sm text-[var(--gray-600)]">{t("security.otp.bind.step2")}</p>

                <div>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                    className="w-full text-center text-2xl font-mono tracking-[0.5em] border border-[var(--gray-300)] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep("qr")}
                    className="flex-1 px-4 py-2.5 border border-[var(--gray-300)] rounded-lg text-sm font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)]">
                    {t("common.back")}
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={loading || code.length !== 6}
                    className="flex-1 px-4 py-2.5 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {loading ? t("common.loading") : t("security.otp.bind.confirm")}
                  </button>
                </div>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ===== Unbind Dialog =====

function OtpUnbindDialog({ open, onClose, onSuccess, t }: {
  open: boolean; onClose: () => void; onSuccess: () => void; t: (key: string) => string;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) { setCode(""); setError(""); }
  }, [open]);

  const handleUnbind = async () => {
    setLoading(true);
    setError("");
    try {
      await securityService.otpUnbind(code);
      onSuccess();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-5"
          aria-describedby="unbind-desc"
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          </div>

          <div className="text-center">
            <Dialog.Title className="text-lg font-semibold text-[var(--gray-900)]">{t("security.otp.unbind.title")}</Dialog.Title>
            <p id="unbind-desc" className="text-sm text-[var(--gray-500)] mt-2">{t("security.otp.unbind.desc")}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)] mb-2">
              {t("security.otp.unbind.codeLabel")}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              placeholder="000000"
              maxLength={6}
              autoFocus
              className="w-full text-center text-2xl font-mono tracking-[0.5em] border border-[var(--gray-300)] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <button onClick={handleUnbind} disabled={loading || code.length !== 6}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? t("common.loading") : t("security.otp.unbind.confirm")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
