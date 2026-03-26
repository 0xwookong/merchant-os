import { api } from "@/lib/api";

export interface NotificationItem {
  id: number;
  merchantId: number;
  userId: number | null;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResult {
  notifications: NotificationItem[];
  unreadCount: number;
}

export const notificationService = {
  list(): Promise<NotificationListResult> {
    return api.get<NotificationListResult>("/api/v1/notifications");
  },
  markRead(ids: number[]): Promise<void> {
    return api.put("/api/v1/notifications/read", { ids });
  },
  markAllRead(): Promise<void> {
    return api.put("/api/v1/notifications/read", { all: true });
  },
  remove(id: number): Promise<void> {
    return api.delete(`/api/v1/notifications/${id}`);
  },
  clearAll(): Promise<void> {
    return api.delete("/api/v1/notifications");
  },
};
