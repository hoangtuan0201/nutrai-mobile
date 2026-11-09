import React from 'react';
import { Stack } from 'expo-router';
import { useAppTheme } from '../../src/hooks/useAppTheme';

export default function NotificationsLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

