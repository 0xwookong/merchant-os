"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/providers/language-provider";
import { webhookService, type WebhookConfig, type WebhookLogEntry } from "@/services/webhookService";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  BoltIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  BellAlertIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

export default function WebhooksPage() {
  const { t } = useI18n();

  const ALL_EVENTS = [
    { key: "order.created", label: t("webhooks.event.order.created"), group: t("webhooks.eventGroup.order") },
    { key: "order.completed", label: t("webhooks.event.order.completed"), group: t("webhooks.eventGroup.order") },
    { key: "order.failed", label: t("webhooks.event.order.failed"), group: t("webhooks.eventGroup.order") },
    { key: "order_status_change", label: t("webhooks.event.order_status_change"), group: t("webhooks.eventGroup.order") },
    { key: "payment.success", label: t("webhooks.event.payment.success"), group: t("webhooks.eventGroup.payment") },
    { key: "payment.refund", label: t("webhooks.event.payment.refund"), group: t("webhooks.eventGroup.payment") },
    { key: "kyc.approved", label: t("webhooks.event.kyc.approved"), group: t("webhooks.eventGroup.kyc") },
    { key: "kyc.rejected", label: t("webhooks.event.kyc.rejected"), group: t("webhooks.eventGroup.kyc") },
    { key: "kyc_status_change", label: t("webhooks.event.kyc_status_change"), group: t("webhooks.eventGroup.kyc") },
    { key: "defi_account_bind_status", label: t("webhooks.event.defi_account_bind_status"), group: t("webhooks.eventGroup.defi") },
    { key: "defi_account_auth_status", label: t("webhooks.event.defi_account_auth_status"), group: t("webhooks.eventGroup.defi") },
  ];

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
  const [expandedLogs, setExpandedLogs] = useState<number | null>(null);
  const [logs, setLogs] = useState<WebhookLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

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
      setFormError(err instanceof Error ? err.message : t("common.operationFailed"));
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
      setTestResult({ id, msg: err instanceof Error ? err.message : t("common.failed") });
    }
  };

  const handleCopySecret = async (secret: string, id: number) => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopiedSecret(id);
      setTimeout(() => setCopiedSecret(null), 2000);
    } catch { /* */ }
  };

  const toggleLogs = async (id: number) => {
    if (expandedLogs === id) {
      setExpandedLogs(null);
      return;
    }
    setExpandedLogs(id);
    setLogsLoading(true);
    try {
      const data = await webhookService.getLogs(id);
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
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
                  <button onClick={() => toggleLogs(config.id)} title={t("webhooks.pushLogs")}
                    className={`p-2 rounded-lg hover:bg-[var(--gray-100)] transition-colors ${expandedLogs === config.id ? "text-blue-600" : "text-[var(--gray-500)]"}`}>
                    <ClockIcon className="w-4 h-4" />
                  </button>
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

              {/* Push Logs */}
              {expandedLogs === config.id && (
                <div className="mt-4 border-t border-[var(--gray-100)] pt-4">
                  <h4 className="text-xs font-semibold text-[var(--gray-700)] mb-2 flex items-center gap-1">
                    <ClockIcon className="w-3.5 h-3.5" /> {t("webhooks.pushLogs")}
                  </h4>
                  {logsLoading ? (
                    <div className="py-4 text-center"><div className="w-4 h-4 border-2 border-[var(--gray-300)] border-t-[var(--primary-black)] rounded-full animate-spin mx-auto" /></div>
                  ) : logs.length === 0 ? (
                    <div className="text-xs text-[var(--gray-400)] py-2">{t("webhooks.pushLogs.empty")}</div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {logs.map((l) => (
                        <div key={l.id} className="flex items-center gap-3 text-xs bg-[var(--gray-50)] rounded-lg px-3 py-2">
                          <span className="font-mono text-[var(--gray-600)]">{l.eventType}</span>
                          <LogStatusBadge status={l.status} />
                          {l.httpStatus && <span className="font-mono text-[var(--gray-500)]">HTTP {l.httpStatus}</span>}
                          {l.retryCount > 0 && <span className="text-[var(--gray-400)]">×{l.retryCount}</span>}
                          {l.errorMessage && <span className="text-red-500 truncate max-w-40">{l.errorMessage}</span>}
                          <span className="ml-auto text-[var(--gray-400)]">{new Date(l.createdAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const LOG_STATUS_STYLES: Record<string, string> = {
  success: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  retry_pending: "bg-orange-100 text-orange-700",
  final_failed: "bg-red-100 text-red-700",
};

function LogStatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${LOG_STATUS_STYLES[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
