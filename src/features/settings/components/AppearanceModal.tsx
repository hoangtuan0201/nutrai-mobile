import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { Check, Monitor, Moon, Sun, LucideIcon } from 'lucide-react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { ThemeMode } from '../../../store/themeStore';

const OPTIONS: { mode: ThemeMode; label: string; hint: string; icon: LucideIcon }[] = [
  { mode: 'light', label: 'Light', hint: 'Always use light mode', icon: Sun },
  { mode: 'dark', label: 'Dark', hint: 'Easier on the eyes at night', icon: Moon },
  { mode: 'system', label: 'System default', hint: 'Match your device setting', icon: Monitor },
];

export const appearanceLabel = (mode: ThemeMode) =>
  mode === 'light' ? 'Light mode' : mode === 'dark' ? 'Dark mode' : 'System default';

export function AppearanceModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, mode, setMode } = useAppTheme();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Appearance</Text>
              {OPTIONS.map(({ mode: m, label, hint, icon: Icon }) => {
                const active = mode === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.option,
                      { borderColor: colors.border, backgroundColor: colors.inputBg },
                      active && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setMode(m);
                      onClose();
                    }}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: colors.surfaceMuted }]}>
                      <Icon size={18} color={colors.textPrimary} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
                      <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text>
                    </View>
                    {active && <Check size={18} color={colors.accent} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 32 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  label: { fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 12, marginTop: 2 },
});

