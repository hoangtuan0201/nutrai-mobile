import { create } from 'zustand';
import { storage } from '../lib/storage';
import { setApiAuthHandlers } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { authApi, AuthResponse } from '../features/auth/api/auth.api';
import { unregisterPushTokenAndClearReminders } from '../features/notifications/services/pushNotification.service';
import { useSubscriptionStore } from './subscriptionStore';
import { useOnboardingStore } from './onboardingStore';
import type { RegisterPayload, LoginPayload } from '../features/auth/types';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
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
  /** Whether current session is a new user who must complete onboarding */
  isNewUser: boolean;
  /** True right after email/password registration until user verifies or skips */
  needsEmailVerification: boolean;
}

interface AuthActions {
  /** Read tokens/user from SecureStore on app launch */
  hydrate: () => Promise<void>;
  /** Login with email + password */
  login: (payload: LoginPayload) => Promise<void>;
  /** Register with email + password */
  register: (payload: RegisterPayload) => Promise<void>;
  /** Login with Google (Firebase ID Token) */
  loginWithGoogle: (idToken: string) => Promise<{ isNewUser: boolean }>;
  /** Logout — clear token and reset state */
  logout: () => Promise<void>;
  /** Update current user fields (e.g. avatar) and persist to SecureStore */
  updateUser: (fields: Partial<AuthUser>) => void;
  /** Set or clear isNewUser flag */
  setIsNewUser: (isNew: boolean) => void;
  /** Clear pending email verification gate */
  clearNeedsEmailVerification: () => void;
  /** Clear error */
  clearError: () => void;
}

/**
 * Zustand auth store — single source of truth for authentication state.
 *
 * Flow:
 *   1. App launches → hydrate() reads accessToken and user from SecureStore
 *   2. If accessToken exists → user is logged in, redirect to (main)
 *   3. Login/Register → calls API → persists accessToken → updates state
 *   4. 401 interceptor → clears session via logout()
 */
export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // ─── State ─────────────────────────────────────────
  user: null,
  accessToken: null,
  isHydrated: false,
  isLoading: false,
  error: null,
  isNewUser: false,
  needsEmailVerification: false,

  // ─── Actions ───────────────────────────────────────

  hydrate: async () => {
    try {
      const [accessToken, userData] = await Promise.all([
        storage.getToken(),
        storage.getUser<AuthUser>(),
      ]);

      if (accessToken && userData) {
        set({ user: userData, accessToken, isHydrated: true });
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
        needsEmailVerification: true,
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
        isNewUser: response.isNewUser,
        isLoading: false,
      });
      return { isNewUser: response.isNewUser };
    } catch (error: unknown) {
      const message = extractErrorMessage(error);
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: async () => {
    // 1. Unregister push token & local reminders while access token is still valid
    if (get().accessToken) {
      await unregisterPushTokenAndClearReminders().catch(() => {});
    }

    // 2. Clear persisted credentials, React Query cache, and all per-user stores
    await storage.clearAll();
    queryClient.clear();
    await useSubscriptionStore.getState().reset();
    useOnboardingStore.getState().resetOnboarding();

    set({
      user: null,
      accessToken: null,
      error: null,
      isNewUser: false,
      needsEmailVerification: false,
    });
  },

  setIsNewUser: (isNew: boolean) => {
    set({ isNewUser: isNew });
  },

  clearNeedsEmailVerification: () => {
    set({ needsEmailVerification: false });
  },

  updateUser: (fields: Partial<AuthUser>) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...fields };
    set({ user: updated });
    storage.setUser(updated).catch(() => {});
  },

  clearError: () => set({ error: null }),
}));

// Connect API 401 logout handler to auth store without circular dependency
setApiAuthHandlers({
  onLogout: () => {
    useAuthStore.getState().logout();
  },
});

// ─── Helpers ───────────────────────────────────────────

async function persistAuthResponse(response: AuthResponse) {
  await Promise.all([
    storage.setToken(response.tokens.accessToken),
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
