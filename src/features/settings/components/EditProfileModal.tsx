import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { ProfileSummary, ProfileGoal } from '../hooks/useProfileSummary';
import { BodyUnit } from '../../../store/unitStore';
import { ActivityLevelType, GenderType, kgToLb, lbToKg } from '../../../utils/nutritionCalculator';

export type EditType = 'personal' | 'goals';

interface Props {
  visible: boolean;
  type: EditType;
  summary: ProfileSummary;
  bodyUnit: BodyUnit;
  onClose: () => void;
}

const GOALS = [
  { id: 'WEIGHT_LOSS', label: 'Lose fat' },
  { id: 'MUSCLE_GAIN', label: 'Build muscle' },
  { id: 'MAINTENANCE', label: 'Maintain weight' },
] as const;

const ACTIVITIES = [
  { id: 'SEDENTARY', label: 'Sedentary (Little/no exercise)' },
  { id: 'LIGHT', label: 'Lightly Active (1-3 days/wk)' },
  { id: 'MODERATE', label: 'Moderately Active (3-5 days/wk)' },
  { id: 'VERY_ACTIVE', label: 'Very Active (6-7 days/wk)' },
] as const;

export function EditProfileModal({ visible, type, summary, bodyUnit, onClose }: Props) {
  const { colors } = useAppTheme();
  const { updateProfile, isUpdating, onboarding } = summary;
  const imperial = bodyUnit === 'imperial';

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<GenderType>('MALE');
  const [goal, setGoal] = useState<ProfileGoal>('MAINTENANCE');
  const [activity, setActivity] = useState<ActivityLevelType>('MODERATE');
  const [targetWeight, setTargetWeight] = useState('');

  // Re-seed the form every time the modal opens
  useEffect(() => {
    if (!visible) return;
    setWeight(imperial ? kgToLb(summary.weightKg).toFixed(1) : String(summary.weightKg));
    setHeight(imperial ? String(Math.round(summary.heightCm / 2.54)) : String(summary.heightCm));
    setTargetWeight(imperial ? kgToLb(summary.targetWeightKg).toFixed(1) : String(summary.targetWeightKg));
    setAge(String(summary.age));
    setGender(summary.gender);
    setGoal(summary.goal);
    setActivity(summary.activity);
  }, [visible]);

  const handleSave = async () => {
    try {
      let w = parseFloat(weight) || summary.weightKg;
      let h = parseFloat(height) || summary.heightCm;
      let tw = parseFloat(targetWeight) || summary.weightKg;
      if (imperial) {
        w = lbToKg(w);
        h = Math.round(h * 2.54);
        tw = lbToKg(tw);
      }
      const parsedAge = parseInt(age, 10) || summary.age;
      const dob =
        parsedAge === summary.age && summary.profile?.dateOfBirth
          ? summary.profile.dateOfBirth.split('T')[0]
          : `${new Date().getFullYear() - parsedAge}-01-01`;

      if (type === 'personal') {
        await updateProfile({ weightKg: w, heightCm: h, gender, dateOfBirth: dob });
      } else {
        await updateProfile({ targetWeightKg: tw, activityLevel: activity, fitnessGoal: goal });
      }

      // Keep onboarding store in sync
      onboarding.setMetrics({ weightKg: w, heightCm: h, gender, age: parsedAge });
      onboarding.setTargetWeightKg(tw);
      onboarding.setActivityLevel(activity);
      onboarding.setGoal(goal === 'WEIGHT_LOSS' ? 'LOSE_WEIGHT' : goal === 'MUSCLE_GAIN' ? 'BUILD_MUSCLE' : 'MAINTAIN_WEIGHT');
      onClose();
    } catch (e) {
      console.error('Failed to update profile:', e);
      Alert.alert('Error', 'Could not update settings. Please try again.');
    }
  };

  const inputStyle = [styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }];
  const label = (text: string) => <Text style={[styles.label, { color: colors.textPrimary }]}>{text}</Text>;

  const Option = ({ active, text, onPress }: { active: boolean; text: string; onPress: () => void }) => (
    <TouchableOpacity
      style={[
        styles.option,
        { backgroundColor: colors.inputBg, borderColor: colors.border },
        active && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, { color: colors.textPrimary }, active && styles.bold]}>{text}</Text>
      {active && <Check size={18} color={colors.accent} />}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
              {type === 'personal' ? 'Edit Personal Info' : 'Edit Goals & Activity'}
            </Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceMuted }]}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {type === 'personal' ? (
              <>
                {label(`Weight (${imperial ? 'lbs' : 'kg'})`)}
                <TextInput style={inputStyle} keyboardType="numeric" value={weight} onChangeText={setWeight} />
                {label(`Height (${imperial ? 'inches' : 'cm'})`)}
                <TextInput style={inputStyle} keyboardType="numeric" value={height} onChangeText={setHeight} />
                {label('Age (years)')}
                <TextInput style={inputStyle} keyboardType="numeric" value={age} onChangeText={setAge} />
                {label('Gender')}
                <View style={styles.radioRow}>
                  {(['MALE', 'FEMALE'] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.radio,
                        { backgroundColor: colors.inputBg, borderColor: colors.border },
                        gender === g && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => setGender(g)}
                    >
                      <Text style={[styles.optionText, { color: gender === g ? colors.onPrimary : colors.textPrimary }, styles.bold]}>
                        {g === 'MALE' ? 'Male' : 'Female'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                {label(`Goal Weight (${imperial ? 'lb' : 'kg'})`)}
                <TextInput
                  style={inputStyle}
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  keyboardType="decimal-pad"
                  placeholder="Enter goal weight"
                  placeholderTextColor={colors.textMuted}
                />
                {label('Fitness Goal')}
                {GOALS.map((g) => (
                  <Option key={g.id} active={goal === g.id} text={g.label} onPress={() => setGoal(g.id)} />
                ))}
                {label('Activity Level')}
                {ACTIVITIES.map((a) => (
                  <Option key={a.id} active={activity === a.id} text={a.label} onPress={() => setActivity(a.id)} />
                ))}
              </>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Text style={[styles.saveText, { color: colors.onPrimary }]}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '88%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontFamily: 'Manrope_800ExtraBold' },
  closeBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontFamily: 'Manrope_700Bold', marginBottom: 8, marginTop: 16 },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: 'Manrope_600SemiBold', borderWidth: 1 },
  radioRow: { flexDirection: 'row', gap: 12 },
  radio: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  optionText: { fontSize: 14, fontFamily: 'Manrope_600SemiBold' },
  bold: { fontFamily: 'Manrope_700Bold' },
  saveBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 24, marginBottom: 24 },
  saveText: { fontSize: 15, fontFamily: 'Manrope_700Bold' },
});

