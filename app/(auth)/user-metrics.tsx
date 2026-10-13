/**
 * user-metrics.tsx — Redirects to granular onboarding flow starting at gender.tsx
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../src/constants';

export default function UserMetricsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(auth)/gender' as any);
  }, []);

  return <View style={{ flex: 1, backgroundColor: theme.colors.surfaceBase }} />;
}
