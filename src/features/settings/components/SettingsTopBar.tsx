import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Logo } from '../../../components';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface Props {
  /** Show the app logo (main Settings screen) instead of a page title */
  showLogo?: boolean;
  title?: string;
}

/** Sticky top bar shared by every Settings screen. */
export function SettingsTopBar({ showLogo, title }: Props) {
  const router = useRouter();
  const { colors } = useAppTheme();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(main)'));

  return (
    <View style={[styles.bar, { backgroundColor: colors.background }]}>
      {showLogo ? (
        <TouchableOpacity onPress={() => router.replace('/(main)')} activeOpacity={0.7}>
          <Logo variant="full" size="md" />
        </TouchableOpacity>
      ) : (
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      )}
      <TouchableOpacity
        onPress={goBack}
        activeOpacity={0.7}
        style={[styles.backBtn, { backgroundColor: colors.iconBg }]}
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={18} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

/** Page scaffold for Settings sub-screens (safe area + top bar + background). */
export function SettingsScreen({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <SettingsTopBar title={title} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '800' },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});

