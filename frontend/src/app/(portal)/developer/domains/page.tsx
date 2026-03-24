"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/providers/language-provider";
import { domainService, type DomainEntry } from "@/services/domainService";
import {
  PlusIcon,
  TrashIcon,
  GlobeAltIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

export default function DomainsPage() {
  const { t } = useI18n();
  const [domains, setDomains] = useState<DomainEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const fetchDomains = useCallback(() => {
    setLoading(true);
    domainService.list()
      .then(setDomains)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDomains(); }, [fetchDomains]);

  const handleAdd = async () => {
    if (!newDomain.trim()) return;
    setAdding(true);
    setError("");
    try {
      await domainService.add(newDomain.trim());
      setNewDomain("");
      fetchDomains();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "添加失败");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm(t("domains.remove.confirm"))) return;
    await domainService.remove(id);
    fetchDomains();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("domains.title")}</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">{t("domains.subtitle")}</p>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <InformationCircleIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">{t("domains.info")}</p>
      </div>

      {/* Add domain */}
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-5">
        <div className="flex gap-3">
          <input
            type="text" value={newDomain} onChange={(e) => { setNewDomain(e.target.value); setError(""); }}
            placeholder={t("domains.add.placeholder")}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 border border-[var(--gray-300)] rounded-lg px-3 py-2.5 text-sm font-mono placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button onClick={handleAdd} disabled={adding || !newDomain.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
            <PlusIcon className="w-4 h-4" />
            {adding ? t("domains.adding") : t("domains.add")}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {/* Domain list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-[var(--gray-200)] p-4 animate-pulse">
              <div className="h-4 bg-[var(--gray-200)] rounded w-64" />
            </div>
          ))}
        </div>
      ) : domains.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-12 text-center">
          <GlobeAltIcon className="w-10 h-10 text-[var(--gray-300)] mx-auto mb-3" />
          <p className="text-sm text-[var(--gray-500)]">{t("domains.empty")}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm divide-y divide-[var(--gray-100)]">
          {domains.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <GlobeAltIcon className="w-4 h-4 text-[var(--gray-400)] shrink-0" />
                <span className="text-sm font-mono text-[var(--gray-900)] truncate">{d.domain}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs text-[var(--gray-400)]">{new Date(d.createdAt).toLocaleString("zh-CN")}</span>
                <button onClick={() => handleRemove(d.id)} title={t("domains.remove")}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-[var(--gray-400)] hover:text-red-600">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
