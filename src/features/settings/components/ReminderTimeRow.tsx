import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { minutesToTime } from '../utils/labels';

interface Props {
  label: string;
  minutes: number | null | undefined;
  disabled?: boolean;
  onChange: (minutes: number) => void;
}

const STEP = 30;
const clamp = (m: number) => (m + 1440) % 1440;

/** Time stepper (±30 min) — avoids a native date-picker dependency. */
export function ReminderTimeRow({ label, minutes, disabled, onChange }: Props) {
  const { colors } = useAppTheme();
  const value = minutes ?? 0;

  const Btn = ({ delta, Icon }: { delta: number; Icon: typeof Plus }) => (
    <TouchableOpacity
      disabled={disabled}
      onPress={() => onChange(clamp(value + delta))}
      style={[styles.btn, { backgroundColor: colors.surfaceMuted }, disabled && styles.dim]}
      accessibilityLabel={`${delta > 0 ? 'Increase' : 'Decrease'} ${label} time`}
    >
      <Icon size={16} color={colors.textPrimary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.row, disabled && styles.dim]}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      <View style={styles.controls}>
        <Btn delta={-STEP} Icon={Minus} />
        <Text style={[styles.time, { color: colors.textPrimary }]}>{minutesToTime(value)}</Text>
        <Btn delta={STEP} Icon={Plus} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  label: { fontSize: 14, fontWeight: '600' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  time: { fontSize: 15, fontWeight: '700', minWidth: 52, textAlign: 'center' },
  dim: { opacity: 0.4 },
});

