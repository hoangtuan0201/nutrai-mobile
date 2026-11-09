import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';

/**
 * Global navigation timestamp to block rapid consecutive taps (double/triple taps)
 * across the entire app, preventing nested duplicate screens.
 */
let lastNavigationTimestamp = 0;

/**
 * Execute a navigation action only if at least `throttleMs` (default 600ms)
 * has passed since the last navigation action.
 */
export function throttleNavigation(action: () => void, throttleMs = 600): void {
  const now = Date.now();
  if (now - lastNavigationTimestamp < throttleMs) {
    return;
  }
  lastNavigationTimestamp = now;
  action();
}

/**
 * Hook providing guarded navigation methods that automatically throttle rapid taps
 * and prefer `router.navigate` to avoid pushing redundant screens onto the stack.
 */
export function useSafeNavigate(throttleMs = 600) {
  const router = useRouter();

  const safePush = useCallback(
    (...args: Parameters<typeof router.push>) => {
      throttleNavigation(() => {
        // Use router.navigate if available to focus existing route rather than stack duplicates
        if (typeof router.navigate === 'function') {
          router.navigate(...args);
        } else {
          router.push(...args);
        }
      }, throttleMs);
    },
    [router, throttleMs],
  );

  const safeNavigate = useCallback(
    (...args: Parameters<typeof router.navigate>) => {
      throttleNavigation(() => {
        router.navigate(...args);
      }, throttleMs);
    },
    [router, throttleMs],
  );

  const safeReplace = useCallback(
    (...args: Parameters<typeof router.replace>) => {
      throttleNavigation(() => {
        router.replace(...args);
      }, throttleMs);
    },
    [router, throttleMs],
  );

  const safeBack = useCallback(() => {
    throttleNavigation(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(main)');
      }
    }, 350);
  }, [router]);

  return useMemo(
    () => ({
      ...router,
      push: safePush,
      navigate: safeNavigate,
      replace: safeReplace,
      back: safeBack,
    }),
    [router, safePush, safeNavigate, safeReplace, safeBack],
  );
}

