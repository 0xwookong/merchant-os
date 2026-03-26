"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/providers/language-provider";
import { useEnvironment } from "@/providers/environment-provider";
import { credentialService, type CredentialData } from "@/services/credentialService";
import { VerifyActionDialog, type VerifyData } from "@/components/ui/verify-action-dialog";
import { Toast } from "@/components/ui/toast";
import Link from "next/link";
import {
  KeyIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  BookOpenIcon,
  FingerPrintIcon,
  BellAlertIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

type CopiedField = string | null;

const TEST_CARDS = [
  { type: "Visa 3DS Frictionless", number: "4242 4242 4242 4242", behaviorKey: "credentials.sandbox.testCards.frictionless" },
  { type: "Visa 3DS Challenge", number: "4539 3732 9896 7400", behaviorKey: "credentials.sandbox.testCards.challenge" },
  { type: "Visa Insufficient", number: "4532 2274 1657 1592", behaviorKey: "credentials.sandbox.testCards.insufficient" },
] as const;

const CURRENCY_TABLE = [
  { pair: "EUR → USDT/USDC", min: "1 EUR", max: "43,000 EUR" },
  { pair: "EUR → ETH", min: "1 EUR", max: "43,000 EUR" },
  { pair: "USD → USDT/USDC", min: "1 USD", max: "53,000 USD" },
] as const;

const QUICK_LINKS = [
  { path: "/developer/docs", icon: BookOpenIcon, labelKey: "credentials.quickLinks.docs", descKey: "credentials.quickLinks.docs.desc" },
  { path: "/developer/signature", icon: FingerPrintIcon, labelKey: "credentials.quickLinks.signature", descKey: "credentials.quickLinks.signature.desc" },
  { path: "/developer/webhooks", icon: BellAlertIcon, labelKey: "credentials.quickLinks.webhooks", descKey: "credentials.quickLinks.webhooks.desc" },
] as const;

export default function CredentialsPage() {
  const { t } = useI18n();
  const { isSandbox } = useEnvironment();
  const [data, setData] = useState<CredentialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<CopiedField>(null);
  const [rotateTarget, setRotateTarget] = useState<"api" | "webhook" | null>(null);
  const [rotating, setRotating] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchCredentials = useCallback(() => {
    setLoading(true);
    setError(null);
    credentialService.get()
      .then(setData)
      .catch((err) => setError(err.message || t("credentials.error")))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => { fetchCredentials(); }, [fetchCredentials]);

  const handleCopy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for non-secure context
    }
  };

  const handleRotate = async (verifyData: VerifyData) => {
    if (!rotateTarget) return;
    setRotating(true);
    try {
      const updated = await credentialService.rotate({
        keyType: rotateTarget,
        otpCode: verifyData.otpCode,
        emailCode: verifyData.emailCode,
      });
      setData(updated);
      setRotateTarget(null);
      setToast({ type: "success", message: t("credentials.rotate.success") });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.operationFailed");
      setToast({ type: "error", message: msg });
    } finally {
      setRotating(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ExclamationTriangleIcon className="w-10 h-10 text-[var(--gray-400)] mb-3" />
        <p className="text-[var(--gray-500)] mb-4">{error}</p>
        <button onClick={fetchCredentials}
          className="px-4 py-2 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          {t("credentials.retry")}
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("credentials.title")}</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">{t("credentials.subtitle")}</p>
      </div>

      {/* Short credentials: App ID + Endpoint — 2 columns on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ShortCredentialCard
          icon={KeyIcon}
          label={t("credentials.appId")}
          description={t("credentials.appId.desc")}
          value={data.appId}
          copied={copiedField === "appId"}
          onCopy={() => handleCopy(data.appId, "appId")}
          copiedLabel={t("credentials.copied")}
        />
        <ShortCredentialCard
          icon={GlobeAltIcon}
          label={t("credentials.apiEndpoint")}
          description={t("credentials.apiEndpoint.desc")}
          value={data.apiEndpoint}
          copied={copiedField === "apiEndpoint"}
          onCopy={() => handleCopy(data.apiEndpoint, "apiEndpoint")}
          copiedLabel={t("credentials.copied")}
        />
      </div>

      {/* Long credentials: Public Keys — 2 columns on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <KeyCredentialCard
          icon={ShieldCheckIcon}
          label={t("credentials.apiPublicKey")}
          description={t("credentials.apiPublicKey.desc")}
          value={data.apiPublicKey}
          copied={copiedField === "apiPublicKey"}
          onCopy={() => handleCopy(data.apiPublicKey, "apiPublicKey")}
          copiedLabel={t("credentials.copied")}
          onRotate={() => setRotateTarget("api")}
          rotateLabel={t("credentials.rotate.api")}
        />
        <KeyCredentialCard
          icon={ShieldCheckIcon}
          label={t("credentials.webhookPublicKey")}
          description={t("credentials.webhookPublicKey.desc")}
          value={data.webhookPublicKey}
          copied={copiedField === "webhookPublicKey"}
          onCopy={() => handleCopy(data.webhookPublicKey, "webhookPublicKey")}
          copiedLabel={t("credentials.copied")}
          onRotate={() => setRotateTarget("webhook")}
          rotateLabel={t("credentials.rotate.webhook")}
        />
      </div>

      {/* Sandbox Test Guide */}
      {isSandbox && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-[var(--gray-900)]">{t("credentials.sandbox.title")}</h2>
            <p className="text-sm text-[var(--gray-500)] mt-1">{t("credentials.sandbox.subtitle")}</p>
          </div>

          {/* Test Cards */}
          <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm">
            <div className="p-6 border-b border-[var(--gray-100)] flex items-center gap-2">
              <CreditCardIcon className="w-5 h-5 text-[var(--gray-500)]" />
              <h3 className="text-lg font-semibold text-[var(--gray-900)]">{t("credentials.sandbox.testCards")}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--gray-100)]">
                    <th className="text-left py-4 px-6 font-semibold text-[var(--gray-900)]">Type</th>
                    <th className="text-left py-4 px-6 font-semibold text-[var(--gray-900)]">Card Number</th>
                    <th className="text-left py-4 px-6 font-semibold text-[var(--gray-900)]">Behavior</th>
                  </tr>
                </thead>
                <tbody>
                  {TEST_CARDS.map((card) => (
                    <tr key={card.number} className="border-b border-[var(--gray-50)]">
                      <td className="py-4 px-6 text-[var(--gray-700)]">{card.type}</td>
                      <td className="py-4 px-6 font-mono text-[var(--gray-900)]">{card.number}</td>
                      <td className="py-4 px-6 text-[var(--gray-500)]">{t(card.behaviorKey)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-[var(--gray-50)] rounded-b-xl text-xs text-[var(--gray-500)] space-y-1">
              <p>{t("credentials.sandbox.testCards.expiry")}</p>
              <p>{t("credentials.sandbox.testCards.cvv")}</p>
            </div>
          </div>

          {/* Currencies + Limits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm">
              <div className="p-6 border-b border-[var(--gray-100)] flex items-center gap-2">
                <CurrencyDollarIcon className="w-5 h-5 text-[var(--gray-500)]" />
                <h3 className="font-semibold text-[var(--gray-900)]">{t("credentials.sandbox.currencies")}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--gray-100)]">
                      <th className="text-left py-3 px-6 font-semibold text-[var(--gray-900)]">Pair</th>
                      <th className="text-left py-3 px-6 font-semibold text-[var(--gray-900)]">Min</th>
                      <th className="text-left py-3 px-6 font-semibold text-[var(--gray-900)]">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CURRENCY_TABLE.map((row) => (
                      <tr key={row.pair} className="border-b border-[var(--gray-50)]">
                        <td className="py-3 px-6 text-[var(--gray-700)]">{row.pair}</td>
                        <td className="py-3 px-6 font-mono text-[var(--gray-700)]">{row.min}</td>
                        <td className="py-3 px-6 font-mono text-[var(--gray-700)]">{row.max}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-[var(--gray-50)] rounded-b-xl text-xs text-[var(--gray-500)]">
                {t("credentials.sandbox.networks")}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm">
              <div className="p-6 border-b border-[var(--gray-100)] flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-[var(--gray-500)]" />
                <h3 className="font-semibold text-[var(--gray-900)]">{t("credentials.sandbox.limits")}</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-[var(--gray-100)]">
                  <span className="text-sm text-[var(--gray-600)]">{t("credentials.sandbox.limits.single").split("：")[0]}</span>
                  <span className="text-sm font-semibold text-[var(--gray-900)] font-mono">{t("credentials.sandbox.limits.single").split("：")[1]}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-[var(--gray-600)]">{t("credentials.sandbox.limits.daily").split("：")[0]}</span>
                  <span className="text-sm font-semibold text-[var(--gray-900)] font-mono">{t("credentials.sandbox.limits.daily").split("：")[1]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--gray-900)] mb-4">{t("credentials.quickLinks.title")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {QUICK_LINKS.map((link) => (
            <Link key={link.path} href={link.path}
              className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-6 hover:shadow-md transition-all group">
              <link.icon className="w-8 h-8 text-[var(--gray-400)] group-hover:text-[var(--gray-700)] transition-colors mb-3" />
              <h3 className="font-semibold text-[var(--gray-900)] mb-1">{t(link.labelKey)}</h3>
              <p className="text-sm text-[var(--gray-500)]">{t(link.descKey)}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Rotate Verification Dialog */}
      <VerifyActionDialog
        open={rotateTarget !== null}
        onClose={() => setRotateTarget(null)}
        onSubmit={handleRotate}
        title={t("credentials.rotate.title")}
        description={rotateTarget === "api" ? t("credentials.rotate.api.desc") : t("credentials.rotate.webhook.desc")}
        confirmLabel={t("credentials.rotate.confirm")}
        icon={<ArrowPathIcon className="w-6 h-6 text-amber-600" />}
        iconBg="bg-amber-100"
        confirmClass="bg-amber-600 hover:bg-amber-700"
      />

      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

/** Short single-line credential (App ID, Endpoint) — inline copy button inside the value box */
function ShortCredentialCard({
  icon: Icon, label, description, value, copied, onCopy, copiedLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  copiedLabel: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-[var(--gray-400)]" />
        <span className="text-sm font-semibold text-[var(--gray-900)]">{label}</span>
      </div>
      <p className="text-xs text-[var(--gray-500)] mb-3">{description}</p>
      <div className="flex items-center gap-2 bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg px-3 py-2.5">
        <span className="text-sm font-mono text-[var(--gray-700)] flex-1 truncate">{value}</span>
        <button
          onClick={onCopy}
          className="shrink-0 p-1 rounded hover:bg-[var(--gray-200)] transition-colors"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <CheckIcon className="w-4 h-4 text-green-600" />
          ) : (
            <ClipboardDocumentIcon className="w-4 h-4 text-[var(--gray-400)]" />
          )}
        </button>
      </div>
      {copied && (
        <p className="text-xs text-green-600 mt-1">{copiedLabel}</p>
      )}
    </div>
  );
}

/** Multi-line key credential (Public Keys) — copy icon top-right of code block + rotate button */
function KeyCredentialCard({
  icon: Icon, label, description, value, copied, onCopy, copiedLabel, onRotate, rotateLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  copiedLabel: string;
  onRotate?: () => void;
  rotateLabel?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-[var(--gray-400)]" />
        <span className="text-sm font-semibold text-[var(--gray-900)]">{label}</span>
      </div>
      <p className="text-xs text-[var(--gray-500)] mb-3">{description}</p>
      <div className="relative">
        <pre className="text-xs font-mono bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg p-3 pr-10 overflow-x-auto whitespace-pre-wrap break-all text-[var(--gray-700)] max-h-40 overflow-y-auto">
          {value}
        </pre>
        <button
          onClick={onCopy}
          className="absolute top-2 right-2 p-1.5 rounded hover:bg-[var(--gray-200)] transition-colors bg-[var(--gray-50)]"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <CheckIcon className="w-4 h-4 text-green-600" />
          ) : (
            <ClipboardDocumentIcon className="w-4 h-4 text-[var(--gray-400)]" />
          )}
        </button>
      </div>
      <div className="flex items-center justify-between mt-2">
        {copied ? (
          <p className="text-xs text-green-600">{copiedLabel}</p>
        ) : <span />}
        {onRotate && (
          <button
            onClick={onRotate}
            className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            {rotateLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-7 bg-[var(--gray-200)] rounded w-40 mb-2 animate-pulse" />
        <div className="h-4 bg-[var(--gray-100)] rounded w-64 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-[var(--gray-200)] p-5 animate-pulse">
            <div className="h-4 bg-[var(--gray-200)] rounded w-20 mb-2" />
            <div className="h-3 bg-[var(--gray-100)] rounded w-48 mb-3" />
            <div className="h-10 bg-[var(--gray-100)] rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-[var(--gray-200)] p-5 animate-pulse">
            <div className="h-4 bg-[var(--gray-200)] rounded w-24 mb-2" />
            <div className="h-3 bg-[var(--gray-100)] rounded w-56 mb-3" />
            <div className="h-32 bg-[var(--gray-100)] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
