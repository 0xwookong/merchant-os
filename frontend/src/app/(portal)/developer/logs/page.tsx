"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useI18n } from "@/providers/language-provider";
import { logService, type ApiLogEntry } from "@/services/logService";
import {
  ClipboardDocumentListIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  PUT: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-700",
};

function statusColor(code: number): string {
  if (code >= 200 && code < 300) return "text-green-600";
  if (code >= 400 && code < 500) return "text-yellow-600";
  return "text-red-600";
}

function tryFormatJson(str: string | null): string {
  if (!str) return "";
  try { return JSON.stringify(JSON.parse(str), null, 2); } catch { return str; }
}

export default function LogsPage() {
  const { t } = useI18n();
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ApiLogEntry | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = useCallback(() => {
    logService.getLatest()
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchLogs();
    intervalRef.current = setInterval(fetchLogs, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchLogs]);

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedLog(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("logs.title")}</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">{t("logs.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--gray-400)]">
          <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
          {t("logs.autoRefresh")}
        </div>
      </div>

      {/* Log table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] p-8 animate-pulse">
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-[var(--gray-100)] rounded" />)}</div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-12 text-center">
          <ClipboardDocumentListIcon className="w-10 h-10 text-[var(--gray-300)] mx-auto mb-3" />
          <p className="text-sm text-[var(--gray-500)]">{t("logs.empty")}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--gray-100)]">
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">Method</th>
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">Path</th>
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">Status</th>
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">Duration</th>
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} onClick={() => setSelectedLog(log)}
                  className="border-b border-[var(--gray-50)] hover:bg-[var(--gray-50)] cursor-pointer transition-colors">
                  <td className="py-3 px-5">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${METHOD_COLORS[log.method] || "bg-gray-100 text-gray-600"}`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="py-3 px-5 font-mono text-[var(--gray-700)] text-xs truncate max-w-64">{log.path}</td>
                  <td className={`py-3 px-5 font-mono font-semibold ${statusColor(log.statusCode)}`}>{log.statusCode}</td>
                  <td className="py-3 px-5 text-[var(--gray-500)] text-xs">{log.durationMs}ms</td>
                  <td className="py-3 px-5 text-[var(--gray-400)] text-xs">{new Date(log.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => setSelectedLog(null)} role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[var(--gray-100)]">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${METHOD_COLORS[selectedLog.method] || ""}`}>
                  {selectedLog.method}
                </span>
                <span className="text-sm font-mono text-[var(--gray-900)]">{selectedLog.path}</span>
                <span className={`font-mono font-semibold text-sm ${statusColor(selectedLog.statusCode)}`}>{selectedLog.statusCode}</span>
                <span className="text-xs text-[var(--gray-400)]">{selectedLog.durationMs}ms</span>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1 rounded hover:bg-[var(--gray-100)] transition-colors">
                <XMarkIcon className="w-5 h-5 text-[var(--gray-500)]" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {selectedLog.requestBody && (
                <div>
                  <h4 className="text-xs font-semibold text-[var(--gray-700)] mb-2">{t("logs.detail.request")}</h4>
                  <pre className="text-xs font-mono bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto text-[var(--gray-700)]">
                    {tryFormatJson(selectedLog.requestBody)}
                  </pre>
                </div>
              )}
              {selectedLog.responseBody && (
                <div>
                  <h4 className="text-xs font-semibold text-[var(--gray-700)] mb-2">{t("logs.detail.response")}</h4>
                  <pre className="text-xs font-mono bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto text-[var(--gray-700)]">
                    {tryFormatJson(selectedLog.responseBody)}
                  </pre>
                </div>
              )}
              {!selectedLog.requestBody && !selectedLog.responseBody && (
                <p className="text-sm text-[var(--gray-400)] text-center py-4">No body data</p>
              )}
            </div>
            <div className="p-5 border-t border-[var(--gray-100)] flex justify-end">
              <button onClick={() => setSelectedLog(null)}
                className="px-4 py-2 border border-[var(--gray-300)] rounded-lg text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)]">
                {t("logs.detail.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
