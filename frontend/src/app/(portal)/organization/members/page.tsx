"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useI18n } from "@/providers/language-provider";
import { useAuth } from "@/providers/auth-provider";
import { memberService, type MemberInfo } from "@/services/memberService";
import { securityService } from "@/services/securityService";
import {
  PlusIcon,
  EnvelopeIcon,
  UserIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  CodeBracketIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";

const ROLES = [
  { key: "ADMIN", icon: ShieldCheckIcon, color: "bg-purple-100 text-purple-700" },
  { key: "BUSINESS", icon: BriefcaseIcon, color: "bg-blue-100 text-blue-700" },
  { key: "TECH", icon: CodeBracketIcon, color: "bg-green-100 text-green-700" },
] as const;

const INVITE_EXPIRE_DAYS = 7;

type ConfirmAction = { type: "resend"; member: MemberInfo } | null;

/** Compute effective status: ACTIVE, PENDING, or EXPIRED */
function getEffectiveStatus(m: MemberInfo): "ACTIVE" | "PENDING" | "EXPIRED" {
  if (m.status === "ACTIVE") return "ACTIVE";
  const daysSince = Math.floor((Date.now() - new Date(m.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  return daysSince >= INVITE_EXPIRE_DAYS ? "EXPIRED" : "PENDING";
}

/** Format date as YYYY-MM-DD */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Days since a date */
function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

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
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<MemberInfo | null>(null);
  const [resetOtpTarget, setResetOtpTarget] = useState<MemberInfo | null>(null);
  const [removeTarget, setRemoveTarget] = useState<MemberInfo | null>(null);

  const fetchMembers = useCallback(() => {
    setLoading(true);
    memberService.list().then(setMembers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

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
      setToast({ type: "success", message: t("members.invite.success") });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("members.invite.error"));
    } finally {
      setInviteLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      setResendingId(confirmAction.member.id);
      await memberService.resendInvite(confirmAction.member.id);
      setToast({ type: "success", message: t("members.resend.success") });
    } catch (err: unknown) {
      setToast({ type: "error", message: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setConfirmLoading(false);
      setResendingId(null);
      setConfirmAction(null);
    }
  };

  const isMe = (m: MemberInfo) => m.id === user?.userId;

  return (
    <div className="space-y-8">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

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
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--gray-100)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PaperAirplaneIcon className="w-5 h-5 text-[var(--gray-400)]" />
              <h3 className="font-semibold text-[var(--gray-900)]">{t("members.invite")}</h3>
            </div>
            <button onClick={() => { setShowInvite(false); setError(""); }}
              className="p-1 rounded-md hover:bg-[var(--gray-100)] transition-colors text-[var(--gray-400)] hover:text-[var(--gray-600)]">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)] mb-2">
                  {t("members.invite.email")}
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray-400)]" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("members.invite.email.placeholder")}
                    className="w-full border border-[var(--gray-300)] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)] mb-2">
                  {t("members.invite.name")}
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray-400)]" />
                  <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)}
                    placeholder={t("members.invite.name.placeholder")}
                    className="w-full border border-[var(--gray-300)] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)] mb-2">
                  {t("members.invite.role")}
                </label>
                <div className="relative">
                  <ShieldCheckIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray-400)]" />
                  <select value={role} onChange={(e) => setRole(e.target.value)}
                    className="w-full appearance-none border border-[var(--gray-300)] rounded-lg pl-9 pr-9 py-2.5 text-sm text-[var(--gray-900)] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="ADMIN">{t("members.role.ADMIN")}</option>
                    <option value="BUSINESS">{t("members.role.BUSINESS")}</option>
                    <option value="TECH">{t("members.role.TECH")}</option>
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray-400)] pointer-events-none" />
                </div>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleInvite} disabled={inviteLoading || !email}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                <PaperAirplaneIcon className="w-4 h-4" />
                {inviteLoading ? t("members.invite.submitting") : t("members.invite.submit")}
              </button>
              <button onClick={() => { setShowInvite(false); setError(""); }}
                className="px-5 py-2.5 border border-[var(--gray-300)] rounded-lg text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition-colors">
                {t("members.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member list */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6 animate-pulse">
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-12 bg-[var(--gray-100)] rounded" />)}</div>
        </div>
      ) : members.length <= 1 ? (
        /* Empty state — only the admin themselves */
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-[var(--gray-100)] flex items-center justify-center mb-4">
            <UserPlusIcon className="w-7 h-7 text-[var(--gray-400)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--gray-900)]">{t("members.empty.title")}</h3>
          <p className="text-sm text-[var(--gray-500)] mt-1 max-w-sm mx-auto">{t("members.empty.desc")}</p>
          <button
            onClick={() => setShowInvite(true)}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-4 h-4" />
            {t("members.invite")}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--gray-100)]">
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">{t("members.col.name")}</th>
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">{t("members.col.email")}</th>
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">{t("members.col.role")}</th>
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">{t("members.col.status")}</th>
                <th className="text-left py-3 px-5 font-semibold text-[var(--gray-900)]">{t("members.col.joined")}</th>
                <th className="text-right py-3 px-5 font-semibold text-[var(--gray-900)]">{t("members.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const effectiveStatus = getEffectiveStatus(m);
                const isSelf = isMe(m);
                return (
                  <tr key={m.id} className={`border-b border-[var(--gray-50)] hover:bg-[var(--gray-50)] transition-colors ${isSelf ? "bg-blue-50/30" : ""}`}>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[var(--gray-900)]">{m.contactName}</span>
                        {isSelf && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">{t("members.you")}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-5 text-[var(--gray-600)]">{m.email}</td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        ROLES.find(r => r.key === m.role)?.color || "bg-gray-100 text-gray-600"
                      }`}>
                        {t(`members.role.${m.role}`)}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <StatusBadge status={effectiveStatus} createdAt={m.createdAt} t={t} />
                    </td>
                    <td className="py-3 px-5 text-[var(--gray-500)] text-xs font-mono">{formatDate(m.createdAt)}</td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(effectiveStatus === "PENDING" || effectiveStatus === "EXPIRED") && (
                          <button
                            onClick={() => setConfirmAction({ type: "resend", member: m })}
                            disabled={resendingId === m.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {resendingId === m.id ? t("members.resend.sending") : t("members.resend")}
                          </button>
                        )}
                        {!isSelf && effectiveStatus === "ACTIVE" && (
                          <button onClick={() => setRoleChangeTarget(m)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--gray-600)] hover:bg-[var(--gray-100)] transition-colors">
                            {t("members.changeRole")}
                          </button>
                        )}
                        {!isSelf && m.otpEnabled && (
                          <button onClick={() => setResetOtpTarget(m)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            {t("members.resetOtp")}
                          </button>
                        )}
                        {!isSelf && (
                          <button onClick={() => setRemoveTarget(m)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                            {t("members.remove")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        loading={confirmLoading}
        type="resend"
        memberName={confirmAction?.member.contactName || ""}
        memberEmail={confirmAction?.member.email || ""}
        t={t}
      />

      <RoleChangeDialog
        open={roleChangeTarget !== null}
        member={roleChangeTarget}
        onClose={() => setRoleChangeTarget(null)}
        onSuccess={() => { setRoleChangeTarget(null); fetchMembers(); }}
        setToast={setToast}
        t={t}
      />

      <ResetOtpDialog
        open={resetOtpTarget !== null}
        member={resetOtpTarget}
        onClose={() => setResetOtpTarget(null)}
        onSuccess={() => { setResetOtpTarget(null); fetchMembers(); }}
        setToast={setToast}
        t={t}
      />

      <VerifiedActionDialog
        open={removeTarget !== null}
        member={removeTarget}
        onClose={() => setRemoveTarget(null)}
        onSuccess={() => { setRemoveTarget(null); fetchMembers(); }}
        setToast={setToast}
        t={t}
        variant="remove"
      />
    </div>
  );
}

// ===== Sub-components =====

function StatusBadge({ status, createdAt, t }: { status: "ACTIVE" | "PENDING" | "EXPIRED"; createdAt: string; t: (key: string) => string }) {
  if (status === "ACTIVE") {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        {t("members.status.ACTIVE")}
      </span>
    );
  }

  if (status === "EXPIRED") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          {t("members.status.EXPIRED")}
        </span>
      </div>
    );
  }

  // PENDING — show "Sent X days ago"
  const days = daysSince(createdAt);
  return (
    <div className="flex items-center gap-1.5">
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        {t("members.status.PENDING")}
      </span>
      <span className="text-[10px] text-[var(--gray-400)] flex items-center gap-0.5">
        <ClockIcon className="w-3 h-3" />
        {days === 0
          ? t("members.invited.today")
          : t("members.invited.daysAgo").replace("{days}", String(days))}
      </span>
    </div>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, loading, type, memberName, memberEmail, t }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  type: "remove" | "resend";
  memberName: string;
  memberEmail: string;
  t: (key: string) => string;
}) {
  const isRemove = type === "remove";

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-5 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          aria-describedby="confirm-desc"
        >
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
            isRemove ? "bg-red-100" : "bg-blue-100"
          }`}>
            {isRemove
              ? <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              : <PaperAirplaneIcon className="w-6 h-6 text-blue-600" />}
          </div>

          <div className="text-center">
            <Dialog.Title className="text-lg font-semibold text-[var(--gray-900)]">
              {isRemove ? t("members.remove.dialog.title") : t("members.resend.dialog.title")}
            </Dialog.Title>
            <p id="confirm-desc" className="text-sm text-[var(--gray-500)] mt-2">
              {isRemove ? t("members.remove.dialog.desc") : t("members.resend.dialog.desc")}
            </p>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--gray-50)] border border-[var(--gray-100)]">
            <div className="w-9 h-9 rounded-full bg-[var(--gray-200)] flex items-center justify-center text-sm font-semibold text-[var(--gray-600)]">
              {memberName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--gray-900)] truncate">{memberName}</div>
              <div className="text-xs text-[var(--gray-500)] truncate">{memberEmail}</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-[var(--gray-300)] rounded-lg text-sm font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition-colors disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
                isRemove ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading
                ? t("common.loading")
                : isRemove ? t("members.remove.dialog.confirm") : t("members.resend.dialog.confirm")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ResetOtpDialog({ open, member, onClose, onSuccess, setToast, t }: {
  open: boolean;
  member: MemberInfo | null;
  onClose: () => void;
  onSuccess: () => void;
  setToast: (toast: { type: "success" | "error"; message: string }) => void;
  t: (key: string) => string;
}) {
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  useEffect(() => {
    if (open) {
      setCode("");
      setError("");
      setCodeSent(false);
      securityService.getOtpStatus().then((s) => setOtpEnabled(s.otpEnabled)).catch(() => {});
    }
  }, [open]);

  const handleSendCode = async () => {
    setSendingCode(true);
    try {
      await securityService.sendEmailCode();
      setCodeSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async () => {
    if (!member) return;
    setLoading(true);
    setError("");
    try {
      await memberService.resetOtp(member.id, otpEnabled ? { otpCode: code } : { emailCode: code });
      setToast({ type: "success", message: t("members.resetOtp.success") });
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-5"
          aria-describedby="reset-otp-desc"
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
          </div>

          <div className="text-center">
            <Dialog.Title className="text-lg font-semibold text-[var(--gray-900)]">{t("members.resetOtp")}</Dialog.Title>
            <p id="reset-otp-desc" className="text-sm text-[var(--gray-500)] mt-2">{t("members.resetOtp.desc")}</p>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--gray-50)] border border-[var(--gray-100)]">
            <div className="w-9 h-9 rounded-full bg-[var(--gray-200)] flex items-center justify-center text-sm font-semibold text-[var(--gray-600)]">
              {member?.contactName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--gray-900)] truncate">{member?.contactName}</div>
              <div className="text-xs text-[var(--gray-500)] truncate">{member?.email}</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)] mb-2">
              {otpEnabled ? t("members.changeRole.otpCode") : t("members.changeRole.emailCode")}
            </label>
            {!otpEnabled && !codeSent && (
              <button onClick={handleSendCode} disabled={sendingCode}
                className="mb-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50">
                {sendingCode ? t("members.changeRole.sendingCode") : t("members.changeRole.sendCode")}
              </button>
            )}
            {!otpEnabled && codeSent && (
              <p className="mb-2 text-xs text-green-600">{t("members.changeRole.codeSent")}</p>
            )}
            <input type="text" value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              placeholder="000000" maxLength={6}
              className="w-full text-center text-xl font-mono tracking-[0.4em] border border-[var(--gray-300)] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} disabled={loading}
              className="flex-1 px-4 py-2.5 border border-[var(--gray-300)] rounded-lg text-sm font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)]">
              {t("common.cancel")}
            </button>
            <button onClick={handleSubmit} disabled={loading || code.length !== 6}
              className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? t("common.loading") : t("members.resetOtp.confirm")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function RoleChangeDialog({ open, member, onClose, onSuccess, setToast, t }: {
  open: boolean;
  member: MemberInfo | null;
  onClose: () => void;
  onSuccess: () => void;
  setToast: (toast: { type: "success" | "error"; message: string }) => void;
  t: (key: string) => string;
}) {
  const [newRole, setNewRole] = useState("");
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  useEffect(() => {
    if (open && member) {
      setNewRole(member.role);
      setCode("");
      setError("");
      setCodeSent(false);
      securityService.getOtpStatus().then((s) => setOtpEnabled(s.otpEnabled)).catch(() => {});
    }
  }, [open, member]);

  const handleSendCode = async () => {
    setSendingCode(true);
    try {
      await securityService.sendEmailCode();
      setCodeSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async () => {
    if (!member || newRole === member.role) return;
    setLoading(true);
    setError("");
    try {
      await memberService.changeRole(member.id, {
        role: newRole,
        ...(otpEnabled ? { otpCode: code } : { emailCode: code }),
      });
      setToast({ type: "success", message: t("members.changeRole.success") });
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden"
          aria-describedby="role-change-desc"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--gray-100)]">
            <div className="flex items-center gap-2">
              <ArrowsRightLeftIcon className="w-5 h-5 text-[var(--gray-400)]" />
              <Dialog.Title className="font-semibold text-[var(--gray-900)]">{t("members.changeRole.title")}</Dialog.Title>
            </div>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--gray-100)] text-[var(--gray-400)]">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Member info */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--gray-50)] border border-[var(--gray-100)]">
              <div className="w-9 h-9 rounded-full bg-[var(--gray-200)] flex items-center justify-center text-sm font-semibold text-[var(--gray-600)]">
                {member?.contactName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-[var(--gray-900)] truncate">{member?.contactName}</div>
                <div className="text-xs text-[var(--gray-500)] truncate">{member?.email}</div>
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)] mb-2">{t("members.changeRole.newRole")}</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button key={r.key} onClick={() => setNewRole(r.key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center ${
                      newRole === r.key
                        ? "border-[var(--primary-black)] bg-[var(--gray-50)]"
                        : "border-[var(--gray-200)] hover:border-[var(--gray-300)]"
                    }`}>
                    <r.icon className={`w-5 h-5 ${newRole === r.key ? "text-[var(--gray-900)]" : "text-[var(--gray-400)]"}`} />
                    <span className={`text-xs font-medium ${newRole === r.key ? "text-[var(--gray-900)]" : "text-[var(--gray-600)]"}`}>
                      {t(`members.role.${r.key}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Verification */}
            {newRole !== member?.role && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)] mb-2">
                  {otpEnabled ? t("members.changeRole.otpCode") : t("members.changeRole.emailCode")}
                </label>
                {!otpEnabled && !codeSent && (
                  <button onClick={handleSendCode} disabled={sendingCode}
                    className="mb-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50">
                    {sendingCode ? t("members.changeRole.sendingCode") : t("members.changeRole.sendCode")}
                  </button>
                )}
                {!otpEnabled && codeSent && (
                  <p className="mb-2 text-xs text-green-600">{t("members.changeRole.codeSent")}</p>
                )}
                <input
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full text-center text-xl font-mono tracking-[0.4em] border border-[var(--gray-300)] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <p id="role-change-desc" className="text-xs text-[var(--gray-400)]">{t("members.changeRole.desc")}</p>

            <div className="flex gap-3">
              <button onClick={onClose} disabled={loading}
                className="flex-1 px-4 py-2.5 border border-[var(--gray-300)] rounded-lg text-sm font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)]">
                {t("common.cancel")}
              </button>
              <button onClick={handleSubmit}
                disabled={loading || newRole === member?.role || code.length !== 6}
                className="flex-1 px-4 py-2.5 bg-[var(--primary-black)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                {loading ? t("common.loading") : t("members.changeRole.confirm")}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function VerifiedActionDialog({ open, member, onClose, onSuccess, setToast, t, variant }: {
  open: boolean;
  member: MemberInfo | null;
  onClose: () => void;
  onSuccess: () => void;
  setToast: (toast: { type: "success" | "error"; message: string }) => void;
  t: (key: string) => string;
  variant: "remove";
}) {
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  useEffect(() => {
    if (open) {
      setCode("");
      setError("");
      setCodeSent(false);
      securityService.getOtpStatus().then((s) => setOtpEnabled(s.otpEnabled)).catch(() => {});
    }
  }, [open]);

  const handleSendCode = async () => {
    setSendingCode(true);
    try {
      await securityService.sendEmailCode();
      setCodeSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async () => {
    if (!member) return;
    setLoading(true);
    setError("");
    try {
      const verifyData = otpEnabled ? { otpCode: code } : { emailCode: code };
      if (variant === "remove") {
        await memberService.remove(member.id, verifyData);
        setToast({ type: "success", message: t("members.remove.success") });
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const config = {
    remove: {
      icon: <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />,
      iconBg: "bg-red-100",
      title: t("members.remove.dialog.title"),
      desc: t("members.remove.dialog.desc"),
      confirmLabel: t("members.remove.dialog.confirm"),
      confirmClass: "bg-red-600 hover:bg-red-700",
    },
  }[variant];

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-5"
          aria-describedby="verified-action-desc"
        >
          <div className={`mx-auto w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center`}>
            {config.icon}
          </div>

          <div className="text-center">
            <Dialog.Title className="text-lg font-semibold text-[var(--gray-900)]">{config.title}</Dialog.Title>
            <p id="verified-action-desc" className="text-sm text-[var(--gray-500)] mt-2">{config.desc}</p>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--gray-50)] border border-[var(--gray-100)]">
            <div className="w-9 h-9 rounded-full bg-[var(--gray-200)] flex items-center justify-center text-sm font-semibold text-[var(--gray-600)]">
              {member?.contactName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--gray-900)] truncate">{member?.contactName}</div>
              <div className="text-xs text-[var(--gray-500)] truncate">{member?.email}</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--gray-500)] mb-2">
              {otpEnabled ? t("members.changeRole.otpCode") : t("members.changeRole.emailCode")}
            </label>
            {!otpEnabled && !codeSent && (
              <button onClick={handleSendCode} disabled={sendingCode}
                className="mb-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50">
                {sendingCode ? t("members.changeRole.sendingCode") : t("members.changeRole.sendCode")}
              </button>
            )}
            {!otpEnabled && codeSent && (
              <p className="mb-2 text-xs text-green-600">{t("members.changeRole.codeSent")}</p>
            )}
            <input type="text" value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              placeholder="000000" maxLength={6}
              className="w-full text-center text-xl font-mono tracking-[0.4em] border border-[var(--gray-300)] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} disabled={loading}
              className="flex-1 px-4 py-2.5 border border-[var(--gray-300)] rounded-lg text-sm font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)]">
              {t("common.cancel")}
            </button>
            <button onClick={handleSubmit} disabled={loading || code.length !== 6}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${config.confirmClass}`}>
              {loading ? t("common.loading") : config.confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  return (
    <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg border animate-in slide-in-from-right-5 fade-in-0 ${
      type === "success"
        ? "bg-white border-green-200 text-green-700"
        : "bg-white border-red-200 text-red-700"
    }`}>
      {type === "success"
        ? <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />
        : <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="p-0.5 rounded hover:bg-[var(--gray-100)] transition-colors ml-2">
        <XMarkIcon className="w-4 h-4 text-[var(--gray-400)]" />
      </button>
    </div>
  );
}
