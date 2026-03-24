"use client";

import { useState } from "react";
import Link from "next/link";
import { useEnvironment } from "@/providers/environment-provider";
import {
  CreditCardIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  FingerPrintIcon,
  BellAlertIcon,
  CodeBracketIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

type Mode = "websdk" | "openapi";

const TEST_CARDS = [
  { type: "Visa 3DS Frictionless", number: "4242 4242 4242 4242", behavior: "自动通过 3DS 验证" },
  { type: "Visa 3DS Challenge", number: "4539 3732 9896 7400", behavior: "需用户完成 3DS 挑战" },
  { type: "Visa 余额不足", number: "4532 2274 1657 1592", behavior: "支付失败" },
];

const CURRENCY_LIMITS = [
  { fiat: "EUR", crypto: "USDT / USDC", min: "1 EUR", max: "43,000 EUR" },
  { fiat: "EUR", crypto: "ETH", min: "1 EUR", max: "43,000 EUR" },
  { fiat: "USD", crypto: "USDT / USDC", min: "1 USD", max: "53,000 USD" },
];

const NETWORKS = "ERC20, TRC20, BEP20, Polygon, Arbitrum, Optimism, Solana";

export default function GettingStartedPage() {
  const [mode, setMode] = useState<Mode>("websdk");
  const { isSandbox } = useEnvironment();

  return (
    <div className="space-y-10">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 lg:p-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
        <div className="relative">
          <h1 className="text-3xl font-bold text-white">快速开始</h1>
          <p className="text-gray-400 mt-2 max-w-xl">
            选择集成模式，按照步骤快速接入 OSL Pay 加密货币支付网关
          </p>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ModeTab
          active={mode === "websdk"}
          onClick={() => setMode("websdk")}
          icon={<CodeBracketIcon className="w-6 h-6" />}
          title="WebSDK 接入"
          desc="快速集成，无需后端开发"
          tag="推荐"
        />
        <ModeTab
          active={mode === "openapi"}
          onClick={() => setMode("openapi")}
          icon={<DocumentTextIcon className="w-6 h-6" />}
          title="OpenAPI 接入"
          desc="完全控制，适合深度定制"
        />
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-[var(--gray-200)]" />
        <div className="space-y-0">
          {mode === "websdk" ? <WebSDKSteps isSandbox={isSandbox} /> : <OpenAPISteps />}
        </div>
      </div>

      {/* Reference data — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Cards */}
        <section className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--gray-100)] flex items-center gap-2">
            <CreditCardIcon className="w-5 h-5 text-[var(--gray-400)]" />
            <h2 className="font-semibold text-[var(--gray-900)]">测试卡号</h2>
            {isSandbox && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">沙箱</span>
            )}
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
            有效期：未来任意日期 &middot; CVV：任意 3 位数字
          </div>
        </section>

        {/* Currency & Networks */}
        <section className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--gray-100)] flex items-center gap-2">
            <CurrencyDollarIcon className="w-5 h-5 text-[var(--gray-400)]" />
            <h2 className="font-semibold text-[var(--gray-900)]">支持的货币和网络</h2>
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
            网络：{NETWORKS}
          </div>
        </section>
      </div>

      {/* Quick Links */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--gray-900)] mb-4">快速链接</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickLinkCard href="/developer/docs" icon={<DocumentTextIcon className="w-6 h-6" />} title="API 文档" desc="浏览 AI 友好的交互式 API 文档" />
          <QuickLinkCard href="/developer/signature" icon={<FingerPrintIcon className="w-6 h-6" />} title="签名工具" desc="在线生成和验证签名" />
          <QuickLinkCard href="/developer/webhooks" icon={<BellAlertIcon className="w-6 h-6" />} title="Webhook 管理" desc="配置端点，接收实时通知" />
        </div>
      </section>

      {/* Support */}
      <section className="rounded-xl bg-gradient-to-r from-[var(--gray-50)] to-white border border-[var(--gray-200)] p-6 text-center">
        <p className="text-sm text-[var(--gray-600)]">
          需要技术支持？联系我们：
          <a href="mailto:support@osl-pay.com" className="font-medium text-[var(--gray-900)] ml-1 hover:underline">support@osl-pay.com</a>
        </p>
      </section>
    </div>
  );
}

// ===== Sub-components =====

function ModeTab({ active, onClick, icon, title, desc, tag }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string; tag?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all ${
        active
          ? "border-[var(--primary-black)] bg-white shadow-md"
          : "border-[var(--gray-200)] bg-white hover:border-[var(--gray-300)] hover:shadow-sm"
      }`}
    >
      {tag && (
        <span className="absolute top-3 right-3 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--neon-green)] text-[var(--primary-black)]">
          {tag}
        </span>
      )}
      <div className={`p-2.5 rounded-lg ${active ? "bg-[var(--primary-black)] text-white" : "bg-[var(--gray-100)] text-[var(--gray-400)]"}`}>
        {icon}
      </div>
      <div>
        <div className={`text-sm font-semibold ${active ? "text-[var(--gray-900)]" : "text-[var(--gray-600)]"}`}>{title}</div>
        <div className="text-xs text-[var(--gray-500)] mt-0.5">{desc}</div>
      </div>
    </button>
  );
}

function WebSDKSteps({ isSandbox }: { isSandbox: boolean }) {
  const baseUrl = isSandbox ? "https://ramptest.osl-pay.com" : "https://ramp.osl-pay.com";
  return (
    <>
      <StepCard step={1} title="访问 Web SDK 测试页面">
        <p className="text-sm text-[var(--gray-600)]">使用测试 appId 访问 Web SDK：</p>
        <code className="block mt-2 px-4 py-3 bg-gray-900 rounded-lg text-xs font-mono text-green-400 break-all">
          {baseUrl}/?appId=your_test_appId
        </code>
        <p className="text-[11px] text-[var(--gray-400)] mt-2">如需获取测试 appId，请联系客户经理</p>
      </StepCard>
      <StepCard step={2} title="填写 KYC 信息">
        <p className="text-sm text-[var(--gray-600)]">在沙箱环境中，KYC 信息不会被验证。可以上传任意文件进行测试。</p>
      </StepCard>
      <StepCard step={3} title="使用测试卡号支付">
        <p className="text-sm text-[var(--gray-600)]">在支付页面选择借记卡/信用卡选项，使用下方提供的测试卡号（不要输入真实卡号）。</p>
      </StepCard>
      <StepCard step={4} title="查看支持的货币和网络" last>
        <p className="text-sm text-[var(--gray-600)]">查看下方支持的法币、加密货币组合和限额信息。</p>
      </StepCard>
    </>
  );
}

function OpenAPISteps() {
  return (
    <>
      <StepCard step={1} title="获取 API 凭证">
        <p className="text-sm text-[var(--gray-600)]">前往开发者控制台，查看并复制 App ID、API 公钥和 Webhook 公钥。</p>
        <StepLink href="/developer/credentials" text="前往开发者控制台" />
      </StepCard>
      <StepCard step={2} title="实现签名逻辑">
        <p className="text-sm text-[var(--gray-600)]">签名字符串格式：</p>
        <code className="block mt-2 px-4 py-3 bg-gray-900 rounded-lg text-xs font-mono text-green-400">
          appId=[your_app_id]&timestamp=[unix_timestamp]
        </code>
        <p className="text-sm text-[var(--gray-600)] mt-2">使用 RSA SHA256withRSA 算法对签名字符串进行签名。</p>
        <StepLink href="/developer/signature" text="使用签名工具测试" />
      </StepCard>
      <StepCard step={3} title="调用 API 接口">
        <p className="text-sm text-[var(--gray-600)]">参考 API 文档，使用您选择的编程语言调用 OSL Pay 的 OpenAPI 接口。</p>
        <StepLink href="/developer/docs" text="查看 API 文档" />
      </StepCard>
      <StepCard step={4} title="配置 Webhook" last>
        <p className="text-sm text-[var(--gray-600)]">配置 Webhook 端点以接收订单状态变更、KYC 状态等实时通知。</p>
        <StepLink href="/developer/webhooks" text="配置 Webhook" />
      </StepCard>
    </>
  );
}

function StepCard({ step, title, children, last }: { step: number; title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className="relative pl-12 pb-8">
      {/* Step number circle on the vertical line */}
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
