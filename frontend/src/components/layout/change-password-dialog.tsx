"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  XMarkIcon,
  LockClosedIcon,
  KeyIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { authService } from "@/services/authService";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/providers/language-provider";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangePasswordDialog({ open, onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const reset = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(t("changePassword.allFieldsRequired"));
      return;
    }
    if (newPassword.length < 8) {
      setError(t("changePassword.minLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("changePassword.mismatch"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.changePassword({ oldPassword, newPassword, confirmPassword });
      reset();
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-6 w-full max-w-md z-50"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-[var(--gray-900)]">
              {t("changePassword.title")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded-md hover:bg-[var(--gray-100)] transition-colors" aria-label={t("changePassword.close")}>
                <XMarkIcon className="w-5 h-5 text-[var(--gray-500)]" />
              </button>
            </Dialog.Close>
          </div>

          {error && (
            <div className="mb-4 bg-[var(--error-soft)] border border-red-200 rounded-lg px-4 py-3 text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordField
              id="oldPassword"
              label={t("changePassword.oldPassword")}
              value={oldPassword}
              onChange={(v) => { setOldPassword(v); setError(""); }}
              show={showOld}
              onToggle={() => setShowOld(!showOld)}
              placeholder={t("changePassword.oldPassword.placeholder")}
              icon={<LockClosedIcon className="w-[18px] h-[18px] text-[var(--gray-400)]" />}
            />
            <PasswordField
              id="newPassword"
              label={t("changePassword.newPassword")}
              value={newPassword}
              onChange={(v) => { setNewPassword(v); setError(""); }}
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
              placeholder={t("changePassword.newPassword.placeholder")}
              icon={<KeyIcon className="w-[18px] h-[18px] text-[var(--gray-400)]" />}
            />
            <PasswordField
              id="confirmNewPassword"
              label={t("changePassword.confirmPassword")}
              value={confirmPassword}
              onChange={(v) => { setConfirmPassword(v); setError(""); }}
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
              placeholder={t("changePassword.confirmPassword.placeholder")}
              icon={<ShieldCheckIcon className="w-[18px] h-[18px] text-[var(--gray-400)]" />}
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 px-5 rounded-lg border border-[var(--gray-200)] text-sm font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-5 rounded-lg bg-[var(--primary-black)] text-white text-sm font-medium hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t("changePassword.submitting") : t("changePassword.submit")}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  icon,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          {icon}
        </div>
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-[var(--gray-200)] rounded-lg pl-10 pr-10 py-2.5 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--gray-400)] hover:text-[var(--gray-600)] transition-colors"
          tabIndex={-1}
        >
          {show
            ? <EyeSlashIcon className="w-[18px] h-[18px]" />
            : <EyeIcon className="w-[18px] h-[18px]" />}
        </button>
      </div>
    </div>
  );
}
