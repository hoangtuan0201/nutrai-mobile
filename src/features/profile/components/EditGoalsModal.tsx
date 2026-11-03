import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X, Check, Minus, Plus } from 'lucide-react-native';
import theme from '../../../constants/theme';
import { useProfile } from '../hooks/useProfile';
import { useOnboardingStore } from '../../../store/onboardingStore';

interface EditGoalsModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

type GoalType = 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE';
type ActivityType = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE';

export const EditGoalsModal: React.FC<EditGoalsModalProps> = ({
  visible,
  onClose,
  onSaved,
}) => {
  const { profile, updateProfile, isUpdating } = useProfile();
  const onboarding = useOnboardingStore();

  const initialGoal: GoalType =
    profile?.fitnessGoal ||
    (onboarding.fitnessGoal === 'LOSE_WEIGHT'
      ? 'WEIGHT_LOSS'
      : onboarding.fitnessGoal === 'BUILD_MUSCLE'
      ? 'MUSCLE_GAIN'
      : 'MAINTENANCE');

  const initialActivity: ActivityType =
    (profile?.activityLevel as ActivityType) ||
    (onboarding.activityLevel as ActivityType) ||
    'MODERATE';

  const initialTargetWeight =
    profile?.targetWeightKg ||
    (profile?.weightKg ? profile.weightKg - 2 : 65);

  const [inputGoal, setInputGoal] = useState<GoalType>(initialGoal);
  const [inputActivity, setInputActivity] = useState<ActivityType>(initialActivity);
  const [inputTargetWeight, setInputTargetWeight] = useState<string>(
    initialTargetWeight > 0 ? initialTargetWeight.toFixed(1) : '65.0'
  );

  useEffect(() => {
    if (visible) {
      if (profile?.fitnessGoal) {
        setInputGoal(profile.fitnessGoal);
      }
      if (profile?.activityLevel) {
        setInputActivity(profile.activityLevel as ActivityType);
      }
      const tw = profile?.targetWeightKg || profile?.weightKg || 65;
      setInputTargetWeight(tw > 0 ? tw.toFixed(1) : '65.0');
    }
  }, [visible, profile]);

  const adjustTargetWeight = (delta: number) => {
    const curr = parseFloat(inputTargetWeight) || 65;
    const next = Math.max(20, Math.min(300, curr + delta));
    setInputTargetWeight(next.toFixed(1));
  };

  const handleSave = async () => {
    try {
      const parsedTargetWeight = parseFloat(inputTargetWeight);
      if (isNaN(parsedTargetWeight) || parsedTargetWeight < 20 || parsedTargetWeight > 300) {
        Alert.alert('Invalid Target Weight', 'Please enter a valid weight between 20 and 300 kg.');
        return;
      }

      await updateProfile({
        fitnessGoal: inputGoal,
        activityLevel: inputActivity,
        targetWeightKg: parsedTargetWeight,
      });

      // Synchronize with onboarding store
      onboarding.setTargetWeightKg(parsedTargetWeight);
      onboarding.setActivityLevel(inputActivity);
      onboarding.setGoal(
        inputGoal === 'WEIGHT_LOSS'
          ? 'LOSE_WEIGHT'
          : inputGoal === 'MUSCLE_GAIN'
          ? 'BUILD_MUSCLE'
          : 'MAINTAIN_WEIGHT'
      );

      if (onSaved) {
        onSaved();
      }
      onClose();
    } catch (e) {
      console.error('Failed to update goals:', e);
      Alert.alert('Error', 'Could not update goals. Please try again.');
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
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>Edit Goals & Activity</Text>
                  <Text style={styles.subtitle}>
                    Customize your target weight & fitness plan
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color="#7E8379" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollBody}
              >
                {/* 1. Target Weight Field */}
                <Text style={styles.sectionLabel}>Goal Weight</Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => adjustTargetWeight(-0.5)}
                    activeOpacity={0.7}
                  >
                    <Minus size={18} color="#131313" />
                  </TouchableOpacity>

                  <View style={styles.weightInputWrap}>
                    <TextInput
                      style={styles.weightInput}
                      keyboardType="decimal-pad"
                      value={inputTargetWeight}
                      onChangeText={setInputTargetWeight}
                      selectTextOnFocus
                    />
                    <Text style={styles.unitText}>kg</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => adjustTargetWeight(0.5)}
                    activeOpacity={0.7}
                  >
                    <Plus size={18} color="#131313" />
                  </TouchableOpacity>
                </View>

                {/* 2. Fitness Goal Options */}
                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
                  Fitness Goal
                </Text>
                {(
                  [
                    { id: 'WEIGHT_LOSS', label: 'Lose fat' },
                    { id: 'MUSCLE_GAIN', label: 'Build muscle' },
                    { id: 'MAINTENANCE', label: 'Maintain weight' },
                  ] as const
                ).map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      styles.selectOption,
                      inputGoal === g.id && styles.selectOptionActive,
                    ]}
                    onPress={() => setInputGoal(g.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        inputGoal === g.id && styles.selectOptionTextActive,
                      ]}
                    >
                      {g.label}
                    </Text>
                    {inputGoal === g.id && <Check size={18} color={theme.colors.saffron} />}
                  </TouchableOpacity>
                ))}

                {/* 3. Activity Level Options */}
                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
                  Activity Level
                </Text>
                {(
                  [
                    { id: 'SEDENTARY', label: 'Sedentary (Little/no exercise)' },
                    { id: 'LIGHT', label: 'Lightly Active (1-3 days/wk)' },
                    { id: 'MODERATE', label: 'Moderately Active (3-5 days/wk)' },
                    { id: 'VERY_ACTIVE', label: 'Very Active (6-7 days/wk)' },
                  ] as const
                ).map((lvl) => (
                  <TouchableOpacity
                    key={lvl.id}
                    style={[
                      styles.selectOption,
                      inputActivity === lvl.id && styles.selectOptionActive,
                    ]}
                    onPress={() => setInputActivity(lvl.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        inputActivity === lvl.id && styles.selectOptionTextActive,
                      ]}
                    >
                      {lvl.label}
                    </Text>
                    {inputActivity === lvl.id && (
                      <Check size={18} color={theme.colors.saffron} />
                    )}
                  </TouchableOpacity>
                ))}

                {/* Save CTA Button */}
                <TouchableOpacity
                  style={[styles.saveBtn, isUpdating && styles.saveBtnDisabled]}
                  activeOpacity={0.8}
                  onPress={handleSave}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2EFE8',
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#131313',
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: '#767B71',
  },
  scrollBody: {
    paddingBottom: 10,
  },
  sectionLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: '#131313',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F7F2',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 6,
    gap: 16,
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAE1',
  },
  weightInputWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  weightInput: {
    fontFamily: theme.fonts.extraBold,
    fontSize: 28,
    color: '#131313',
    textAlign: 'center',
    minWidth: 80,
    padding: 0,
  },
  unitText: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: '#8E9388',
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECEAE1',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  selectOptionActive: {
    borderColor: theme.colors.saffron,
    backgroundColor: '#FFFBF5',
  },
  selectOptionText: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: '#131313',
  },
  selectOptionTextActive: {
    fontFamily: theme.fonts.bold,
    color: '#131313',
  },
  saveBtn: {
    backgroundColor: theme.colors.saffron,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: theme.colors.saffron,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
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
