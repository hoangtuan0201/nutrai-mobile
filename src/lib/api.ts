import axios, {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import { ENV } from '../config/env';
import { storage } from './storage';

interface ApiAuthHandlers {
  onTokenRefreshed?: (token: string) => void;
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

// ─── Response interceptor — 401 token refresh ──────────────────

let isRefreshing = false;
let pendingRequests: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function onRefreshSuccess(newToken: string) {
  pendingRequests.forEach(({ resolve }) => resolve(newToken));
  pendingRequests = [];
}

function onRefreshFailure(error: unknown) {
  pendingRequests.forEach(({ reject }) => reject(error));
  pendingRequests = [];
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401 and non-auth endpoints (prevent loops)
    const isAuthEndpoint = originalRequest?.url?.startsWith('/auth/');
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request to retry after refresh completes
    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        pendingRequests.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            originalRequest._retry = true;
            resolve(apiClient(originalRequest));
          },
          reject: (err: unknown) => reject(err),
        });
      });
    }

    isRefreshing = true;
    originalRequest._retry = true;

    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh endpoint directly (not through apiClient to avoid interceptor loop)
      const { data } = await axios.post<{ accessToken: string }>(
        `${ENV.API_URL}/auth/refresh`,
        { refreshToken },
      );

      const newAccessToken = data.accessToken;

      // Persist new token
      await storage.setToken(newAccessToken);
      authHandlers.onTokenRefreshed?.(newAccessToken);

      // Retry the original request with new token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      // Retry all queued requests
      onRefreshSuccess(newAccessToken);

      return apiClient(originalRequest);
    } catch (refreshError) {
      onRefreshFailure(refreshError);

      // Refresh failed — force logout
      authHandlers.onLogout?.();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
