"use client";

import { useState } from "react";
import Link from "next/link";
import { useEnvironment } from "@/providers/environment-provider";
import { useI18n } from "@/providers/language-provider";
import {
  CreditCardIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  FingerPrintIcon,
  BellAlertIcon,
  CodeBracketIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

type Mode = "websdk" | "openapi";

const CURRENCY_LIMITS = [
  { fiat: "EUR", crypto: "USDT / USDC", min: "1 EUR", max: "43,000 EUR" },
  { fiat: "EUR", crypto: "ETH", min: "1 EUR", max: "43,000 EUR" },
  { fiat: "USD", crypto: "USDT / USDC", min: "1 USD", max: "53,000 USD" },
];

const NETWORKS = "ERC20, TRC20, BEP20, Polygon, Arbitrum, Optimism, Solana";

export default function GettingStartedPage() {
  const [mode, setMode] = useState<Mode>("websdk");
  const { isSandbox } = useEnvironment();
  const { t } = useI18n();

  const TEST_CARDS = [
    { type: "Visa 3DS Frictionless", number: "4242 4242 4242 4242", behavior: t("gettingStarted.testCard.frictionless") },
    { type: "Visa 3DS Challenge", number: "4539 3732 9896 7400", behavior: t("gettingStarted.testCard.challenge") },
    { type: "Visa Insufficient", number: "4532 2274 1657 1592", behavior: t("gettingStarted.testCard.insufficient") },
  ];

  return (
    <div>
      {/* Hero — stretches full content width */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 lg:p-10 mb-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
        <div className="relative">
          <h1 className="text-3xl font-bold text-white">{t("gettingStarted.title")}</h1>
          <p className="text-gray-400 mt-2 max-w-2xl">
            {t("gettingStarted.subtitle")}
          </p>
        </div>
      </div>

      {/* Body — constrained to comfortable reading width */}
      <div className="max-w-[960px] space-y-10">
        {/* Mode Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModeTab active={mode === "websdk"} onClick={() => setMode("websdk")}
            icon={<CodeBracketIcon className="w-6 h-6" />} title={t("gettingStarted.mode.websdk")} desc={t("gettingStarted.mode.websdkDesc")} tag={t("common.recommended")} />
          <ModeTab active={mode === "openapi"} onClick={() => setMode("openapi")}
            icon={<DocumentTextIcon className="w-6 h-6" />} title={t("gettingStarted.mode.openapi")} desc={t("gettingStarted.mode.openapiDesc")} />
        </div>
        {/* Steps timeline */}
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-[var(--gray-200)]" />
          {mode === "websdk" ? <WebSDKSteps isSandbox={isSandbox} /> : <OpenAPISteps />}
        </div>

        {/* Reference data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--gray-100)] flex items-center gap-2">
              <CreditCardIcon className="w-5 h-5 text-[var(--gray-400)]" />
              <h2 className="font-semibold text-[var(--gray-900)]">{t("gettingStarted.testCards")}</h2>
              {isSandbox && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">{t("common.sandbox")}</span>}
            </div>
            <table className="w-full text-sm">
              <tbody>
                {TEST_CARDS.map((card, i) => (
                  <tr key={card.number} className={i < TEST_CARDS.length - 1 ? "border-b border-[var(--gray-50)]" : ""}>
                    <td className="py-3 px-6">
                      <div className="text-[var(--gray-900)] text-xs font-medium">{card.type}</div>
                      <div className="font-mono text-[var(--gray-600)] text-xs mt-0.5">{card.number}</div>
                    </td>
                    <td className="py-3 px-6 text-right text-xs text-[var(--gray-500)]">{card.behavior}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-[var(--gray-50)] text-[10px] text-[var(--gray-400)]">
              {t("gettingStarted.cardHint")}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--gray-100)] flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-[var(--gray-400)]" />
              <h2 className="font-semibold text-[var(--gray-900)]">{t("gettingStarted.currencies")}</h2>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {CURRENCY_LIMITS.map((row, i) => (
                  <tr key={i} className={i < CURRENCY_LIMITS.length - 1 ? "border-b border-[var(--gray-50)]" : ""}>
                    <td className="py-3 px-6">
                      <span className="text-xs font-medium text-[var(--gray-900)]">{row.fiat}</span>
                      <span className="text-[var(--gray-400)] mx-1.5">&rarr;</span>
                      <span className="text-xs font-medium text-[var(--gray-700)]">{row.crypto}</span>
                    </td>
                    <td className="py-3 px-6 text-right text-xs text-[var(--gray-500)] font-mono">{row.min} – {row.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-[var(--gray-50)] text-[10px] text-[var(--gray-400)]">{t("gettingStarted.networks")} {NETWORKS}</div>
          </section>
        </div>

        {/* Quick Links */}
        <section>
          <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-4">{t("gettingStarted.quickLinks")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickLinkCard href="/developer/docs" icon={<DocumentTextIcon className="w-6 h-6" />} title={t("gettingStarted.quickLink.docs")} desc={t("gettingStarted.quickLink.docsDesc")} />
            <QuickLinkCard href="/developer/signature" icon={<FingerPrintIcon className="w-6 h-6" />} title={t("gettingStarted.quickLink.signature")} desc={t("gettingStarted.quickLink.signatureDesc")} />
            <QuickLinkCard href="/developer/webhooks" icon={<BellAlertIcon className="w-6 h-6" />} title={t("gettingStarted.quickLink.webhooks")} desc={t("gettingStarted.quickLink.webhooksDesc")} />
          </div>
        </section>

        {/* Support */}
        <section className="rounded-xl bg-gradient-to-r from-[var(--gray-50)] to-white border border-[var(--gray-200)] p-6 text-center">
          <p className="text-sm text-[var(--gray-600)]">
            {t("common.supportContact")}
            <a href="mailto:support@osl-pay.com" className="font-medium text-[var(--gray-900)] ml-1 hover:underline">support@osl-pay.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}

// ===== Sub-components =====

function ModeTab({ active, onClick, icon, title, desc, tag }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string; tag?: string;
}) {
  return (
    <button onClick={onClick}
      className={`relative flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all ${
        active ? "border-[var(--primary-black)] bg-white shadow-md" : "border-[var(--gray-200)] bg-white hover:border-[var(--gray-300)] hover:shadow-sm"
      }`}>
      {tag && <span className="absolute top-3 right-3 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--neon-green)] text-[var(--primary-black)]">{tag}</span>}
      <div className={`p-2.5 rounded-lg ${active ? "bg-[var(--primary-black)] text-white" : "bg-[var(--gray-100)] text-[var(--gray-400)]"}`}>{icon}</div>
      <div>
        <div className={`text-sm font-semibold ${active ? "text-[var(--gray-900)]" : "text-[var(--gray-600)]"}`}>{title}</div>
        <div className="text-xs text-[var(--gray-500)] mt-0.5">{desc}</div>
      </div>
    </button>
  );
}

function WebSDKSteps({ isSandbox }: { isSandbox: boolean }) {
  const { t } = useI18n();
  const baseUrl = isSandbox ? "https://ramptest.osl-pay.com" : "https://ramp.osl-pay.com";
  return (
    <>
      <StepCard step={1} title={t("gettingStarted.websdk.step1")}>
        <p className="text-sm text-[var(--gray-600)]">{t("gettingStarted.websdk.step1Desc")}</p>
        <code className="block mt-2 px-4 py-3 bg-gray-900 rounded-lg text-xs font-mono text-green-400 break-all">
          {baseUrl}/?appId=your_test_appId
        </code>
        <p className="text-[11px] text-[var(--gray-400)] mt-2">{t("gettingStarted.websdk.appIdHint")}</p>
      </StepCard>
      <StepCard step={2} title={t("gettingStarted.websdk.step2")}>
        <p className="text-sm text-[var(--gray-600)]">{t("gettingStarted.websdk.step2Desc")}</p>
      </StepCard>
      <StepCard step={3} title={t("gettingStarted.websdk.step3")}>
        <p className="text-sm text-[var(--gray-600)]">{t("gettingStarted.websdk.step3Desc")}</p>
      </StepCard>
      <StepCard step={4} title={t("gettingStarted.websdk.step4")} last>
        <p className="text-sm text-[var(--gray-600)]">{t("gettingStarted.websdk.step4Desc")}</p>
      </StepCard>
    </>
  );
}

function OpenAPISteps() {
  const { t } = useI18n();
  return (
    <>
      <StepCard step={1} title={t("gettingStarted.openapi.step1")}>
        <p className="text-sm text-[var(--gray-600)]">{t("gettingStarted.openapi.step1Desc")}</p>
        <StepLink href="/developer/credentials" text={t("gettingStarted.openapi.credentialsLink")} />
      </StepCard>
      <StepCard step={2} title={t("gettingStarted.openapi.step2")}>
        <p className="text-sm text-[var(--gray-600)]">{t("gettingStarted.openapi.step2Desc")}</p>
        <code className="block mt-2 px-4 py-3 bg-gray-900 rounded-lg text-xs font-mono text-green-400">
          appId=[your_app_id]&timestamp=[unix_timestamp]
        </code>
        <p className="text-sm text-[var(--gray-600)] mt-2">{t("gettingStarted.openapi.step2Hint")}</p>
        <StepLink href="/developer/signature" text={t("gettingStarted.openapi.signatureLink")} />
      </StepCard>
      <StepCard step={3} title={t("gettingStarted.openapi.step3")}>
        <p className="text-sm text-[var(--gray-600)]">{t("gettingStarted.openapi.step3Desc")}</p>
        <StepLink href="/developer/docs" text={t("gettingStarted.openapi.docsLink")} />
      </StepCard>
      <StepCard step={4} title={t("gettingStarted.openapi.step4")} last>
        <p className="text-sm text-[var(--gray-600)]">{t("gettingStarted.openapi.step4Desc")}</p>
        <StepLink href="/developer/webhooks" text={t("gettingStarted.openapi.webhooksLink")} />
      </StepCard>
    </>
  );
}

function StepCard({ step, title, children, last }: { step: number; title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className="relative pl-12 pb-8">
      <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-[var(--primary-black)] text-white flex items-center justify-center text-sm font-bold shadow-sm z-10">
        {step}
      </div>
      {last && <div className="absolute left-[19px] top-10 bottom-0 w-px bg-transparent" />}
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-5 hover:shadow-md transition-shadow">
        <h3 className="text-base font-semibold text-[var(--gray-900)] mb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function StepLink({ href, text }: { href: string; text: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
      {text} <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
    </Link>
  );
}

function QuickLinkCard({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">
      <div className="p-2 rounded-lg bg-[var(--gray-100)] text-[var(--gray-500)] group-hover:bg-[var(--primary-black)] group-hover:text-white transition-colors w-fit mb-3">
        {icon}
      </div>
      <div className="text-sm font-semibold text-[var(--gray-900)]">{title}</div>
      <div className="text-xs text-[var(--gray-500)] mt-1">{desc}</div>
    </Link>
  );
}
