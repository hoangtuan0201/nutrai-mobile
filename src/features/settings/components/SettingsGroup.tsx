import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';

export function SettingsCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

export function SettingsDivider() {
  const { colors } = useAppTheme();
  return <View style={[styles.divider, { backgroundColor: colors.divider }]} />;
}

export function SectionLabel({ children }: { children: string }) {
  const { colors } = useAppTheme();
  return <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{children}</Text>;
}

interface SettingsRowProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  /** Replaces the trailing chevron (e.g. a Switch) */
  right?: React.ReactNode;
  destructive?: boolean;
}

export function SettingsRow({ icon: Icon, title, subtitle, onPress, right, destructive }: SettingsRowProps) {
  const { colors } = useAppTheme();
  const tint = destructive ? colors.danger : colors.textPrimary;
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.surfaceMuted }]}>
        <Icon size={17} color={tint} />
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: tint }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <ChevronRight size={17} color={colors.textMuted} /> : null)}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1 },
  divider: { height: 1, marginVertical: 12 },
  sectionLabel: { fontSize: 13, fontFamily: 'Manrope_700Bold', marginBottom: 8, marginTop: 4, marginLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textCol: { flex: 1 },
  title: { fontSize: 14, fontFamily: 'Manrope_700Bold' },
  subtitle: { fontSize: 12, marginTop: 2 },
});

