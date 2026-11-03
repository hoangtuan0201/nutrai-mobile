import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Loading } from '../../../src/components/ui/Loading';

export default function ChatTabRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(main)/ai/chat');
  }, []);

  return (
    <View style={styles.container}>
      <Loading message="Connecting to AI Nutrition Coach..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F2E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
