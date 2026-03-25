"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/providers/language-provider";
import { useAuth } from "@/providers/auth-provider";
import { memberService, type MemberInfo } from "@/services/memberService";
import {
  PlusIcon,
  TrashIcon,
  UsersIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";

const ROLES = [
  { key: "ADMIN", icon: ShieldCheckIcon, color: "bg-purple-100 text-purple-700" },
  { key: "BUSINESS", icon: BriefcaseIcon, color: "bg-blue-100 text-blue-700" },
  { key: "TECH", icon: CodeBracketIcon, color: "bg-green-100 text-green-700" },
] as const;

export default function MembersPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("TECH");
  const [contactName, setContactName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMembers = useCallback(() => {
    setLoading(true);
    memberService.list().then(setMembers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleInvite = async () => {
    setInviteLoading(true);
    setError("");
    try {
      await memberService.invite({ email, role, contactName: contactName || undefined });
      setShowInvite(false);
      setEmail("");
      setRole("TECH");
      setContactName("");
      fetchMembers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "邀请失败");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm(t("members.remove.confirm"))) return;
    try {
      await memberService.remove(id);
      fetchMembers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "操作失败");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--gray-900)]">{t("members.title")}</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">{t("members.subtitle")}</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <PlusIcon className="w-4 h-4" />
          {t("members.invite")}
        </button>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROLES.map((r) => (
          <div key={r.key} className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${r.color}`}>
              <r.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--gray-900)]">{t(`members.role.${r.key}`)}</div>
              <div className="text-xs text-[var(--gray-500)]">{t(`members.role.${r.key}.desc`)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-[var(--gray-900)]">{t("members.invite")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">{t("members.invite.email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={t("members.invite.email.placeholder")}
                className="w-full border border-[var(--gray-300)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">{t("members.invite.name")}</label>
              <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)}
                placeholder={t("members.invite.name.placeholder")}
                className="w-full border border-[var(--gray-300)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1.5">{t("members.invite.role")}</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className="w-full border border-[var(--gray-300)] rounded-lg px-3 py-2.5 text-sm">
                <option value="ADMIN">{t("members.role.ADMIN")}</option>
                <option value="BUSINESS">{t("members.role.BUSINESS")}</option>
                <option value="TECH">{t("members.role.TECH")}</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button onClick={handleInvite} disabled={inviteLoading || !email}
              className="px-5 py-2.5 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
              {inviteLoading ? t("members.invite.submitting") : t("members.invite.submit")}
            </button>
            <button onClick={() => { setShowInvite(false); setError(""); }}
              className="px-5 py-2.5 border border-[var(--gray-300)] rounded-lg text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)]">
              {t("members.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Member list */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6 animate-pulse">
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-12 bg-[var(--gray-100)] rounded" />)}</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--gray-100)]">
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">Name</th>
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">Email</th>
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">Role</th>
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">Status</th>
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">Joined</th>
                <th className="text-right py-3 px-5 font-semibold text-[var(--gray-900)]"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-[var(--gray-50)] hover:bg-[var(--gray-50)] transition-colors">
                  <td className="py-3 px-5 text-[var(--gray-900)]">{m.contactName}</td>
                  <td className="py-3 px-5 text-[var(--gray-600)]">{m.email}</td>
                  <td className="py-3 px-5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      ROLES.find(r => r.key === m.role)?.color || "bg-gray-100 text-gray-600"
                    }`}>
                      {t(`members.role.${m.role}`)}
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      m.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {t(`members.status.${m.status}`)}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-[var(--gray-400)] text-xs">{new Date(m.createdAt).toLocaleDateString("zh-CN")}</td>
                  <td className="py-3 px-5 text-right">
                    {m.id !== user?.userId && (
                      <button onClick={() => handleRemove(m.id)} title={t("members.remove")}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-[var(--gray-400)] hover:text-red-600">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
