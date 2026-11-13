import { Platform } from 'react-native';

/**
 * Environment configuration
 * Automatically maps localhost -> 10.0.2.2 on Android Emulator.
 */
function resolveApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    if (Platform.OS === 'android' && envUrl.includes('localhost')) {
      return envUrl.replace('localhost', '10.0.2.2');
    }
    return envUrl;
  }
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000';
}

export const ENV = {
  API_URL: resolveApiUrl(),
  API_TIMEOUT_MS: 15_000,
  APP_NAME: 'NutrAI',
} as const;
