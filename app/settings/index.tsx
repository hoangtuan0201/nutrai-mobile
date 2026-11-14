import React, { useState } from 'react';
import { ScrollView, Alert, Platform, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSafeNavigate } from '../../src/utils/navigationGuard';
import { Bell, HelpCircle, Info, LogOut, Moon, Shield, Sliders, Sparkles } from 'lucide-react-native';
import { UnitsModal } from '../../src/components';
import { useAuthStore } from '../../src/store/authStore';
import { useUnitStore } from '../../src/store/unitStore';
import { useSubscriptionStore } from '../../src/store/subscriptionStore';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { SettingsTopBar } from '../../src/features/settings/components/SettingsTopBar';
import { UserProfileCard } from '../../src/features/settings/components/UserProfileCard';
import { PersonalInfoCard } from '../../src/features/settings/components/PersonalInfoCard';
import { EditProfileModal, EditType } from '../../src/features/settings/components/EditProfileModal';
import { AppearanceModal, appearanceLabel } from '../../src/features/settings/components/AppearanceModal';
import {
  SectionLabel,
  SettingsCard,
  SettingsDivider,
  SettingsRow,
} from '../../src/features/settings/components/SettingsGroup';
import { useProfileSummary } from '../../src/features/settings/hooks/useProfileSummary';
import { useAccount } from '../../src/features/settings/hooks/useAccount';

export default function SettingsScreen() {
  const router = useSafeNavigate();
  const { colors, mode } = useAppTheme();
  const { user, logout } = useAuthStore();
  const { energyUnit, foodUnit, bodyUnit } = useUnitStore();
  const { isPro, planName } = useSubscriptionStore();
  const summary = useProfileSummary();
  const { account, avatarUrl, isUploadingAvatar, pickAndUploadAvatar } = useAccount();

  const [editType, setEditType] = useState<EditType | null>(null);
  const [unitsOpen, setUnitsOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  const handleLogout = () => {
    const doLogout = async () => {
      await logout();
      router.replace('/(auth)/login');
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) doLogout();
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out of NutrAI?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doLogout },
    ]);
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <SettingsTopBar showLogo />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Settings</Text>
        <Text style={[styles.subheading, { color: colors.textSecondary }]}>
          Manage your profile, goals and preferences.
        </Text>

        <UserProfileCard
          name={account?.name ?? user?.name}
          email={account?.email ?? user?.email}
          avatarUrl={avatarUrl}
          isUploading={isUploadingAvatar}
          onPressCard={() => setEditType('personal')}
          onPressAvatar={pickAndUploadAvatar}
          onPressPlan={() => router.push('/settings/subscription')}
        />

        <PersonalInfoCard
          summary={summary}
          bodyUnit={bodyUnit}
          onEditPersonal={() => setEditType('personal')}
          onEditGoals={() => setEditType('goals')}
        />

        <SectionLabel>App Settings</SectionLabel>
        <SettingsCard>
          <SettingsRow
            icon={Sparkles}
            title="NutrAI Pro Subscription"
            subtitle={isPro ? `${planName} (Active)` : 'Free Plan · Tap to upgrade'}
            onPress={() => router.push('/settings/subscription')}
          />
          <SettingsDivider />
          <SettingsRow
            icon={Sliders}
            title="Units"
            subtitle={`${energyUnit}, ${foodUnit === 'metric' ? 'g/ml' : 'oz/fl oz'}, ${bodyUnit === 'metric' ? 'cm/kg' : 'ft/lbs'}`}
            onPress={() => setUnitsOpen(true)}
          />
          <SettingsDivider />
          <SettingsRow
            icon={Bell}
            title="Notifications"
            subtitle="Meal reminders & reminder times"
            onPress={() => router.push('/settings/notifications')}
          />
          <SettingsDivider />
          <SettingsRow
            icon={Moon}
            title="Appearance"
            subtitle={appearanceLabel(mode)}
            onPress={() => setAppearanceOpen(true)}
          />
          <SettingsDivider />
          <SettingsRow
            icon={Shield}
            title="Privacy & Data"
            subtitle="Account deletion"
            onPress={() => router.push('/settings/privacy')}
          />
        </SettingsCard>

        <SettingsCard>
          <SettingsRow
            icon={HelpCircle}
            title="Help & Support"
            subtitle="FAQs, contact us"
            onPress={() => router.push('/settings/help')}
          />
          <SettingsDivider />
          <SettingsRow
            icon={Info}
            title="About NutrAI"
            subtitle="Version 1.0.0"
            onPress={() => Alert.alert('NutrAI', 'Version 1.0.0\nAI-powered nutrition tracking.')}
          />
        </SettingsCard>

        <TouchableOpacity
          style={[styles.logout, { backgroundColor: colors.surface, borderColor: colors.dangerBorder }]}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <LogOut size={18} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <EditProfileModal
        visible={editType !== null}
        type={editType ?? 'personal'}
        summary={summary}
        bodyUnit={bodyUnit}
        onClose={() => setEditType(null)}
      />
      <UnitsModal visible={unitsOpen} onClose={() => setUnitsOpen(false)} />
      <AppearanceModal visible={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 90 },
  heading: { fontSize: 28, fontFamily: 'Manrope_800ExtraBold', letterSpacing: -0.5, paddingHorizontal: 4 },
  subheading: { fontSize: 14, marginTop: 4, marginBottom: 24, paddingHorizontal: 4 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    gap: 8,
  },
  logoutText: { fontSize: 15, fontFamily: 'Manrope_700Bold' },
});
