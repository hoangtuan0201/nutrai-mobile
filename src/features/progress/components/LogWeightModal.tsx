import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Minus, Plus, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import theme from '../../../constants/theme';

interface LogWeightModalProps {
  visible: boolean;
  initialWeight?: number;
  initialDate?: string; // YYYY-MM-DD
  onClose: () => void;
  onSubmit: (weightKg: number, note?: string, loggedDate?: string) => Promise<void>;
}

export const LogWeightModal: React.FC<LogWeightModalProps> = ({
  visible,
  initialWeight = 60,
  initialDate,
  onClose,
  onSubmit,
}) => {
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [weight, setWeight] = useState<string>(
    initialWeight > 0 ? initialWeight.toFixed(1) : '60.0'
  );
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || getTodayStr());
  const [isEditingCustomDate, setIsEditingCustomDate] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync initial values when opening modal
  useEffect(() => {
    if (visible) {
      if (initialWeight > 0) {
        setWeight(initialWeight.toFixed(1));
      }
      setSelectedDate(initialDate || getTodayStr());
      setIsEditingCustomDate(false);
    }
  }, [visible, initialWeight, initialDate]);

  const adjustWeight = (delta: number) => {
    const current = parseFloat(weight) || 60;
    const updated = Math.max(20, Math.min(300, current + delta));
    setWeight(updated.toFixed(1));
  };

  const shiftDate = (days: number) => {
    const current = new Date(selectedDate);
    if (isNaN(current.getTime())) return;
    current.setDate(current.getDate() + days);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const formatDateLabel = (dateStr: string) => {
    const today = getTodayStr();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    if (dateStr === today) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSave = async () => {
    const numeric = parseFloat(weight);
    if (isNaN(numeric) || numeric < 20 || numeric > 300) {
      return;
    }
    try {
      setIsSubmitting(true);
      await onSubmit(numeric, note.trim() || undefined, selectedDate);
      setNote('');
      onClose();
    } catch {
      // Handled upstream
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalContent}
            >
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>Log Weight</Text>
                  <Text style={styles.subtitle}>Track your body progress</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color="#8E9388" />
                </TouchableOpacity>
              </View>

              {/* Date Selector Row with Calendar & Quick Shifts */}
              <View style={styles.dateSelectorContainer}>
                <View style={styles.dateNavRow}>
                  <TouchableOpacity
                    style={styles.dateNavBtn}
                    onPress={() => shiftDate(-1)}
                    activeOpacity={0.7}
                  >
                    <ChevronLeft size={18} color="#131313" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dateDisplayBtn}
                    onPress={() => setIsEditingCustomDate(!isEditingCustomDate)}
                    activeOpacity={0.8}
                  >
                    <Calendar size={16} color={theme.colors.saffron} />
                    <Text style={styles.dateDisplayText}>
                      {formatDateLabel(selectedDate)} ({selectedDate})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dateNavBtn}
                    onPress={() => shiftDate(1)}
                    activeOpacity={0.7}
                  >
                    <ChevronRight size={18} color="#131313" />
                  </TouchableOpacity>
                </View>

                {/* Optional Custom Date Direct Input */}
                {isEditingCustomDate && (
                  <View style={styles.customDateInputWrap}>
                    <Text style={styles.customDateLabel}>Select Date (YYYY-MM-DD):</Text>
                    <TextInput
                      style={styles.customDateInput}
                      value={selectedDate}
                      onChangeText={setSelectedDate}
                      placeholder="2026-10-28"
                      placeholderTextColor="#A6ABA1"
                      autoFocus
                    />
                  </View>
                )}

                {/* Quick Date Chips */}
                <View style={styles.quickDateChipsRow}>
                  <TouchableOpacity
                    style={[
                      styles.quickChip,
                      selectedDate === getTodayStr() && styles.quickChipActive,
                    ]}
                    onPress={() => {
                      setSelectedDate(getTodayStr());
                      setIsEditingCustomDate(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.quickChipText,
                        selectedDate === getTodayStr() && styles.quickChipTextActive,
                      ]}
                    >
                      Today
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.quickChip,
                      (() => {
                        const y = new Date();
                        y.setDate(y.getDate() - 1);
                        return selectedDate === y.toISOString().split('T')[0];
                      })() && styles.quickChipActive,
                    ]}
                    onPress={() => {
                      const y = new Date();
                      y.setDate(y.getDate() - 1);
                      setSelectedDate(y.toISOString().split('T')[0]);
                      setIsEditingCustomDate(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.quickChipText,
                        (() => {
                          const y = new Date();
                          y.setDate(y.getDate() - 1);
                          return selectedDate === y.toISOString().split('T')[0];
                        })() && styles.quickChipTextActive,
                      ]}
                    >
                      Yesterday
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Stepper & Input */}
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => adjustWeight(-0.5)}
                  activeOpacity={0.7}
                >
                  <Minus size={20} color="#131313" />
                </TouchableOpacity>

                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.weightInput}
                    keyboardType="decimal-pad"
                    value={weight}
                    onChangeText={setWeight}
                    selectTextOnFocus
                  />
                  <Text style={styles.unitText}>kg</Text>
                </View>

                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => adjustWeight(0.5)}
                  activeOpacity={0.7}
                >
                  <Plus size={20} color="#131313" />
                </TouchableOpacity>
              </View>

              {/* Note input */}
              <View style={styles.noteWrap}>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Add a note (e.g. morning fasting, gym weigh-in)..."
                  placeholderTextColor="#A6ABA1"
                  value={note}
                  onChangeText={setNote}
                  maxLength={100}
                />
              </View>

              {/* Submit CTA */}
              <TouchableOpacity
                style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Entry</Text>
                )}
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: '#131313',
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: '#8E9388',
    marginTop: 2,
  },
  dateSelectorContainer: {
    backgroundColor: '#F8F7F2',
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#ECEAE0',
  },
  dateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E3D8',
  },
  dateDisplayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E3D8',
  },
  dateDisplayText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
    color: '#131313',
  },
  customDateInputWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ECEAE0',
  },
  customDateLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#8E9388',
    marginBottom: 4,
  },
  customDateInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: '#131313',
    borderWidth: 1,
    borderColor: '#E5E3D8',
  },
  quickDateChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    justifyContent: 'center',
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#ECEAE0',
  },
  quickChipActive: {
    backgroundColor: theme.colors.saffron,
  },
  quickChipText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#5B6056',
  },
  quickChipTextActive: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bold,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F4F2E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  weightInput: {
    fontFamily: theme.fonts.extraBold,
    fontSize: 38,
    color: '#131313',
    textAlign: 'center',
    minWidth: 100,
    padding: 0,
  },
  unitText: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#8E9388',
  },
  noteWrap: {
    backgroundColor: '#F8F7F2',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  noteInput: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: '#131313',
  },
  saveBtn: {
    backgroundColor: theme.colors.saffron,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
