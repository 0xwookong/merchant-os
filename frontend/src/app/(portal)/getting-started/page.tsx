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
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">快速开始</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">
          选择集成模式，按照步骤快速接入 OSL Pay
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-3">
        <ModeTab
          active={mode === "websdk"}
          onClick={() => setMode("websdk")}
          icon={<CodeBracketIcon className="w-5 h-5" />}
          title="WebSDK 接入"
          desc="快速集成，无需后端开发"
        />
        <ModeTab
          active={mode === "openapi"}
          onClick={() => setMode("openapi")}
          icon={<DocumentTextIcon className="w-5 h-5" />}
          title="OpenAPI 接入"
          desc="完全控制，适合深度定制"
        />
      </div>

      {/* Steps */}
      {mode === "websdk" ? <WebSDKSteps isSandbox={isSandbox} /> : <OpenAPISteps />}

      {/* Test Cards */}
      <section className="bg-white rounded-lg border border-[var(--gray-200)] shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCardIcon className="w-5 h-5 text-[var(--gray-500)]" />
          <h2 className="text-lg font-semibold text-[var(--gray-900)]">测试卡号</h2>
          {isSandbox && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">沙箱</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--gray-100)]">
                <th className="text-left py-3 px-4 font-semibold text-[var(--gray-900)]">卡类型</th>
                <th className="text-left py-3 px-4 font-semibold text-[var(--gray-900)]">卡号</th>
                <th className="text-left py-3 px-4 font-semibold text-[var(--gray-900)]">行为</th>
              </tr>
            </thead>
            <tbody>
              {TEST_CARDS.map((card) => (
                <tr key={card.number} className="border-b border-[var(--gray-50)] hover:bg-[var(--gray-50)]">
                  <td className="py-3 px-4 text-[var(--gray-700)]">{card.type}</td>
                  <td className="py-3 px-4 font-mono text-[var(--gray-900)]">{card.number}</td>
                  <td className="py-3 px-4 text-[var(--gray-600)]">{card.behavior}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[var(--gray-400)]">有效期：未来任意日期 | CVV：任意 3 位数字</p>
      </section>

      {/* Currency & Networks */}
      <section className="bg-white rounded-lg border border-[var(--gray-200)] shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <CurrencyDollarIcon className="w-5 h-5 text-[var(--gray-500)]" />
          <h2 className="text-lg font-semibold text-[var(--gray-900)]">支持的货币和网络</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--gray-100)]">
                <th className="text-left py-3 px-4 font-semibold text-[var(--gray-900)]">法币</th>
                <th className="text-left py-3 px-4 font-semibold text-[var(--gray-900)]">加密货币</th>
                <th className="text-left py-3 px-4 font-semibold text-[var(--gray-900)]">最小金额</th>
                <th className="text-left py-3 px-4 font-semibold text-[var(--gray-900)]">最大金额</th>
              </tr>
            </thead>
            <tbody>
              {CURRENCY_LIMITS.map((row, i) => (
                <tr key={i} className="border-b border-[var(--gray-50)] hover:bg-[var(--gray-50)]">
                  <td className="py-3 px-4 text-[var(--gray-700)]">{row.fiat}</td>
                  <td className="py-3 px-4 text-[var(--gray-900)] font-medium">{row.crypto}</td>
                  <td className="py-3 px-4 text-[var(--gray-600)]">{row.min}</td>
                  <td className="py-3 px-4 text-[var(--gray-600)]">{row.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[var(--gray-400)]">支持的网络：{NETWORKS}</p>
      </section>

      {/* Quick Links */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--gray-900)]">快速链接</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickLinkCard href="/developer/docs" icon={<DocumentTextIcon className="w-6 h-6" />} title="API 文档" desc="浏览 AI 友好的交互式 API 文档" />
          <QuickLinkCard href="/developer/signature" icon={<FingerPrintIcon className="w-6 h-6" />} title="签名工具" desc="在线生成和验证签名" />
          <QuickLinkCard href="/developer/webhooks" icon={<BellAlertIcon className="w-6 h-6" />} title="Webhook 管理" desc="配置端点，接收实时通知" />
        </div>
      </section>

      {/* Support */}
      <section className="bg-[var(--gray-50)] rounded-lg border border-[var(--gray-200)] p-6 text-center">
        <p className="text-sm text-[var(--gray-600)]">
          需要技术支持？联系我们：
          <span className="font-medium text-[var(--gray-900)] ml-1">support@osl-pay.com</span>
        </p>
      </section>
    </div>
  );
}

// ===== Sub-components =====

function ModeTab({ active, onClick, icon, title, desc }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all ${
        active ? "border-[var(--primary-black)] bg-white shadow-sm" : "border-[var(--gray-200)] bg-white hover:border-[var(--gray-300)]"
      }`}
    >
      <div className={active ? "text-[var(--gray-900)]" : "text-[var(--gray-400)]"}>{icon}</div>
      <div>
        <div className={`text-sm font-semibold ${active ? "text-[var(--gray-900)]" : "text-[var(--gray-600)]"}`}>{title}</div>
        <div className="text-xs text-[var(--gray-500)]">{desc}</div>
      </div>
    </button>
  );
}

function WebSDKSteps({ isSandbox }: { isSandbox: boolean }) {
  const baseUrl = isSandbox ? "https://ramptest.osl-pay.com" : "https://ramp.osl-pay.com";
  return (
    <div className="space-y-4">
      <StepCard step={1} title="访问 Web SDK 测试页面">
        <p className="text-sm text-[var(--gray-600)]">使用测试 appId 访问 Web SDK：</p>
        <code className="block mt-2 p-3 bg-[var(--gray-50)] rounded-lg text-xs font-mono text-[var(--gray-700)] break-all">
          {baseUrl}/?appId=your_test_appId
        </code>
        <p className="text-xs text-[var(--gray-400)] mt-2">如需获取测试 appId，请联系客户经理</p>
      </StepCard>
      <StepCard step={2} title="填写 KYC 信息">
        <p className="text-sm text-[var(--gray-600)]">在沙箱环境中，KYC 信息不会被验证。可以上传任意文件进行测试。</p>
      </StepCard>
      <StepCard step={3} title="使用测试卡号支付">
        <p className="text-sm text-[var(--gray-600)]">在支付页面选择借记卡/信用卡选项，使用下方提供的测试卡号（不要输入真实卡号）。</p>
      </StepCard>
      <StepCard step={4} title="查看支持的货币和网络">
        <p className="text-sm text-[var(--gray-600)]">查看下方支持的法币、加密货币组合和限额信息。</p>
      </StepCard>
    </div>
  );
}

function OpenAPISteps() {
  return (
    <div className="space-y-4">
      <StepCard step={1} title="获取 API 凭证">
        <p className="text-sm text-[var(--gray-600)]">前往开发者控制台，查看并复制 App ID、API 公钥和 Webhook 公钥。</p>
        <StepLink href="/developer/credentials" text="前往开发者控制台" />
      </StepCard>
      <StepCard step={2} title="实现签名逻辑">
        <p className="text-sm text-[var(--gray-600)]">签名字符串格式：</p>
        <code className="block mt-2 p-3 bg-[var(--gray-50)] rounded-lg text-xs font-mono text-[var(--gray-700)]">
          appId=[your_app_id]&timestamp=[unix_timestamp]
        </code>
        <p className="text-sm text-[var(--gray-600)] mt-2">使用 RSA SHA256withRSA 算法对签名字符串进行签名。</p>
        <StepLink href="/developer/signature" text="使用签名工具测试" />
      </StepCard>
      <StepCard step={3} title="调用 API 接口">
        <p className="text-sm text-[var(--gray-600)]">参考 API 文档，使用您选择的编程语言调用 OSL Pay 的 OpenAPI 接口。</p>
        <StepLink href="/developer/docs" text="查看 API 文档" />
      </StepCard>
      <StepCard step={4} title="配置 Webhook">
        <p className="text-sm text-[var(--gray-600)]">配置 Webhook 端点以接收订单状态变更、KYC 状态等实时通知。</p>
        <StepLink href="/developer/webhooks" text="配置 Webhook" />
      </StepCard>
    </div>
  );
}

function StepCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-[var(--gray-200)] shadow-sm p-5 flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--primary-black)] text-white flex items-center justify-center text-sm font-semibold">
        {step}
      </div>
      <div className="flex-1 space-y-1">
        <h3 className="text-base font-semibold text-[var(--gray-900)]">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function StepLink({ href, text }: { href: string; text: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] transition-colors">
      {text} <ArrowTopRightOnSquareIcon className="w-4 h-4" />
    </Link>
  );
}

function QuickLinkCard({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href} className="bg-white rounded-lg border border-[var(--gray-200)] shadow-sm p-5 flex items-start gap-3 hover:shadow-md transition-all">
      <div className="text-[var(--gray-500)]">{icon}</div>
      <div>
        <div className="text-sm font-semibold text-[var(--gray-900)]">{title}</div>
        <div className="text-xs text-[var(--gray-500)] mt-1">{desc}</div>
      </div>
    </Link>
  );
}
