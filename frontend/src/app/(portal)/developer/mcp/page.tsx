"use client";

import { useState } from "react";
import { useI18n } from "@/providers/language-provider";
import { useEnvironment } from "@/providers/environment-provider";
import {
  ClipboardDocumentIcon,
  CheckIcon,
  CpuChipIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

const ENDPOINTS = {
  sandbox: { api: "https://openapitest.osl-pay.com", mcp: "https://mcptest.osl-pay.com/sse" },
  production: { api: "https://openapi.osl-pay.com", mcp: "https://mcp.osl-pay.com/sse" },
};

const MCP_TOOLS = [
  { name: "oslpay_get_quote", desc: "获取法币到加密货币的报价", descEn: "Get fiat-to-crypto quote" },
  { name: "oslpay_create_order", desc: "创建支付订单", descEn: "Create payment order" },
  { name: "oslpay_query_order", desc: "查询订单状态", descEn: "Query order status" },
  { name: "oslpay_generate_signature", desc: "生成 API 请求签名", descEn: "Generate API signature" },
  { name: "oslpay_get_currency_list", desc: "获取支持的加密货币列表", descEn: "Get supported currencies" },
  { name: "oslpay_get_guide", desc: "获取快速开始指南", descEn: "Get quick start guide" },
];

const EXAMPLES = [
  "使用 OSL Pay API 获取 100 USD 到 USDT 的报价",
  "创建一个支付订单，金额 100 USD，使用银行卡支付",
  "查询订单 ORD123456 的状态",
  "生成 API 请求签名",
  "如何集成 OSL Pay API？给我一个完整的流程",
];

export default function McpPage() {
  const { t } = useI18n();
  const { isSandbox, environment } = useEnvironment();
  const [copiedConfig, setCopiedConfig] = useState(false);

  const endpoints = isSandbox ? ENDPOINTS.sandbox : ENDPOINTS.production;

  const configJson = JSON.stringify({
    mcpServers: {
      oslpay: {
        url: endpoints.mcp,
        transport: { type: "sse" },
      },
    },
  }, null, 2);

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(configJson);
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
    } catch { /* */ }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("mcp.title")}</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">{t("mcp.subtitle")}</p>
      </div>

      {/* Environment info + Config JSON — 2 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current environment */}
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <CpuChipIcon className="w-5 h-5 text-[var(--gray-400)]" />
            <h2 className="font-semibold text-[var(--gray-900)]">{t("mcp.env.title")}</h2>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isSandbox ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {environment}
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-[var(--gray-500)]">{t("mcp.env.api")}</span>
              <div className="text-sm font-mono text-[var(--gray-700)] bg-[var(--gray-50)] rounded-lg px-3 py-2 mt-1">{endpoints.api}</div>
            </div>
            <div>
              <span className="text-xs text-[var(--gray-500)]">{t("mcp.env.mcp")}</span>
              <div className="text-sm font-mono text-[var(--gray-700)] bg-[var(--gray-50)] rounded-lg px-3 py-2 mt-1">{endpoints.mcp}</div>
            </div>
          </div>
        </div>

        {/* Config JSON */}
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-[var(--gray-900)]">{t("mcp.config.title")}</h2>
            <button onClick={handleCopyConfig}
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[var(--gray-300)] rounded-lg text-xs text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition-colors">
              {copiedConfig ? (
                <><CheckIcon className="w-3.5 h-3.5 text-green-600" /><span className="text-green-600">{t("mcp.config.copied")}</span></>
              ) : (
                <><ClipboardDocumentIcon className="w-3.5 h-3.5" /><span>{t("mcp.config.copy")}</span></>
              )}
            </button>
          </div>
          <p className="text-xs text-[var(--gray-500)] mb-3">{t("mcp.config.desc")}</p>
          <pre className="text-[13px] leading-5 font-mono bg-[var(--gray-900)] text-green-400 rounded-lg p-4 overflow-x-auto">
            {configJson}
          </pre>
        </div>
      </div>

      {/* Tools list */}
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <WrenchScrewdriverIcon className="w-5 h-5 text-[var(--gray-400)]" />
          <h2 className="font-semibold text-[var(--gray-900)]">{t("mcp.tools.title")}</h2>
          <span className="text-xs text-[var(--gray-400)]">6</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MCP_TOOLS.map((tool) => (
            <div key={tool.name} className="border border-[var(--gray-200)] rounded-lg p-3 hover:bg-[var(--gray-50)] transition-colors">
              <div className="text-sm font-mono text-[var(--gray-900)] mb-1">{tool.name}</div>
              <div className="text-xs text-[var(--gray-500)]">{tool.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Setup guide */}
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-5">
        <h2 className="font-semibold text-[var(--gray-900)] mb-4">{t("mcp.guide.title")}</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--primary-black)] text-white text-xs flex items-center justify-center font-semibold">
                {step}
              </span>
              <p className="text-sm text-[var(--gray-700)] pt-0.5">{t(`mcp.guide.step${step}`)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Example prompts + Support — 2 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-[var(--gray-400)]" />
            <h2 className="font-semibold text-[var(--gray-900)]">{t("mcp.examples.title")}</h2>
          </div>
          <div className="space-y-2">
            {EXAMPLES.map((ex, i) => (
              <div key={i} className="text-sm text-[var(--gray-600)] bg-[var(--gray-50)] rounded-lg px-3 py-2 italic">
                &ldquo;{ex}&rdquo;
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <EnvelopeIcon className="w-5 h-5 text-[var(--gray-400)]" />
            <h2 className="font-semibold text-[var(--gray-900)]">{t("mcp.support.title")}</h2>
          </div>
          <p className="text-sm text-[var(--gray-600)] mb-3">
            MCP 集成如遇问题，请联系技术支持团队：
          </p>
          <a href="mailto:support@osl-pay.com" className="text-sm font-medium text-blue-600 hover:underline">
            {t("mcp.support.email")}
          </a>
        </div>
      </div>
    </div>
  );
}
