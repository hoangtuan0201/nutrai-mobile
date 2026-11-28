import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Secure storage wrapper — uses expo-secure-store on native,
 * falls back to AsyncStorage on web.
 *
 * Tokens are stored encrypted in the device's keychain (iOS) or Keystore (Android).
 */

const KEYS = {
  ACCESS_TOKEN: 'nutraai_access_token',
  USER: 'nutraai_user',
  NEEDS_ONBOARDING: 'nutraai_needs_onboarding',
} as const;

const isWeb = Platform.OS === 'web';

async function getItem(key: string): Promise<string | null> {
  if (isWeb) return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export const storage = {
  // ─── Access Token ──────────────────────────────────
  async getToken(): Promise<string | null> {
    return getItem(KEYS.ACCESS_TOKEN);
  },
  async setToken(token: string): Promise<void> {
    await setItem(KEYS.ACCESS_TOKEN, token);
  },

  // ─── User data (JSON) ─────────────────────────────
  async getUser<T = Record<string, unknown>>(): Promise<T | null> {
    const raw = await getItem(KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async setUser(user: Record<string, unknown>): Promise<void> {
    await setItem(KEYS.USER, JSON.stringify(user));
  },

  // ─── Onboarding completion flag ───────────────────
  async getNeedsOnboarding(): Promise<boolean> {
    const raw = await getItem(KEYS.NEEDS_ONBOARDING);
    return raw === 'true';
  },
  async setNeedsOnboarding(value: boolean): Promise<void> {
    await setItem(KEYS.NEEDS_ONBOARDING, value ? 'true' : 'false');
  },

  // ─── Clear all ─────────────────────────────────────
  async clearAll(): Promise<void> {
    await Promise.all([
      removeItem(KEYS.ACCESS_TOKEN),
      removeItem(KEYS.USER),
      removeItem(KEYS.NEEDS_ONBOARDING),
    ]);
  },
};
