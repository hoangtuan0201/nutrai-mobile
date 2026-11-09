import { apiClient } from '../../../lib/api';

export type NotificationType =
  | 'MEAL_REMINDER'
  | 'GOAL_ALERT'
  | 'AI_RECOMMENDATION'
  | 'SUBSCRIPTION'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface PaginatedNotificationsResponse {
  items: AppNotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface RegisterDeviceTokenPayload {
  token: string;
  platform: 'ANDROID' | 'IOS';
  deviceModel?: string;
}

export const notificationsApi = {
  registerDeviceToken: async (payload: RegisterDeviceTokenPayload) =>
    (await apiClient.post<{ id: string; platform: string; isActive: boolean }>(
      '/notifications/device-token',
      payload,
    )).data,

  removeDeviceToken: async (token: string) =>
    (await apiClient.delete<{ success: boolean }>('/notifications/device-token', {
      data: { token },
    })).data,

  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) =>
    (await apiClient.get<PaginatedNotificationsResponse>('/notifications', {
      params,
    })).data,

  getUnreadCount: async () =>
    (await apiClient.get<{ unreadCount: number }>('/notifications/unread-count')).data,

  markAsRead: async (id: string) =>
    (await apiClient.patch<AppNotification>(`/notifications/${id}/read`)).data,

  markAllAsRead: async () =>
    (await apiClient.patch<{ updatedCount: number }>('/notifications/read-all')).data,

  sendTestPush: async () =>
    (await apiClient.post<AppNotification>('/notifications/test-push')).data,

  testStreakAlert: async (payload?: { force?: boolean; simulatedStreak?: number }) =>
    (await apiClient.post<{ success: boolean; sent: boolean; streak: number; reason: string }>(
      '/notifications/test-streak-alert',
      payload ?? { force: true, simulatedStreak: 3 },
    )).data,

  testWeeklyWeighIn: async (payload?: { force?: boolean }) =>
    (await apiClient.post<{ success: boolean; sent: boolean; reason: string }>(
      '/notifications/test-weekly-weigh-in',
      payload ?? { force: true },
    )).data,

  testMealReminder: async (payload: { mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER'; force?: boolean }) =>
    (await apiClient.post<{ success: boolean; sent: boolean; reason: string }>(
      '/notifications/test-meal-reminder',
      payload,
    )).data,
};

