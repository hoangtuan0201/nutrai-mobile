import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Minus, Plus, Clock } from 'lucide-react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { minutesToTimeWithAmPm } from '../utils/labels';
import { FONTS } from '../../../constants/theme';

interface Props {
  label: string;
  minutes: number | null | undefined;
  disabled?: boolean;
  onChange: (minutes: number) => void;
}

const STEP = 30;
const clamp = (m: number) => ((m % 1440) + 1440) % 1440;

/**
 * Time stepper (±30 min quick buttons) + tap-to-open exact Hour/Minute modal
 * with 24h & 12h AM/PM clarity and a "+1 min from now" quick test button.
 */
export function ReminderTimeRow({ label, minutes, disabled, onChange }: Props) {
  const { colors, isDark } = useAppTheme();
  const value = minutes ?? 480;
  const timeInfo = minutesToTimeWithAmPm(value);

  const [modalOpen, setModalOpen] = useState(false);
  const [draftHour, setDraftHour] = useState(() => Math.floor(value / 60));
  const [draftMinute, setDraftMinute] = useState(() => value % 60);

  const openPicker = () => {
    if (disabled) return;
    setDraftHour(Math.floor(value / 60));
    setDraftMinute(value % 60);
    setModalOpen(true);
  };

  const handleConfirmModal = () => {
    const nextMinutes = clamp(draftHour * 60 + draftMinute);
    onChange(nextMinutes);
    setModalOpen(false);
  };

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

  const draftH12 = draftHour % 12 === 0 ? 12 : draftHour % 12;
  const draftAmPm = draftHour >= 12 ? 'PM' : 'AM';

  const modalBg = isDark ? '#18241C' : '#F4F1E8';
  const cardBg = isDark ? '#213026' : '#E9E5D8';

  return (
    <>
      <View style={[styles.row, disabled && styles.dim]}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
        <View style={styles.controls}>
          <Btn delta={-STEP} Icon={Minus} />
          <TouchableOpacity
            disabled={disabled}
            onPress={openPicker}
            activeOpacity={0.75}
            style={[styles.timeBadge, { backgroundColor: colors.surfaceMuted }]}
          >
            <Clock size={13} color={colors.accent} />
            <Text style={[styles.time, { color: colors.textPrimary }]}>
              {timeInfo.time24}
            </Text>
            <Text style={[styles.ampmTag, { color: colors.accent }]}>
              {timeInfo.ampm}
            </Text>
          </TouchableOpacity>
          <Btn delta={STEP} Icon={Plus} />
        </View>
      </View>

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setModalOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: modalBg, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
              {label} Reminder Time
            </Text>
            <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
              {String(draftHour).padStart(2, '0')}:{String(draftMinute).padStart(2, '0')} ({String(draftH12).padStart(2, '0')}:{String(draftMinute).padStart(2, '0')} {draftAmPm})
            </Text>

            <View style={styles.pickersRow}>
              {/* Hour Column */}
              <View style={[styles.pickerCol, { backgroundColor: cardBg }]}>
                <Text style={[styles.colLabel, { color: colors.textMuted }]}>HOUR (24H)</Text>
                <TouchableOpacity
                  style={[styles.stepBtn, { backgroundColor: colors.surface }]}
                  onPress={() => setDraftHour((h) => (h + 1) % 24)}
                >
                  <Plus size={18} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.bigDigits, { color: colors.textPrimary }]}>
                  {String(draftHour).padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  style={[styles.stepBtn, { backgroundColor: colors.surface }]}
                  onPress={() => setDraftHour((h) => (h + 23) % 24)}
                >
                  <Minus size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.colon, { color: colors.textPrimary }]}>:</Text>

              {/* Minute Column */}
              <View style={[styles.pickerCol, { backgroundColor: cardBg }]}>
                <Text style={[styles.colLabel, { color: colors.textMuted }]}>MINUTE</Text>
                <TouchableOpacity
                  style={[styles.stepBtn, { backgroundColor: colors.surface }]}
                  onPress={() => setDraftMinute((m) => (m + 1) % 60)}
                >
                  <Plus size={18} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.bigDigits, { color: colors.textPrimary }]}>
                  {String(draftMinute).padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  style={[styles.stepBtn, { backgroundColor: colors.surface }]}
                  onPress={() => setDraftMinute((m) => (m + 59) % 60)}
                >
                  <Minus size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* 12-Hour AM/PM Preview */}
              <View style={[styles.ampmBox, { backgroundColor: cardBg }]}>
                <Text style={[styles.colLabel, { color: colors.textMuted }]}>FORMAT</Text>
                <Text style={[styles.ampmLarge, { color: colors.accent }]}>
                  {draftAmPm}
                </Text>
                <Text style={[styles.ampmTime, { color: colors.textSecondary }]}>
                  {draftH12}:{String(draftMinute).padStart(2, '0')}
                </Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: cardBg }]}
                onPress={() => setModalOpen(false)}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.accent }]}
                onPress={handleConfirmModal}
              >
                <Text style={styles.saveText}>Save Time</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  label: { fontSize: 14, fontFamily: FONTS.semiBold },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  time: { fontSize: 14, fontFamily: FONTS.bold },
  ampmTag: { fontSize: 11, fontFamily: FONTS.bold },
  dim: { opacity: 0.4 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    marginBottom: 16,
  },
  pickersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  pickerCol: {
    width: 90,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 6,
  },
  ampmBox: {
    width: 76,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  ampmLarge: {
    fontSize: 22,
    fontFamily: FONTS.extraBold,
  },
  ampmTime: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },
  colLabel: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    letterSpacing: 0.6,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigDigits: {
    fontSize: 24,
    fontFamily: FONTS.extraBold,
    marginVertical: 2,
  },
  colon: {
    fontSize: 24,
    fontFamily: FONTS.extraBold,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
});
