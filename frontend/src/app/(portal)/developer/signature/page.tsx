"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/providers/language-provider";
import { signService } from "@/services/signService";
import * as Tabs from "@radix-ui/react-tabs";
import {
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  CommandLineIcon,
} from "@heroicons/react/24/outline";

const DEMO_APP_ID = "demo_app_20240101";
const DEMO_PLAINTEXT = "Hello OSLpay!";

export default function SignaturePage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("generate");

  // Shared state for cross-tab data transfer
  const [genAppId, setGenAppId] = useState(DEMO_APP_ID);
  const [genTimestamp, setGenTimestamp] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [genPrivateKey, setGenPrivateKey] = useState("");
  const [genResult, setGenResult] = useState<{ signatureString: string; signature: string; headerValue: string } | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");

  // Verify state
  const [verAppId, setVerAppId] = useState("");
  const [verTimestamp, setVerTimestamp] = useState("");
  const [verSignature, setVerSignature] = useState("");
  const [verPublicKey, setVerPublicKey] = useState("");
  const [verResult, setVerResult] = useState<boolean | null>(null);
  const [verLoading, setVerLoading] = useState(false);
  const [verError, setVerError] = useState("");

  // Encrypt state
  const [encPlaintext, setEncPlaintext] = useState(DEMO_PLAINTEXT);
  const [encPublicKey, setEncPublicKey] = useState("");
  const [encResult, setEncResult] = useState("");
  const [encLoading, setEncLoading] = useState(false);
  const [encError, setEncError] = useState("");

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = useCallback(async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch { /* non-secure context */ }
  }, []);

  const handleGenerate = async () => {
    setGenLoading(true);
    setGenError("");
    setGenResult(null);
    try {
      const res = await signService.generate({ appId: genAppId, timestamp: genTimestamp, privateKey: genPrivateKey });
      setGenResult(res);
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setGenLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerLoading(true);
    setVerError("");
    setVerResult(null);
    try {
      const res = await signService.verify({ appId: verAppId, timestamp: verTimestamp, signature: verSignature, publicKey: verPublicKey });
      setVerResult(res.valid);
    } catch (err: unknown) {
      setVerError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setVerLoading(false);
    }
  };

  const handleEncrypt = async () => {
    setEncLoading(true);
    setEncError("");
    setEncResult("");
    try {
      const res = await signService.encrypt({ plaintext: encPlaintext, publicKey: encPublicKey });
      setEncResult(res.ciphertext);
    } catch (err: unknown) {
      setEncError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setEncLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Auto-fill verify tab from generate results
    if (value === "verify" && genResult) {
      setVerAppId(genAppId);
      setVerTimestamp(genTimestamp);
      setVerSignature(genResult.signature);
    }
  };

  const handleReset = () => {
    setGenAppId(DEMO_APP_ID);
    setGenTimestamp(String(Math.floor(Date.now() / 1000)));
    setGenPrivateKey("");
    setGenResult(null);
    setGenError("");
    setVerAppId("");
    setVerTimestamp("");
    setVerSignature("");
    setVerPublicKey("");
    setVerResult(null);
    setVerError("");
    setEncPlaintext(DEMO_PLAINTEXT);
    setEncPublicKey("");
    setEncResult("");
    setEncError("");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("signature.title")}</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">{t("signature.subtitle")}</p>
        </div>
        <button onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 border border-[var(--gray-300)] rounded-lg text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition-colors">
          <ArrowPathIcon className="w-4 h-4" />
          {t("signature.reset")}
        </button>
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
        <Tabs.List className="flex bg-[var(--gray-100)] rounded-lg p-1 mb-6">
          {(["generate", "verify", "encrypt"] as const).map((tab) => (
            <Tabs.Trigger key={tab} value={tab}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-white text-[var(--gray-900)] shadow-sm"
                  : "text-[var(--gray-500)] hover:text-[var(--gray-700)]"
              }`}>
              {t(`signature.tab.${tab}`)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Generate Tab */}
        <Tabs.Content value="generate">
          <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm">
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <InputField label={t("signature.generate.appId")} value={genAppId} onChange={setGenAppId}
                  placeholder={t("signature.generate.appId.placeholder")} />
                <InputField label={t("signature.generate.timestamp")} value={genTimestamp} onChange={setGenTimestamp}
                  placeholder={t("signature.generate.timestamp.placeholder")} />
              </div>
              <TextareaField label={t("signature.generate.privateKey")} value={genPrivateKey} onChange={setGenPrivateKey}
                placeholder={t("signature.generate.privateKey.placeholder")} rows={6} />
              <button onClick={handleGenerate} disabled={genLoading || !genAppId || !genTimestamp || !genPrivateKey}
                className="px-5 py-2.5 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                {genLoading ? t("signature.generate.submitting") : t("signature.generate.submit")}
              </button>
              {genError && <ErrorMsg message={genError} />}
            </div>

            {genResult && (
              <div className="border-t border-[var(--gray-100)] p-6 space-y-3">
                <ResultField label={t("signature.generate.result.signatureString")} value={genResult.signatureString}
                  copied={copiedField === "sigStr"} onCopy={() => handleCopy(genResult.signatureString, "sigStr")} />
                <ResultField label={t("signature.generate.result.signature")} value={genResult.signature} mono
                  copied={copiedField === "sig"} onCopy={() => handleCopy(genResult.signature, "sig")} />
                <ResultField label={t("signature.generate.result.headerValue")} value={genResult.headerValue} mono
                  copied={copiedField === "header"} onCopy={() => handleCopy(genResult.headerValue, "header")} />
              </div>
            )}
          </div>
        </Tabs.Content>

        {/* Verify Tab */}
        <Tabs.Content value="verify">
          <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm">
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <InputField label={t("signature.verify.appId")} value={verAppId} onChange={setVerAppId}
                  placeholder={t("signature.generate.appId.placeholder")} />
                <InputField label={t("signature.verify.timestamp")} value={verTimestamp} onChange={setVerTimestamp}
                  placeholder={t("signature.generate.timestamp.placeholder")} />
              </div>
              <TextareaField label={t("signature.verify.signature")} value={verSignature} onChange={setVerSignature}
                placeholder={t("signature.verify.signature.placeholder")} rows={3} />
              <TextareaField label={t("signature.verify.publicKey")} value={verPublicKey} onChange={setVerPublicKey}
                placeholder={t("signature.verify.publicKey.placeholder")} rows={6} />
              <button onClick={handleVerify} disabled={verLoading || !verAppId || !verTimestamp || !verSignature || !verPublicKey}
                className="px-5 py-2.5 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                {verLoading ? t("signature.verify.submitting") : t("signature.verify.submit")}
              </button>
              {verError && <ErrorMsg message={verError} />}
            </div>

            {verResult !== null && (
              <div className="border-t border-[var(--gray-100)] p-6">
                {verResult ? (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-4">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="font-medium">{t("signature.verify.result.valid")}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg p-4">
                    <XCircleIcon className="w-5 h-5" />
                    <span className="font-medium">{t("signature.verify.result.invalid")}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Tabs.Content>

        {/* Encrypt Tab */}
        <Tabs.Content value="encrypt">
          <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm">
            <div className="p-6 space-y-4">
              <InputField label={t("signature.encrypt.plaintext")} value={encPlaintext} onChange={setEncPlaintext}
                placeholder={t("signature.encrypt.plaintext.placeholder")} />
              <TextareaField label={t("signature.encrypt.publicKey")} value={encPublicKey} onChange={setEncPublicKey}
                placeholder={t("signature.verify.publicKey.placeholder")} rows={6} />
              <button onClick={handleEncrypt} disabled={encLoading || !encPlaintext || !encPublicKey}
                className="px-5 py-2.5 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                {encLoading ? t("signature.encrypt.submitting") : t("signature.encrypt.submit")}
              </button>
              {encError && <ErrorMsg message={encError} />}
            </div>

            {encResult && (
              <div className="border-t border-[var(--gray-100)] p-6">
                <ResultField label={t("signature.encrypt.result")} value={encResult} mono
                  copied={copiedField === "cipher"} onCopy={() => handleCopy(encResult, "cipher")} />
              </div>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {/* Key generation reference */}
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <CommandLineIcon className="w-5 h-5 text-[var(--gray-400)]" />
          <h3 className="font-semibold text-[var(--gray-900)]">{t("signature.keyRef.title")}</h3>
        </div>
        <div className="space-y-3 text-sm">
          <CodeBlock label={t("signature.keyRef.generatePrivate")} code="openssl genrsa -out private.pem 2048" />
          <CodeBlock label={t("signature.keyRef.convertPkcs8")} code="openssl pkcs8 -topk8 -inform PEM -in private.pem -outform PEM -nocrypt -out private_pkcs8.pem" />
          <CodeBlock label={t("signature.keyRef.generatePublic")} code="openssl rsa -in private.pem -pubout -out public.pem" />
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-[var(--gray-300)] rounded-lg px-3 py-2.5 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; rows: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full border border-[var(--gray-300)] rounded-lg px-3 py-2.5 text-sm font-mono text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y" />
    </div>
  );
}

function ResultField({ label, value, mono, copied, onCopy }: {
  label: string; value: string; mono?: boolean; copied: boolean; onCopy: () => void;
}) {
  return (
    <div>
      <span className="text-xs font-medium text-[var(--gray-500)] mb-1 block">{label}</span>
      <div className="flex items-start gap-2 bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg px-3 py-2.5">
        <span className={`flex-1 text-sm ${mono ? "font-mono" : ""} text-[var(--gray-700)] break-all`}>{value}</span>
        <button onClick={onCopy} className="shrink-0 p-1 rounded hover:bg-[var(--gray-200)] transition-colors" aria-label={`Copy ${label}`}>
          {copied ? <CheckIcon className="w-4 h-4 text-green-600" /> : <ClipboardDocumentIcon className="w-4 h-4 text-[var(--gray-400)]" />}
        </button>
      </div>
    </div>
  );
}

function ErrorMsg({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg p-3 text-sm">
      <XCircleIcon className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div>
      <span className="text-xs text-[var(--gray-500)]"># {label}</span>
      <pre className="mt-1 bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--gray-700)] overflow-x-auto">
        {code}
      </pre>
    </div>
  );
}
