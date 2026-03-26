"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/providers/language-provider";
import { accountService, type ProfileData } from "@/services/accountService";
import { Toast } from "@/components/ui/toast";
import {
  BuildingOfficeIcon,
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  CalendarIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

const ROLE_LABELS: Record<string, { en: string; zh: string }> = {
  ADMIN: { en: "Admin", zh: "管理员" },
  BUSINESS: { en: "Business", zh: "业务" },
  TECH: { en: "Tech", zh: "技术" },
};

export default function SettingsPage() {
  const { t, locale } = useI18n();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchProfile = useCallback(() => {
    setLoading(true);
    accountService.getProfile()
      .then((data) => {
        setProfile(data);
        setEditName(data.contactName);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const updated = await accountService.updateProfile({ contactName: trimmed });
      setProfile(updated);
      setEditing(false);
      setToast({ type: "success", message: t("settings.profile.saved") });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.operationFailed");
      setToast({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) setEditName(profile.contactName);
  };

  if (loading) return <LoadingSkeleton />;
  if (!profile) return null;

  const roleLabel = ROLE_LABELS[profile.role]?.[locale === "zh" ? "zh" : "en"] || profile.role;
  const createdDate = new Date(profile.createdAt).toLocaleDateString(
    locale === "zh" ? "zh-CN" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("settings.title")}</h1>
        <p className="text-sm text-[var(--gray-500)] mt-1">{t("settings.subtitle")}</p>
      </div>

      {/* Company Info — read only */}
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm">
        <div className="p-6 border-b border-[var(--gray-100)]">
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="w-5 h-5 text-[var(--gray-500)]" />
            <h2 className="text-lg font-semibold text-[var(--gray-900)]">{t("settings.company.title")}</h2>
          </div>
          <p className="text-xs text-[var(--gray-500)] mt-1">{t("settings.company.desc")}</p>
        </div>
        <div className="p-6">
          <InfoRow label={t("settings.company.name")} value={profile.companyName} />
        </div>
      </div>

      {/* Personal Info — contact name editable */}
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm">
        <div className="p-6 border-b border-[var(--gray-100)]">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-[var(--gray-500)]" />
            <h2 className="text-lg font-semibold text-[var(--gray-900)]">{t("settings.personal.title")}</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {/* Contact Name — editable, same left-right layout as other rows */}
          <div className="flex items-center justify-between py-3 border-b border-[var(--gray-100)]">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-[var(--gray-400)]" />
              <span className="text-sm text-[var(--gray-500)]">{t("settings.personal.contactName")}</span>
            </div>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
                  maxLength={100}
                  className="px-3 py-1.5 border border-[var(--gray-300)] rounded-lg text-sm text-[var(--gray-900)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  disabled={saving || !editName.trim() || editName.trim() === profile.contactName}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[var(--primary-black)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? t("common.saving") : t("common.save")}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--gray-700)] border border-[var(--gray-200)] rounded-lg hover:bg-[var(--gray-50)] transition-colors"
                >
                  {t("common.cancel")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--gray-900)]">{profile.contactName}</span>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--gray-500)] hover:text-[var(--gray-700)] hover:bg-[var(--gray-50)] rounded-md font-medium transition-colors"
                >
                  <PencilIcon className="w-3 h-3" />
                  {t("settings.personal.edit")}
                </button>
              </div>
            )}
          </div>

          {/* Email — read only */}
          <InfoRow label={t("settings.personal.email")} value={profile.email} icon={EnvelopeIcon} />

          {/* Role — read only */}
          <InfoRow label={t("settings.personal.role")} value={roleLabel} icon={ShieldCheckIcon} />

          {/* Created at — read only */}
          <InfoRow label={t("settings.personal.createdAt")} value={createdDate} icon={CalendarIcon} noBorder />
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}

function InfoRow({ label, value, icon: Icon, noBorder }: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  noBorder?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-3 ${noBorder ? "" : "border-b border-[var(--gray-100)]"}`}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-[var(--gray-400)]" />}
        <span className="text-sm text-[var(--gray-500)]">{label}</span>
      </div>
      <span className="text-sm font-medium text-[var(--gray-900)]">{value}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-7 bg-[var(--gray-200)] rounded w-40 mb-2 animate-pulse" />
        <div className="h-4 bg-[var(--gray-100)] rounded w-64 animate-pulse" />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-[var(--gray-200)] p-6 animate-pulse">
          <div className="h-5 bg-[var(--gray-200)] rounded w-32 mb-4" />
          <div className="space-y-4">
            <div className="h-4 bg-[var(--gray-100)] rounded w-48" />
            <div className="h-4 bg-[var(--gray-100)] rounded w-56" />
          </div>
        </div>
      ))}
    </div>
  );
}
