/**
 * Environment configuration
 * Reads from .env — never hardcode secrets here
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

export const ENV = {
  API_URL,
  API_TIMEOUT_MS: 15_000,
  APP_NAME: 'NutraAI',
} as const;
