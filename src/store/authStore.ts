import { create } from 'zustand';
import { storage } from '../lib/storage';
import { setApiAuthHandlers } from '../lib/api';
import { authApi, AuthResponse } from '../features/auth/api/auth.api';
import type { RegisterPayload, LoginPayload } from '../features/auth/types';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface AuthState {
  /** Current authenticated user (null = not logged in) */
  user: AuthUser | null;
  /** Access token (also stored in SecureStore) */
  accessToken: string | null;
  /** Whether hydration from SecureStore has completed */
  isHydrated: boolean;
  /** Whether an auth operation is in progress */
  isLoading: boolean;
  /** Last error from an auth operation */
  error: string | null;
}

interface AuthActions {
  /** Read tokens/user from SecureStore on app launch */
  hydrate: () => Promise<void>;
  /** Login with email + password */
  login: (payload: LoginPayload) => Promise<void>;
  /** Register with email + password */
  register: (payload: RegisterPayload) => Promise<void>;
  /** Login with Google (Firebase ID Token) */
  loginWithGoogle: (idToken: string) => Promise<void>;
  /** Logout — clear tokens and reset state */
  logout: () => Promise<void>;
  /** Called by the 401 interceptor when a token refresh succeeds */
  setAccessToken: (token: string) => void;
  /** Clear error */
  clearError: () => void;
}

/**
 * Zustand auth store — single source of truth for authentication state.
 *
 * Flow:
 *   1. App launches → hydrate() reads tokens from SecureStore
 *   2. If accessToken exists → user is logged in, redirect to (main)
 *   3. Login/Register → calls API → persists tokens → updates state
 *   4. 401 interceptor → tries refresh → on failure calls logout()
 */
export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // ─── State ─────────────────────────────────────────
  user: null,
  accessToken: null,
  isHydrated: false,
  isLoading: false,
  error: null,

  // ─── Actions ───────────────────────────────────────

  hydrate: async () => {
    try {
      const [accessToken, refreshToken, userData] = await Promise.all([
        storage.getToken(),
        storage.getRefreshToken(),
        storage.getUser<AuthUser>(),
      ]);

      if (accessToken && userData) {
        set({ user: userData, accessToken, isHydrated: true });
      } else if (refreshToken) {
        // Has refresh token but no access token — try to refresh
        try {
          const result = await authApi.refreshToken(refreshToken);
          await storage.setToken(result.accessToken);
          // We still need user data — if not cached, clear and force re-login
          if (userData) {
            set({ user: userData, accessToken: result.accessToken, isHydrated: true });
          } else {
            set({ isHydrated: true });
          }
        } catch {
          // Refresh failed — clear stale tokens
          await storage.clearAll();
          set({ isHydrated: true });
        }
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(payload);
      await persistAuthResponse(response);
      set({
        user: response.user,
        accessToken: response.tokens.accessToken,
        isLoading: false,
      });
    } catch (error: unknown) {
      const message = extractErrorMessage(error);
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  register: async (payload: RegisterPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(payload);
      await persistAuthResponse(response);
      set({
        user: response.user,
        accessToken: response.tokens.accessToken,
        isLoading: false,
      });
    } catch (error: unknown) {
      const message = extractErrorMessage(error);
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  loginWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.loginWithGoogle(idToken);
      await persistAuthResponse(response);
      set({
        user: response.user,
        accessToken: response.tokens.accessToken,
        isLoading: false,
      });
    } catch (error: unknown) {
      const message = extractErrorMessage(error);
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: async () => {
    await storage.clearAll();
    set({ user: null, accessToken: null, error: null });
  },

  setAccessToken: (token: string) => {
    set({ accessToken: token });
    // Persist in background — don't await
    storage.setToken(token).catch(() => {});
  },

  clearError: () => set({ error: null }),
}));

// Connect API refresh interceptor handlers to auth store without circular dependency
setApiAuthHandlers({
  onTokenRefreshed: (token) => useAuthStore.getState().setAccessToken(token),
  onLogout: () => {
    useAuthStore.getState().logout();
  },
});

// ─── Helpers ───────────────────────────────────────────

async function persistAuthResponse(response: AuthResponse) {
  await Promise.all([
    storage.setToken(response.tokens.accessToken),
    storage.setRefreshToken(response.tokens.refreshToken),
    storage.setUser(response.user),
  ]);
}

function extractErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const axiosError = error as {
      response?: { data?: { message?: string | string[] } };
      message?: string;
      code?: string;
    };
    const msg = axiosError.response?.data?.message;
    if (Array.isArray(msg)) return msg[0];
    if (typeof msg === 'string') return msg;
    if (axiosError.code === 'ERR_NETWORK' || axiosError.message === 'Network Error') {
      return 'Network Error: Cannot connect to server. Check Wi-Fi / IP connection.';
    }
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
