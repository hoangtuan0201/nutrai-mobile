import { apiClient } from '../../../lib/api';

export interface AccountMe {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

export interface NotificationPreferences {
  notificationMealReminder: boolean;
  timezone?: string;
  reminderBreakfastMinutes: number | null;
  reminderLunchMinutes: number | null;
  reminderDinnerMinutes: number | null;
}

export const accountApi = {
  getMe: async () => (await apiClient.get<AccountMe>('/account/me')).data,

  uploadAvatar: async (imageBase64: string) =>
    (await apiClient.post<{ avatarUrl: string }>('/account/avatar', { imageBase64 })).data,

  getPreferences: async () =>
    (await apiClient.get<NotificationPreferences>('/account/preferences')).data,

  updatePreferences: async (dto: Partial<NotificationPreferences>) =>
    (await apiClient.patch<NotificationPreferences>('/account/preferences', dto)).data,

  deleteAccount: async () => (await apiClient.delete<{ success: boolean }>('/account')).data,
};

