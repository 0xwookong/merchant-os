"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/providers/language-provider";
import { notificationService, type NotificationItem } from "@/services/notificationService";
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  UserPlusIcon,
  ShieldExclamationIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

const TYPE_ICONS: Record<string, { icon: typeof BellIcon; color: string }> = {
  APPLICATION_STATUS: { icon: CheckCircleIcon, color: "text-blue-500" },
  WEBHOOK_FAILED: { icon: ExclamationTriangleIcon, color: "text-amber-500" },
  CREDENTIAL_ROTATED: { icon: KeyIcon, color: "text-purple-500" },
  MEMBER_INVITED: { icon: UserPlusIcon, color: "text-green-500" },
  SECURITY_ALERT: { icon: ShieldExclamationIcon, color: "text-red-500" },
};

const POLL_INTERVAL = 30_000;

export default function NotificationBell() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(() => {
    notificationService.list()
      .then((data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      await notificationService.markRead([n.id]);
      setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, isRead: true } : item));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t("notifications.justNow");
    if (diffMin < 60) return t("notifications.minutesAgo", { count: diffMin });
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return t("notifications.hoursAgo", { count: diffHr });
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return t("notifications.daysAgo", { count: diffDay });
    return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label={t("notifications.title")}
      >
        <BellIcon className="w-5 h-5 text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-[var(--gray-200)] z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--gray-100)]">
            <h3 className="text-sm font-semibold text-[var(--gray-900)]">{t("notifications.title")}</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-[var(--gray-500)] hover:text-[var(--gray-700)] font-medium transition-colors"
              >
                <CheckIcon className="w-3.5 h-3.5" />
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <BellIcon className="w-8 h-8 text-[var(--gray-300)] mx-auto mb-2" />
                <p className="text-sm text-[var(--gray-400)]">{t("notifications.empty")}</p>
              </div>
            ) : (
              notifications.map((n) => {
                const typeInfo = TYPE_ICONS[n.type] || { icon: BellIcon, color: "text-[var(--gray-400)]" };
                const Icon = typeInfo.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-5 py-3.5 flex gap-3 hover:bg-[var(--gray-50)] transition-colors border-b border-[var(--gray-50)] ${
                      !n.isRead ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <div className={`mt-0.5 shrink-0 ${typeInfo.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${!n.isRead ? "font-semibold text-[var(--gray-900)]" : "font-medium text-[var(--gray-700)]"}`}>
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--gray-500)] mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-[var(--gray-400)] mt-1">{formatTime(n.createdAt)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
