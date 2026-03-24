"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/providers/language-provider";
import { webhookService, type WebhookConfig } from "@/services/webhookService";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  BoltIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  BellAlertIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const ALL_EVENTS = [
  { key: "order.created", label: "订单已创建", group: "订单事件" },
  { key: "order.completed", label: "订单已完成", group: "订单事件" },
  { key: "order.failed", label: "订单失败", group: "订单事件" },
  { key: "order_status_change", label: "订单状态变更", group: "订单事件" },
  { key: "payment.success", label: "支付成功", group: "支付事件" },
  { key: "payment.refund", label: "支付退款", group: "支付事件" },
  { key: "kyc.approved", label: "KYC 审核通过", group: "KYC 事件" },
  { key: "kyc.rejected", label: "KYC 审核拒绝", group: "KYC 事件" },
  { key: "kyc_status_change", label: "KYC 状态变更", group: "KYC 事件" },
  { key: "defi_account_bind_status", label: "DeFi 绑定状态", group: "DeFi 事件" },
  { key: "defi_account_auth_status", label: "DeFi 授权状态", group: "DeFi 事件" },
];

export default function WebhooksPage() {
  const { t } = useI18n();
  const [configs, setConfigs] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formUrl, setFormUrl] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [testResult, setTestResult] = useState<{ id: number; msg: string } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState<number | null>(null);

  const fetchConfigs = useCallback(() => {
    setLoading(true);
    webhookService.list()
      .then(setConfigs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const openCreate = () => {
    setEditingId(null);
    setFormUrl("");
    setFormEvents([]);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (config: WebhookConfig) => {
    setEditingId(config.id);
    setFormUrl(config.url);
    setFormEvents([...config.events]);
    setFormError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    setFormLoading(true);
    setFormError("");
    try {
      if (editingId) {
        await webhookService.update(editingId, { url: formUrl, events: formEvents });
      } else {
        await webhookService.create({ url: formUrl, events: formEvents });
      }
      setShowForm(false);
      fetchConfigs();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("webhooks.delete.confirm"))) return;
    await webhookService.remove(id);
    fetchConfigs();
  };

  const handleTest = async (id: number) => {
    setTestResult({ id, msg: t("webhooks.testing") });
    try {
      const msg = await webhookService.testPush(id);
      setTestResult({ id, msg });
    } catch (err: unknown) {
      setTestResult({ id, msg: err instanceof Error ? err.message : "失败" });
    }
  };

  const handleCopySecret = async (secret: string, id: number) => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopiedSecret(id);
      setTimeout(() => setCopiedSecret(null), 2000);
    } catch { /* */ }
  };

  const toggleEvent = (ev: string) => {
    setFormEvents((prev) => prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("webhooks.title")}</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">{t("webhooks.subtitle")}</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <PlusIcon className="w-4 h-4" />
          {t("webhooks.create")}
        </button>
      </div>

      {/* Form dialog (inline) */}
      {showForm && (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-[var(--gray-900)]">{editingId ? t("webhooks.edit") : t("webhooks.create")}</h3>
          <div>
            <label className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">{t("webhooks.url")}</label>
            <input type="text" value={formUrl} onChange={(e) => setFormUrl(e.target.value)}
              placeholder={t("webhooks.url.placeholder")}
              className="w-full border border-[var(--gray-300)] rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">{t("webhooks.events")}</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {ALL_EVENTS.map((ev) => (
                <label key={ev.key} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--gray-200)] hover:bg-[var(--gray-50)] cursor-pointer transition-colors">
                  <input type="checkbox" checked={formEvents.includes(ev.key)} onChange={() => toggleEvent(ev.key)}
                    className="rounded border-[var(--gray-300)]" />
                  <div>
                    <span className="text-sm text-[var(--gray-900)]">{ev.label}</span>
                    <span className="text-[10px] text-[var(--gray-400)] ml-1.5">{ev.key}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{formError}</div>
          )}
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={formLoading || !formUrl || formEvents.length === 0}
              className="px-5 py-2.5 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
              {formLoading ? t("webhooks.saving") : t("webhooks.save")}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-5 py-2.5 border border-[var(--gray-300)] rounded-lg text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)]">
              {t("webhooks.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Config list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-[var(--gray-200)] p-6 animate-pulse">
              <div className="h-4 bg-[var(--gray-200)] rounded w-64 mb-3" />
              <div className="h-3 bg-[var(--gray-100)] rounded w-40" />
            </div>
          ))}
        </div>
      ) : configs.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-12 text-center">
          <BellAlertIcon className="w-10 h-10 text-[var(--gray-300)] mx-auto mb-3" />
          <p className="text-[var(--gray-500)] text-sm mb-1">{t("webhooks.empty")}</p>
          <p className="text-[var(--gray-400)] text-xs">{t("webhooks.empty.desc")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {configs.map((config) => (
            <div key={config.id} className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-mono text-[var(--gray-900)] truncate mb-1">{config.url}</div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {config.events.map((ev) => (
                      <span key={ev} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{ev}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--gray-500)]">{t("webhooks.secret")}:</span>
                    <code className="text-xs font-mono text-[var(--gray-600)] bg-[var(--gray-50)] px-2 py-0.5 rounded">{config.secret.slice(0, 12)}...</code>
                    <button onClick={() => handleCopySecret(config.secret, config.id)}
                      className="p-0.5 rounded hover:bg-[var(--gray-200)] transition-colors" aria-label="Copy secret">
                      {copiedSecret === config.id
                        ? <CheckIcon className="w-3.5 h-3.5 text-green-600" />
                        : <ClipboardDocumentIcon className="w-3.5 h-3.5 text-[var(--gray-400)]" />}
                    </button>
                  </div>
                  {testResult?.id === config.id && (
                    <div className="mt-2 text-xs text-[var(--gray-500)] bg-[var(--gray-50)] rounded px-2 py-1">{testResult.msg}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleTest(config.id)} title={t("webhooks.test")}
                    className="p-2 rounded-lg hover:bg-[var(--gray-100)] transition-colors text-[var(--gray-500)]">
                    <BoltIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEdit(config)} title={t("webhooks.edit")}
                    className="p-2 rounded-lg hover:bg-[var(--gray-100)] transition-colors text-[var(--gray-500)]">
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(config.id)} title={t("webhooks.delete")}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors text-[var(--gray-400)] hover:text-red-600">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
