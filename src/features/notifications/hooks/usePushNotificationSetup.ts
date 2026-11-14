import { useCallback, useEffect, useRef } from 'react';
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
import { resolveNotificationRoute } from '../utils/notificationRoute';

/**
 * Global hook mounted in `RootNav` (`app/_layout.tsx`) to:
 * 1. Request OS push permission & register FCM/Expo device token on login
 * 2. Sync local scheduled meal reminders whenever user preferences change
 * 3. Listen for incoming push notifications & taps (foreground, background, cold start)
 */
export function usePushNotificationSetup() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { prefs } = useNotificationPrefs();
  const queryClient = useQueryClient();
  const router = useRouter();
  const handledResponseIdsRef = useRef<Set<string>>(new Set());

  const handleNotificationResponse = useCallback(
    (response: { notification: { request: { identifier?: string; content: { data?: unknown } } } } | null) => {
      if (!response) return;
      const reqId = response.notification?.request?.identifier;
      if (reqId) {
        if (handledResponseIdsRef.current.has(reqId)) return;
        handledResponseIdsRef.current.add(reqId);
      }

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

      const targetRoute = resolveNotificationRoute(data?.route, data?.type, '/notifications');
      if (targetRoute) {
        router.push(targetRoute as any);
      }
    },
    [queryClient, router],
  );

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

  // 3. Foreground receive & tap listeners (+ cold-start tap recovery)
  useEffect(() => {
    if (!user || Platform.OS === 'web') return;
    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    void Notifications.getLastNotificationResponseAsync()
      .then((lastResponse) => {
        if (lastResponse) {
          handleNotificationResponse(lastResponse);
        }
      })
      .catch(() => {
        // Ignore on unsupported clients
      });

    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEYS.all });
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [user?.id, queryClient, handleNotificationResponse]);
}
