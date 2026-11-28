import { create } from 'zustand';
import { storage } from '../lib/storage';
import { setApiAuthHandlers } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { authApi, AuthResponse } from '../features/auth/api/auth.api';
import { unregisterPushTokenAndClearReminders } from '../features/notifications/services/pushNotification.service';
import { useSubscriptionStore } from './subscriptionStore';
import { useOnboardingStore, mapGoalToBackend } from './onboardingStore';
import { profileApi, isProfileComplete } from '../features/profile/api/profile.api';
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
  loginWithGoogle: (
    idToken: string,
    options?: { fromRegister?: boolean },
  ) => Promise<{ isNewUser: boolean; needsOnboarding: boolean }>;
  /** Logout — clear token and reset state */
  logout: () => Promise<void>;
  /** Update current user fields (e.g. avatar) and persist to SecureStore */
  updateUser: (fields: Partial<AuthUser>) => void;
  /** Set or clear isNewUser (needs onboarding) flag and persist it */
  setIsNewUser: (isNew: boolean) => Promise<void>;
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
      const [accessToken, userData, cachedNeedsOnboarding] = await Promise.all([
        storage.getToken(),
        storage.getUser<AuthUser>(),
        storage.getNeedsOnboarding(),
      ]);

      if (accessToken && userData) {
        let needsOnboarding = cachedNeedsOnboarding;
        try {
          const profile = await profileApi.getProfile();
          needsOnboarding = !isProfileComplete(profile);
          await storage.setNeedsOnboarding(needsOnboarding);
        } catch {
          // If 401 happened, the API response interceptor already cleared SecureStore via logout()
          const stillHasToken = await storage.getToken();
          if (!stillHasToken) {
            set({
              user: null,
              accessToken: null,
              isNewUser: false,
              needsEmailVerification: false,
              isHydrated: true,
            });
            return;
          }
          // Offline / temporary network error: fall back to persisted onboarding flag
        }

        set({
          user: userData,
          accessToken,
          isNewUser: needsOnboarding,
          isHydrated: true,
        });
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

      let needsOnboarding = false;
      try {
        const profile = await profileApi.getProfile();
        needsOnboarding = !isProfileComplete(profile);
      } catch {
        needsOnboarding = false;
      }

      await storage.setNeedsOnboarding(needsOnboarding);
      useOnboardingStore.getState().resetOnboarding();

      set({
        user: response.user,
        accessToken: response.tokens.accessToken,
        isNewUser: needsOnboarding,
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
      // Mark onboarding pending until register.tsx successfully syncs the profile
      await storage.setNeedsOnboarding(true);
      set({
        user: response.user,
        accessToken: response.tokens.accessToken,
        isNewUser: true,
        needsEmailVerification: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      const message = extractErrorMessage(error);
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  loginWithGoogle: async (idToken: string, options?: { fromRegister?: boolean }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.loginWithGoogle(idToken);
      await persistAuthResponse(response);

      let profileComplete = false;
      if (!response.isNewUser) {
        try {
          const profile = await profileApi.getProfile();
          profileComplete = isProfileComplete(profile);
        } catch {
          profileComplete = false;
        }
      }

      const onboarding = useOnboardingStore.getState();

      if (options?.fromRegister) {
        if (!profileComplete && !onboarding.isSynced) {
          // Only sync onboarding data for new Google accounts or incomplete profiles;
          // never overwrite an existing Google account's completed profile.
          try {
            const updated = await profileApi.updateProfile({
              gender: onboarding.gender,
              heightCm: onboarding.heightCm,
              weightKg: onboarding.weightKg,
              targetWeightKg: onboarding.targetWeightKg,
              activityLevel: onboarding.activityLevel,
              fitnessGoal: mapGoalToBackend(onboarding.fitnessGoal),
              dateOfBirth: onboarding.dateOfBirth,
            });
            onboarding.markSynced();
            profileComplete = isProfileComplete(updated);
          } catch (syncErr) {
            console.warn('Auto profile sync on Google register failed:', syncErr);
            profileComplete = false;
          }
        } else if (profileComplete) {
          onboarding.resetOnboarding();
        }
      } else {
        // Signing in from Login screen: clear any stale anonymous onboarding draft
        onboarding.resetOnboarding();
      }

      const needsOnboarding = !profileComplete;
      await storage.setNeedsOnboarding(needsOnboarding);

      set({
        user: response.user,
        accessToken: response.tokens.accessToken,
        isNewUser: needsOnboarding,
        isLoading: false,
      });
      return { isNewUser: response.isNewUser, needsOnboarding };
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

  setIsNewUser: async (isNew: boolean) => {
    await storage.setNeedsOnboarding(isNew);
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
