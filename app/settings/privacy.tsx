import React, { useState } from 'react';
import { ScrollView, Alert, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { SettingsScreen } from '../../src/features/settings/components/SettingsTopBar';
import { SectionLabel, SettingsCard, SettingsRow } from '../../src/features/settings/components/SettingsGroup';
import { accountApi } from '../../src/features/settings/api/account.api';
import { useAuthStore } from '../../src/store/authStore';
import { useAppTheme } from '../../src/hooks/useAppTheme';

export default function PrivacyScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const logout = useAuthStore((s) => s.logout);
  const [busy, setBusy] = useState<boolean>(false);

  const confirmDelete = () => {
    Alert.alert(
      'Delete account?',
      'Your account will be deactivated and you will be signed out. This cannot be undone from the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await accountApi.deleteAccount();
              await logout();
              router.replace('/(auth)/welcome');
            } catch {
              setBusy(false);
              Alert.alert('Error', 'Could not delete your account. Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <SettingsScreen title="Privacy & Data">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionLabel>Danger zone</SectionLabel>
        <SettingsCard>
          <SettingsRow
            icon={Trash2}
            title="Delete account"
            subtitle="Deactivate your account and sign out"
            destructive
            onPress={busy ? undefined : confirmDelete}
            right={busy ? <ActivityIndicator color={colors.danger} /> : undefined}
          />
        </SettingsCard>
        <Text style={[styles.note, { color: colors.textMuted }]}>
          Nutrition values are AI estimates and not medical advice.
        </Text>
      </ScrollView>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  note: { fontSize: 12, textAlign: 'center', paddingHorizontal: 16 },
});
