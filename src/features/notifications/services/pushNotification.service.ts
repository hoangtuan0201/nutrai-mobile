import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import Constants from 'expo-constants';
import { notificationsApi } from '../api/notifications.api';
import { NotificationPreferences } from '../../settings/api/account.api';

type ExpoNotificationsModule = typeof import('expo-notifications');
type ExpoDeviceModule = typeof import('expo-device');

let isHandlerInitialized = false;
let cachedNotificationsModule: ExpoNotificationsModule | null | undefined;

/**
 * Safely load `expo-notifications` only if the native module `ExpoPushTokenManager`
 * is compiled into the current client binary. Prevents RedBox crash when running
 * on an older dev-client build that hasn't been rebuilt with `npx expo run:android` yet.
 */
export function getNotificationsModule(): ExpoNotificationsModule | null {
  if (Platform.OS === 'web') return null;
  if (cachedNotificationsModule !== undefined) return cachedNotificationsModule;

  try {
    const hasPushTokenManager = Boolean(
      requireOptionalNativeModule('ExpoPushTokenManager'),
    );
    if (!hasPushTokenManager) {
      cachedNotificationsModule = null;
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedNotificationsModule = require('expo-notifications') as ExpoNotificationsModule;
    return cachedNotificationsModule;
  } catch {
    cachedNotificationsModule = null;
    return null;
  }
}

function getDeviceModelName(): string | undefined {
  try {
    if (!requireOptionalNativeModule('ExpoDevice')) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Device = require('expo-device') as ExpoDeviceModule;
    return Device.modelName ?? Device.deviceName ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Configure foreground notification presentation so banners & sound appear
 * even while the user has the NutraAI app open.
 */
export function initForegroundNotificationHandler() {
  if (Platform.OS === 'web' || isHandlerInitialized) return;
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  isHandlerInitialized = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Ensure the default high-importance Android notification channel exists.
 */
export async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') return;
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  await Notifications.setNotificationChannelAsync('nutraai-default', {
    name: 'NutraAI Reminders & Alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF9114',
  });
}

/**
 * Request OS notification permissions, retrieve the FCM (or Expo) push token,
 * and register it with the NutraAI backend (`POST /notifications/device-token`).
 */
export async function requestPushPermissionAndRegisterToken(): Promise<boolean> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return false;

  try {
    initForegroundNotificationHandler();
    await ensureAndroidNotificationChannel();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    let pushToken: string | null = null;

    // 1. Prefer native FCM / APNs device token for Firebase Admin SDK
    try {
      const deviceTokenRes = await Notifications.getDevicePushTokenAsync();
      if (deviceTokenRes?.data && typeof deviceTokenRes.data === 'string') {
        pushToken = deviceTokenRes.data;
      }
    } catch {
      // Fallback to Expo push token below if native FCM is unavailable
    }

    // 2. Fallback to Expo Push Token if needed
    if (!pushToken) {
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;
        const expoTokenRes = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        if (expoTokenRes?.data) {
          pushToken = expoTokenRes.data;
        }
      } catch {
        // Ignore on simulator/Expo Go without push capability
      }
    }

    if (pushToken) {
      const platform: 'ANDROID' | 'IOS' = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
      const deviceModel = getDeviceModelName();
      await notificationsApi.registerDeviceToken({
        token: pushToken,
        platform,
        deviceModel,
      });
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Synchronize local daily repeating meal reminders on the device so reminders
 * fire at the exact minute even if the phone is temporarily offline.
 */
export async function syncLocalMealReminders(prefs: NotificationPreferences | undefined) {
  const Notifications = getNotificationsModule();
  if (!Notifications || !prefs) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!prefs.notificationMealReminder) {
      return;
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    await ensureAndroidNotificationChannel();

    const slots: Array<{
      minutes: number | null;
      title: string;
      body: string;
      mealType: string;
    }> = [
      {
        minutes: prefs.reminderBreakfastMinutes ?? 480,
        title: 'Good Morning! Time for Breakfast 🍳',
        body: "Start your day strong! Don't forget to log your breakfast in NutraAI.",
        mealType: 'BREAKFAST',
      },
      {
        minutes: prefs.reminderLunchMinutes ?? 720,
        title: 'Time for Lunch! 🥗',
        body: 'Fuel up your afternoon and snap or log your lunch to stay on track.',
        mealType: 'LUNCH',
      },
      {
        minutes: prefs.reminderDinnerMinutes ?? 1080,
        title: 'Evening Dinner Reminder 🍲',
        body: 'Remember to log your dinner to complete your daily nutrition summary.',
        mealType: 'DINNER',
      },
    ];

    for (const slot of slots) {
      if (slot.minutes == null) continue;
      const hour = Math.floor(slot.minutes / 60);
      const minute = slot.minutes % 60;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: slot.title,
          body: slot.body,
          sound: true,
          data: {
            type: 'MEAL_REMINDER',
            mealType: slot.mealType,
            route: '/(main)/meals',
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          ...(Platform.OS === 'android' ? { channelId: 'nutraai-default' } : {}),
        },
      });
    }
  } catch {
    // Non-fatal if OS scheduling fails
  }
}

/**
 * Instantly schedules a local notification to fire in `seconds` (default 5s)
 * on this device. Perfect for rapid verification of on-device alarms.
 */
export async function scheduleImmediateTestReminder(seconds = 5): Promise<boolean> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return false;

  try {
    await ensureAndroidNotificationChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Dinner Reminder (5s Test) 🍲',
        body: 'Local notification test! Don\'t forget to log your dinner.',
        sound: true,
        data: {
          type: 'MEAL_REMINDER',
          mealType: 'DINNER',
          route: '/(main)/meals',
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        ...(Platform.OS === 'android' ? { channelId: 'nutraai-default' } : {}),
      },
    });
    return true;
  } catch {
    return false;
  }
}
