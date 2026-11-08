import React from 'react';
import { ScrollView, Switch, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { SettingsScreen } from '../../src/features/settings/components/SettingsTopBar';
import { SectionLabel, SettingsCard, SettingsDivider, SettingsRow } from '../../src/features/settings/components/SettingsGroup';
import { ReminderTimeRow } from '../../src/features/settings/components/ReminderTimeRow';
import { useNotificationPrefs } from '../../src/features/settings/hooks/useNotificationPrefs';
import { useAppTheme } from '../../src/hooks/useAppTheme';

export default function NotificationSettingsScreen() {
  const { colors } = useAppTheme();
  const { prefs, isLoading, update } = useNotificationPrefs();

  return (
    <SettingsScreen title="Notifications">
      {isLoading || !prefs ? (
        <ActivityIndicator style={styles.loader} color={colors.accent} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SectionLabel>Alerts</SectionLabel>
          <SettingsCard>
            <SettingsRow
              icon={Bell}
              title="Meal reminders"
              subtitle="Remind me to log breakfast, lunch and dinner"
              right={
                <Switch
                  value={prefs.notificationMealReminder}
                  onValueChange={(v) => update({ notificationMealReminder: v })}
                  trackColor={{ false: colors.surfaceMuted, true: colors.accent }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </SettingsCard>

          <SectionLabel>Reminder times</SectionLabel>
          <SettingsCard>
            <ReminderTimeRow
              label="Breakfast"
              minutes={prefs.reminderBreakfastMinutes}
              disabled={!prefs.notificationMealReminder}
              onChange={(m) => update({ reminderBreakfastMinutes: m })}
            />
            <SettingsDivider />
            <ReminderTimeRow
              label="Lunch"
              minutes={prefs.reminderLunchMinutes}
              disabled={!prefs.notificationMealReminder}
              onChange={(m) => update({ reminderLunchMinutes: m })}
            />
            <SettingsDivider />
            <ReminderTimeRow
              label="Dinner"
              minutes={prefs.reminderDinnerMinutes}
              disabled={!prefs.notificationMealReminder}
              onChange={(m) => update({ reminderDinnerMinutes: m })}
            />
          </SettingsCard>
          <Text style={[styles.note, { color: colors.textMuted }]}>
            Preferences are saved to your account. Push delivery will be enabled with the notification service.
          </Text>
        </ScrollView>
      )}
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 48 },
  loader: { marginTop: 48 },
  note: { fontSize: 12, textAlign: 'center', paddingHorizontal: 16 },
});
