"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useEnvironment } from "@/providers/environment-provider";
import { useI18n } from "@/providers/language-provider";
import { merchantService, type MerchantProgressResponse } from "@/services/merchantService";
import {
  CheckCircleIcon,
  ClockIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  UserPlusIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  FingerPrintIcon,
  BellAlertIcon,
  CodeBracketIcon,
  ArrowTopRightOnSquareIcon,
  KeyIcon,
  GlobeAltIcon,
  RocketLaunchIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";

type StepStatus = "completed" | "inProgress" | "pending" | "locked" | "rejected" | "needMoreInfo";

export default function GettingStartedPage() {
  const { user } = useAuth();
  const { environment, isSandbox } = useEnvironment();
  const { t } = useI18n();
  const [progress, setProgress] = useState<MerchantProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [devGuideExpanded, setDevGuideExpanded] = useState(false);
  const pathname = usePathname();

  const role = user?.role || "ADMIN";

  const abortRef = useRef<AbortController | null>(null);

  const fetchProgress = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    merchantService.getProgress(controller.signal)
      .then((res) => { if (!controller.signal.aborted) setProgress(res); })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
  }, [environment]);

  // Re-fetch whenever this page becomes visible (initial mount + SPA navigation back)
  useEffect(() => {
    fetchProgress();
    return () => abortRef.current?.abort();
  }, [pathname, fetchProgress]);

  // Re-fetch on window focus and visibility change (tab switch, back navigation)
  useEffect(() => {
    const handleFocus = () => fetchProgress();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchProgress();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchProgress]);

  // Derive step statuses from progress data
  const stepStatuses = deriveStepStatuses(progress);

  // Role-based visibility
  const showBusinessSteps = role === "ADMIN" || role === "BUSINESS";
  const showTechStep = role === "ADMIN" || role === "TECH";
  const showGoLive = role === "ADMIN";

  // Auto-expand dev guide for TECH users
  useEffect(() => {
    if (role === "TECH") setDevGuideExpanded(true);
  }, [role]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 rounded-2xl bg-[var(--gray-100)] animate-pulse" />
        <div className="max-w-[960px] space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-[var(--gray-100)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 lg:p-10 mb-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
        <div className="relative">
          <h1 className="text-3xl font-bold text-white">{t("journey.title")}</h1>
          <p className="text-gray-400 mt-2 max-w-2xl">{t("journey.subtitle")}</p>
        </div>
      </div>

      <div className="max-w-[960px] space-y-8">
        {/* Sandbox hint banner */}
        {showBusinessSteps && stepStatuses.application !== "completed" && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-blue-50 border border-blue-200">
            <InformationCircleIcon className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800 flex-1">{t("journey.sandboxHint")}</p>
            {!isSandbox && (
              <span className="text-sm font-medium text-blue-700 shrink-0">{t("journey.enterSandbox")}</span>
            )}
          </div>
        )}

        {/* Onboarding Steps */}
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-[var(--gray-200)]" />

          {/* Step 1: Account Created */}
          {showBusinessSteps && (
            <JourneyStep
              step={1}
              status={stepStatuses.account}
              title={t("journey.step1.title")}
              description={t("journey.step1.desc")}
              t={t}
            />
          )}

          {/* Step 2: Merchant Application (unified KYB + Onboarding) */}
          {showBusinessSteps && (
            <JourneyStep
              step={2}
              status={stepStatuses.application}
              title={t("journey.step2.title")}
              description={t("journey.step2.desc")}
              t={t}
            >
              {stepStatuses.application === "completed" ? null : (
                <div className="mt-3 flex items-center gap-3">
                  <Link
                    href="/organization/application"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary-black)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    {stepStatuses.application === "pending"
                      ? t("journey.step2.cta.start")
                      : stepStatuses.application === "rejected" || stepStatuses.application === "needMoreInfo"
                        ? t("journey.step2.cta.continue")
                        : t("journey.step2.cta.view")}
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                  {stepStatuses.application === "inProgress" && (
                    <span className="text-xs text-[var(--gray-500)]">{t("journey.step2.pendingNote")}</span>
                  )}
                  {(stepStatuses.application === "rejected" || stepStatuses.application === "needMoreInfo") && (
                    <span className="text-xs text-[var(--error)]">{t("journey.step2.rejectedNote")}</span>
                  )}
                </div>
              )}
            </JourneyStep>
          )}

          {/* Step 3: Technical Integration */}
          {showTechStep && (
            <JourneyStep
              step={showBusinessSteps ? 3 : 1}
              status={stepStatuses.tech}
              title={t("journey.step4.title")}
              description={t("journey.step4.desc")}
              t={t}
            >
              <div className="mt-3 space-y-2">
                <p className="text-xs text-[var(--info)] flex items-center gap-1.5">
                  <InformationCircleIcon className="w-3.5 h-3.5" />
                  {t("journey.step4.sandboxNote")}
                </p>
                <TechSubTasks progress={progress} t={t} />
                {role === "ADMIN" && (
                  <Link
                    href="/organization/members"
                    className="inline-flex items-center gap-2 mt-2 text-sm font-medium text-[var(--gray-600)] hover:text-[var(--gray-900)] transition-colors"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    {t("journey.step4.cta.invite")}
                  </Link>
                )}
              </div>
            </JourneyStep>
          )}

          {/* Step 4: Go Live */}
          {showGoLive && (
            <JourneyStep
              step={4}
              status={stepStatuses.goLive}
              title={t("journey.step5.title")}
              description={t("journey.step5.desc")}
              t={t}
              last
            >
              {stepStatuses.goLive === "locked" ? (
                <p className="mt-2 text-xs text-[var(--gray-400)] flex items-center gap-1.5">
                  <LockClosedIcon className="w-3.5 h-3.5" />
                  {t("journey.step5.lockedNote")}
                </p>
              ) : (
                <p className="mt-2 text-xs text-[var(--success)] flex items-center gap-1.5">
                  <CheckCircleSolidIcon className="w-3.5 h-3.5" />
                  {t("journey.step5.readyNote")}
                </p>
              )}
            </JourneyStep>
          )}
        </div>

        {/* Developer Quick Start — collapsible section */}
        {showTechStep && (
          <div className="border border-[var(--gray-200)] rounded-xl overflow-hidden">
            <button
              onClick={() => setDevGuideExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-[var(--gray-50)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--primary-black)] text-[var(--neon-green)]">
                  <RocketLaunchIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-[var(--gray-900)]">{t("journey.devGuide.title")}</div>
                  <div className="text-xs text-[var(--gray-500)]">{t("journey.devGuide.subtitle")}</div>
                </div>
              </div>
              {devGuideExpanded
                ? <ChevronDownIcon className="w-5 h-5 text-[var(--gray-400)]" />
                : <ChevronRightIcon className="w-5 h-5 text-[var(--gray-400)]" />}
            </button>
            {devGuideExpanded && <DevGuideContent isSandbox={isSandbox} t={t} />}
          </div>
        )}

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

// ===== Helper =====

function deriveStepStatuses(progress: MerchantProgressResponse | null): {
  account: StepStatus;
  application: StepStatus;
  tech: StepStatus;
  goLive: StepStatus;
} {
  if (!progress) {
    return { account: "completed", application: "pending", tech: "pending", goLive: "locked" };
  }

  const account: StepStatus = "completed";

  let application: StepStatus = "pending";
  switch (progress.applicationStatus) {
    case "APPROVED": application = "completed"; break;
    case "SUBMITTED":
    case "UNDER_REVIEW": application = "inProgress"; break;
    case "REJECTED": application = "rejected"; break;
    case "NEED_MORE_INFO": application = "needMoreInfo"; break;
    case "DRAFT": application = "pending"; break;
    default: application = "pending";
  }

  const techDone = [progress.hasCredentials, progress.hasWebhooks, progress.hasDomains].filter(Boolean).length;
  const tech: StepStatus = techDone === 3 ? "completed" : techDone > 0 ? "inProgress" : "pending";

  const goLive: StepStatus = application === "completed" ? "pending" : "locked";

  return { account, application, tech, goLive };
}

// ===== Sub-components =====

function JourneyStep({ step, status, title, description, children, last, t }: {
  step: number;
  status: StepStatus;
  title: string;
  description: string;
  children?: React.ReactNode;
  last?: boolean;
  t: (key: string) => string;
}) {
  const statusConfig: Record<StepStatus, { icon: React.ReactNode; label: string; color: string }> = {
    completed: {
      icon: <CheckCircleSolidIcon className="w-10 h-10 text-[var(--success)]" />,
      label: t("journey.step.completed"),
      color: "text-[var(--success)]",
    },
    inProgress: {
      icon: <ClockIcon className="w-10 h-10 text-[var(--info)]" />,
      label: t("journey.step.inProgress"),
      color: "text-[var(--info)]",
    },
    pending: {
      icon: <div className="w-10 h-10 rounded-full bg-[var(--primary-black)] text-white flex items-center justify-center text-sm font-bold">{step}</div>,
      label: t("journey.step.pending"),
      color: "text-[var(--gray-500)]",
    },
    locked: {
      icon: <div className="w-10 h-10 rounded-full bg-[var(--gray-200)] text-[var(--gray-400)] flex items-center justify-center"><LockClosedIcon className="w-5 h-5" /></div>,
      label: t("journey.step.locked"),
      color: "text-[var(--gray-400)]",
    },
    rejected: {
      icon: <ExclamationTriangleIcon className="w-10 h-10 text-[var(--error)]" />,
      label: t("journey.step.rejected"),
      color: "text-[var(--error)]",
    },
    needMoreInfo: {
      icon: <ExclamationTriangleIcon className="w-10 h-10 text-[var(--warning)]" />,
      label: t("journey.step.needMoreInfo"),
      color: "text-[var(--warning)]",
    },
  };

  const { icon, label, color } = statusConfig[status];
  const isDisabled = status === "locked";

  return (
    <div className={`relative pl-14 pb-6 ${isDisabled ? "opacity-60" : ""}`}>
      <div className="absolute left-0 top-0 z-10">{icon}</div>
      {last && <div className="absolute left-5 top-10 bottom-0 w-px bg-transparent" />}
      <div className={`bg-white rounded-xl border shadow-sm p-5 transition-shadow ${isDisabled ? "border-[var(--gray-100)]" : "border-[var(--gray-200)] hover:shadow-md"}`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-[var(--gray-900)]">{title}</h3>
          <span className={`text-xs font-medium ${color}`}>{label}</span>
        </div>
        <p className="text-sm text-[var(--gray-500)]">{description}</p>
        {children}
      </div>
    </div>
  );
}

function TechSubTasks({ progress, t }: { progress: MerchantProgressResponse | null; t: (key: string) => string }) {
  const items = [
    { done: progress?.hasCredentials ?? false, label: t("journey.step4.sub.credentials"), href: "/developer/credentials", icon: KeyIcon },
    { done: progress?.hasWebhooks ?? false, label: t("journey.step4.sub.webhooks"), href: "/developer/webhooks", icon: BellAlertIcon },
    { done: progress?.hasDomains ?? false, label: t("journey.step4.sub.domains"), href: "/developer/domains", icon: GlobeAltIcon },
  ];
  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-[var(--gray-500)]">
        {t("journey.step4.sub.progress").replace("{done}", String(doneCount)).replace("{total}", String(items.length))}
      </p>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--gray-50)] transition-colors group"
        >
          {item.done
            ? <CheckCircleSolidIcon className="w-4 h-4 text-[var(--success)]" />
            : <div className="w-4 h-4 rounded-full border-2 border-[var(--gray-300)]" />}
          <item.icon className="w-4 h-4 text-[var(--gray-400)] group-hover:text-[var(--gray-600)]" />
          <span className={`text-sm ${item.done ? "text-[var(--gray-500)] line-through" : "text-[var(--gray-700)]"}`}>
            {item.label}
          </span>
          <ArrowRightIcon className="w-3 h-3 text-[var(--gray-300)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      ))}
    </div>
  );
}

function DevGuideContent({ isSandbox, t }: { isSandbox: boolean; t: (key: string) => string }) {
  const [mode, setMode] = useState<"websdk" | "openapi">("websdk");

  const TEST_CARDS = [
    { type: "Visa 3DS Frictionless", number: "4242 4242 4242 4242", behavior: t("gettingStarted.testCard.frictionless") },
    { type: "Visa 3DS Challenge", number: "4539 3732 9896 7400", behavior: t("gettingStarted.testCard.challenge") },
    { type: "Visa Insufficient", number: "4532 2274 1657 1592", behavior: t("gettingStarted.testCard.insufficient") },
  ];

  const CURRENCY_LIMITS = [
    { fiat: "EUR", crypto: "USDT / USDC", min: "1 EUR", max: "43,000 EUR" },
    { fiat: "EUR", crypto: "ETH", min: "1 EUR", max: "43,000 EUR" },
    { fiat: "USD", crypto: "USDT / USDC", min: "1 USD", max: "53,000 USD" },
  ];

  return (
    <div className="border-t border-[var(--gray-200)] bg-[var(--gray-50)] p-6 space-y-8">
      {/* Mode Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ModeTab active={mode === "websdk"} onClick={() => setMode("websdk")}
          icon={<CodeBracketIcon className="w-6 h-6" />} title={t("gettingStarted.mode.websdk")} desc={t("gettingStarted.mode.websdkDesc")} tag={t("common.recommended")} />
        <ModeTab active={mode === "openapi"} onClick={() => setMode("openapi")}
          icon={<DocumentTextIcon className="w-6 h-6" />} title={t("gettingStarted.mode.openapi")} desc={t("gettingStarted.mode.openapiDesc")} />
      </div>

      {/* Steps timeline */}
      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-[var(--gray-300)]" />
        {mode === "websdk" ? <WebSDKSteps isSandbox={isSandbox} t={t} /> : <OpenAPISteps t={t} />}
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
          <div className="px-6 py-3 bg-[var(--gray-50)] text-[10px] text-[var(--gray-400)]">{t("gettingStarted.cardHint")}</div>
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
          <div className="px-6 py-3 bg-[var(--gray-50)] text-[10px] text-[var(--gray-400)]">
            {t("gettingStarted.networks")} ERC20, TRC20, BEP20, Polygon, Arbitrum, Optimism, Solana
          </div>
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
    </div>
  );
}

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

function WebSDKSteps({ isSandbox, t }: { isSandbox: boolean; t: (key: string) => string }) {
  const baseUrl = isSandbox ? "https://ramptest.osl-pay.com" : "https://ramp.osl-pay.com";
  return (
    <>
      <DevStepCard step={1} title={t("gettingStarted.websdk.step1")}>
        <p className="text-sm text-[var(--gray-600)]">{t("gettingStarted.websdk.step1Desc")}</p>
        <code className="block mt-2 px-4 py-3 bg-gray-900 rounded-lg text-xs font-mono text-green-400 break-all">
          {baseUrl}/?appId=your_test_appId
        </code>
        <p className="text-[11px] text-[var(--gray-400)] mt-2">{t("gettingStarted.websdk.appIdHint")}</p>
      </DevStepCard>
      <DevStepCard step={2} title={t("gettingStarted.websdk.step2")}>
        <p className="text-sm text-[var(--gray-600)]">{t("gettingStarted.websdk.step2Desc")}</p>
      </DevStepCard>
      <DevStepCard step={3} title={t("gettingStarted.websdk.step3")}>
        <p className="text-sm text-[var(--gray-600)]">{t("gettingStarted.websdk.step3Desc")}</p>
      </DevStepCard>
      <DevStepCard step={4} title={t("gettingStarted.websdk.step4")} last>
        <p className="text-sm text-[var(--gray-600)]">{t("gettingStarted.websdk.step4Desc")}</p>
      </DevStepCard>
    </>
  );
}

function OpenAPISteps({ t }: { t: (key: string) => string }) {
  return (
    <>
      <DevStepCard step={1} title={t("gettingStarted.openapi.step1")}>
        <p className="text-sm text-[var(--gray-600)]">{t("gettingStarted.openapi.step1Desc")}</p>
        <StepLink href="/developer/credentials" text={t("gettingStarted.openapi.credentialsLink")} />
      </DevStepCard>
      <DevStepCard step={2} title={t("gettingStarted.openapi.step2")}>
        <p className="text-sm text-[var(--gray-600)]">{t("gettingStarted.openapi.step2Desc")}</p>
        <code className="block mt-2 px-4 py-3 bg-gray-900 rounded-lg text-xs font-mono text-green-400">
          appId=[your_app_id]&timestamp=[unix_timestamp]
        </code>
        <p className="text-sm text-[var(--gray-600)] mt-2">{t("gettingStarted.openapi.step2Hint")}</p>
        <StepLink href="/developer/signature" text={t("gettingStarted.openapi.signatureLink")} />
      </DevStepCard>
      <DevStepCard step={3} title={t("gettingStarted.openapi.step3")}>
        <p className="text-sm text-[var(--gray-600)]">{t("gettingStarted.openapi.step3Desc")}</p>
        <StepLink href="/developer/docs" text={t("gettingStarted.openapi.docsLink")} />
      </DevStepCard>
      <DevStepCard step={4} title={t("gettingStarted.openapi.step4")} last>
        <p className="text-sm text-[var(--gray-600)]">{t("gettingStarted.openapi.step4Desc")}</p>
        <StepLink href="/developer/webhooks" text={t("gettingStarted.openapi.webhooksLink")} />
      </DevStepCard>
    </>
  );
}

function DevStepCard({ step, title, children, last }: { step: number; title: string; children: React.ReactNode; last?: boolean }) {
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
