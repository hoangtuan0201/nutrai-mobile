import React from 'react';
import { ScrollView, Linking } from 'react-native';
import { Mail } from 'lucide-react-native';
import { SettingsScreen } from '../../src/features/settings/components/SettingsTopBar';
import { SectionLabel, SettingsCard, SettingsDivider, SettingsRow } from '../../src/features/settings/components/SettingsGroup';
import { FaqItem, FaqEntry } from '../../src/features/settings/components/FaqItem';

const SUPPORT_EMAIL = 'support@nutraai.app';

const FAQS: FaqEntry[] = [
  {
    q: 'How accurate are the calorie estimates?',
    a: 'Scans and AI chat give estimates, not exact measurements. You can always edit portions and values after logging a meal.',
  },
  {
    q: 'How is my daily calorie goal calculated?',
    a: 'We use the Mifflin-St Jeor formula for BMR, multiply by your activity level (TDEE), then adjust for your goal with safe minimum limits.',
  },
  {
    q: 'How do I log a meal with a photo?',
    a: 'Open Log → Scan food, take or pick a photo, review the AI breakdown and tap save.',
  },
  {
    q: 'Can I change units or appearance?',
    a: 'Yes. Go to Settings → Units to switch kcal/kJ and metric/imperial, and Settings → Appearance for light or dark mode.',
  },
  {
    q: 'How do I delete my data?',
    a: 'Settings → Privacy & Data lets you export your data or delete your account.',
  },
];

export default function HelpScreen() {
  return (
    <SettingsScreen title="Help & Support">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <SectionLabel>Frequently asked questions</SectionLabel>
        <SettingsCard>
          {FAQS.map((f, i) => (
            <React.Fragment key={f.q}>
              {i > 0 && <SettingsDivider />}
              <FaqItem {...f} />
            </React.Fragment>
          ))}
        </SettingsCard>

        <SectionLabel>Contact</SectionLabel>
        <SettingsCard>
          <SettingsRow
            icon={Mail}
            title="Email support"
            subtitle={SUPPORT_EMAIL}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=NutraAI%20Support`)}
          />
        </SettingsCard>
      </ScrollView>
    </SettingsScreen>
  );
}

