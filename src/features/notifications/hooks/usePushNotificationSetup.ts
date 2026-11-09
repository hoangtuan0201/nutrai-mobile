import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { useNotificationPrefs } from '../../settings/hooks/useNotificationPrefs';
import {
  getNotificationsModule,
  initForegroundNotificationHandler,
  requestPushPermissionAndRegisterToken,
  syncLocalMealReminders,
} from '../services/pushNotification.service';
import { NOTIFICATIONS_KEYS } from './useNotifications';
import { notificationsApi } from '../api/notifications.api';

/**
 * Global hook mounted in `RootNav` (`app/_layout.tsx`) to:
 * 1. Request OS push permission & register FCM/Expo device token on login
 * 2. Sync local scheduled meal reminders whenever user preferences change
 * 3. Listen for incoming push notifications & taps to update badge and navigate
 */
export function usePushNotificationSetup() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { prefs } = useNotificationPrefs();
  const queryClient = useQueryClient();
  const router = useRouter();

  // 1. Register push token once authenticated
  useEffect(() => {
    if (!user || !accessToken || Platform.OS === 'web') return;
    initForegroundNotificationHandler();
    void requestPushPermissionAndRegisterToken();
  }, [user?.id, accessToken]);

  // 2. Sync local daily meal reminder alarms whenever preferences load/update
  useEffect(() => {
    if (!user || !prefs || Platform.OS === 'web') return;
    void syncLocalMealReminders(prefs);
  }, [
    user?.id,
    prefs?.notificationMealReminder,
    prefs?.reminderBreakfastMinutes,
    prefs?.reminderLunchMinutes,
    prefs?.reminderDinnerMinutes,
  ]);

  // 3. Foreground receive & tap listeners
  useEffect(() => {
    if (!user || Platform.OS === 'web') return;
    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEYS.all });
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as
        | Record<string, unknown>
        | undefined;

      if (data?.notificationId && typeof data.notificationId === 'string') {
        void notificationsApi
          .markAsRead(data.notificationId)
          .finally(() => {
            void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEYS.all });
          });
      } else {
        void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEYS.all });
      }

      if (data?.route && typeof data.route === 'string') {
        router.push(data.route as any);
      } else {
        router.push('/notifications' as any);
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [user?.id, queryClient, router]);
}
