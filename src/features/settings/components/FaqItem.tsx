import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';

export interface FaqEntry {
  q: string;
  a: string;
}

export function FaqItem({ q, a }: FaqEntry) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const Icon = open ? ChevronUp : ChevronDown;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => setOpen((v) => !v)} style={styles.item}>
      <View style={styles.head}>
        <Text style={[styles.q, { color: colors.textPrimary }]}>{q}</Text>
        <Icon size={18} color={colors.textMuted} />
      </View>
      {open && <Text style={[styles.a, { color: colors.textSecondary }]}>{a}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: { paddingVertical: 4, minHeight: 44, justifyContent: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  q: { flex: 1, fontSize: 14, fontFamily: 'Manrope_700Bold' },
  a: { fontSize: 13, lineHeight: 20, marginTop: 8 },
});

