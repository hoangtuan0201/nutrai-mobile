import axios, {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import { ENV } from '../config/env';
import { storage } from './storage';

interface ApiAuthHandlers {
  onLogout?: () => void;
}

let authHandlers: ApiAuthHandlers = {};

export function setApiAuthHandlers(handlers: ApiAuthHandlers) {
  authHandlers = handlers;
}

export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: ENV.API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// ─── Request interceptor — attach JWT from SecureStore ──────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await storage.getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore token read error in offline or initial launch
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response interceptor — handle expired/unauthorized JWT ─────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;

    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.warn(
        `[NutraAI Network Error] Failed to reach: ${originalRequest?.baseURL || ''}${originalRequest?.url || ''}. Check if Backend is running at that URL.`,
      );
    }

    const isAuthEndpoint = originalRequest?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthEndpoint) {
      authHandlers.onLogout?.();
    }

    return Promise.reject(error);
  },
);
