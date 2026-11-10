import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { theme } from '../src/constants';
import { QueryProvider } from '../src/lib/queryClient';
import { useAuthStore } from '../src/store/authStore';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { usePushNotificationSetup } from '../src/features/notifications/hooks/usePushNotificationSetup';
import { SubscriptionModalsHost } from '../src/features/subscription/components/SubscriptionModalsHost';

/**
 * Auth guard — auto-redirect based on authentication state.
 * Runs after hydration completes.
 */
function useProtectedRoute() {
  const { user, isHydrated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return; // wait for SecureStore read

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Not logged in and not on auth screen → redirect to welcome
      router.replace('/(auth)/welcome');
    } else if (user && inAuthGroup) {
      // Logged in but still on auth screen → redirect to main app
      router.replace('/(main)');
    }
  }, [user, isHydrated, segments]);
}

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const { isDark } = useAppTheme();

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  // Hydrate auth state from SecureStore on first mount
  useEffect(() => {
    hydrate();
  }, []);

  // Show nothing until fonts + auth state are loaded (splash screen covers this)
  if (!fontsLoaded || !isHydrated) {
    return null;
  }

  return (
    <QueryProvider>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootNav />
      </SafeAreaProvider>
    </QueryProvider>
  );
}

/** Separated so useProtectedRoute can access router (must be under Stack) */
function RootNav() {
  useProtectedRoute();
  usePushNotificationSetup();
  const { colors } = useAppTheme();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notifications" />
      </Stack>
      <SubscriptionModalsHost />
    </>
  );
}
