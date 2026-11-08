import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Loading } from '../../../src/components/ui/Loading';
import { useAppTheme } from '../../../src/hooks/useAppTheme';

export default function ChatTabRedirect() {
  const router = useRouter();
  const { colors } = useAppTheme();

  useEffect(() => {
    router.replace('/(main)/ai/chat');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Loading message="Connecting to AI Nutrition Coach..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
