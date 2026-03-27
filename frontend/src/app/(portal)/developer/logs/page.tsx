"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useI18n } from "@/providers/language-provider";
import { useEnvironment } from "@/providers/environment-provider";
import { logService, type ApiLogEntry } from "@/services/logService";
import {
  ClipboardDocumentListIcon,
  XMarkIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Select } from "@/components/ui/select";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  PUT: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-700",
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

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
  const { environment } = useEnvironment();
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ApiLogEntry | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [filterPath, setFilterPath] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchLogs = useCallback(() => {
    logService.getPage(page, pageSize)
      .then((res) => { setLogs(res.list); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, pageSize, environment]);

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

  const METHODS = ["GET", "POST", "PUT", "DELETE"];

  const filteredLogs = logs.filter((log) => {
    if (filterPath && !log.path.toLowerCase().includes(filterPath.toLowerCase())) return false;
    if (filterMethod && log.method !== filterMethod) return false;
    if (filterStatus === "2xx" && (log.statusCode < 200 || log.statusCode >= 300)) return false;
    if (filterStatus === "4xx" && (log.statusCode < 400 || log.statusCode >= 500)) return false;
    if (filterStatus === "5xx" && log.statusCode < 500) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const goToPage = (p: number) => {
    const clamped = Math.max(1, Math.min(p, totalPages));
    setPage(clamped);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon className="w-4 h-4 text-[var(--gray-400)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text" value={filterPath} onChange={(e) => setFilterPath(e.target.value)}
            placeholder={t("logs.filter.search")}
            className="w-full border border-[var(--gray-300)] rounded-lg pl-9 pr-3 py-2 text-sm font-mono placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <Select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}>
          <option value="">{t("logs.filter.allMethods")}</option>
          {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">{t("logs.filter.allStatus")}</option>
          <option value="2xx">{t("logs.filter.2xx")}</option>
          <option value="4xx">{t("logs.filter.4xx")}</option>
          <option value="5xx">{t("logs.filter.5xx")}</option>
        </Select>
      </div>

      {/* Log table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] p-8 animate-pulse">
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-[var(--gray-100)] rounded" />)}</div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-12 text-center">
          <ClipboardDocumentListIcon className="w-10 h-10 text-[var(--gray-300)] mx-auto mb-3" />
          <p className="text-sm text-[var(--gray-500)]">{t("logs.empty")}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--gray-100)]">
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">{t("logs.table.method")}</th>
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">{t("logs.table.path")}</th>
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">{t("logs.table.status")}</th>
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">{t("logs.table.duration")}</th>
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">{t("logs.table.time")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
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
                  <td className="py-3 px-5 text-[var(--gray-400)] text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {total > 0 && (
            <div className="px-5 py-4 border-t border-[var(--gray-100)] flex items-center justify-between text-sm flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <span className="text-[var(--gray-500)]">{t("logs.total", { count: total })}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--gray-500)]">{t("logs.perPage")}</span>
                  <Select value={pageSize} onChange={(e) => handlePageSizeChange(Number(e.target.value))} selectSize="sm">
                    {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button onClick={() => goToPage(1)} disabled={page <= 1}
                  className="px-2 py-1.5 rounded border border-[var(--gray-300)] text-xs disabled:opacity-30 hover:bg-[var(--gray-50)]">
                  1
                </button>
                <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
                  className="p-1.5 rounded border border-[var(--gray-300)] disabled:opacity-30 hover:bg-[var(--gray-50)]">
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  <input type="number" min={1} max={totalPages} value={page}
                    onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) goToPage(v); }}
                    className="w-12 text-center border border-[var(--gray-300)] rounded-lg py-1.5 text-sm text-[var(--gray-700)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[var(--gray-400)]">/</span>
                  <span className="text-[var(--gray-700)]">{totalPages}</span>
                </div>
                <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
                  className="p-1.5 rounded border border-[var(--gray-300)] disabled:opacity-30 hover:bg-[var(--gray-50)]">
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
                <button onClick={() => goToPage(totalPages)} disabled={page >= totalPages}
                  className="px-2 py-1.5 rounded border border-[var(--gray-300)] text-xs disabled:opacity-30 hover:bg-[var(--gray-50)]">
                  {totalPages}
                </button>
              </div>
            </div>
          )}
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
                <p className="text-sm text-[var(--gray-400)] text-center py-4">{t("logs.noBody")}</p>
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
