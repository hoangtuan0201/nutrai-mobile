/**
 * user-metrics.tsx — CaloriQ-inspired "Tell us about yourself" screen
 * With inline numeric inputs, unit toggles (cm/ft, kg/lbs), and biological sex selection.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button } from '../../src/components';

// ─── Segmented progress bar ─────────────────────────────────────────
const TOTAL_STEPS = 4;
function StepBar({ step }: { step: number }) {
  return (
    <View style={barStyles.row}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[barStyles.segment, i < step && barStyles.segmentActive]}
        />
      ))}
    </View>
  );
}
const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, flex: 1, marginHorizontal: 10 },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(19,19,19,0.10)',
  },
  segmentActive: { backgroundColor: theme.colors.saffron },
});

import { useOnboardingStore } from '../../src/store/onboardingStore';
import {
  cmToFt,
  ftToCm,
  kgToLb,
  lbToKg,
} from '../../src/utils/nutritionCalculator';

type Gender = 'male' | 'female';
type HeightUnit = 'cm' | 'ft';
type WeightUnit = 'kg' | 'lbs';

export default function UserMetricsScreen() {
  const router = useRouter();
  const setMetrics = useOnboardingStore((s) => s.setMetrics);

  const initialStore = useOnboardingStore.getState();

  const [gender, setGender] = useState<Gender>(
    initialStore.gender === 'FEMALE' ? 'female' : 'male',
  );
  const [age, setAge] = useState(
    initialStore.age ? initialStore.age.toString() : '26',
  );

  // Height state
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [height, setHeight] = useState(
    initialStore.heightCm ? initialStore.heightCm.toString() : '175',
  );

  // Weight state
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [weight, setWeight] = useState(
    initialStore.weightKg ? initialStore.weightKg.toString() : '70',
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleHeightUnitToggle = (unit: HeightUnit) => {
    if (unit === heightUnit) return;
    const currentVal = parseFloat(height);
    if (!isNaN(currentVal) && currentVal > 0) {
      if (unit === 'ft') {
        setHeight(cmToFt(currentVal).toFixed(1));
      } else {
        setHeight(ftToCm(currentVal).toString());
      }
    }
    setHeightUnit(unit);
  };

  const handleWeightUnitToggle = (unit: WeightUnit) => {
    if (unit === weightUnit) return;
    const currentVal = parseFloat(weight);
    if (!isNaN(currentVal) && currentVal > 0) {
      if (unit === 'lbs') {
        setWeight(Math.round(kgToLb(currentVal)).toString());
      } else {
        setWeight(Math.round(lbToKg(currentVal)).toString());
      }
    }
    setWeightUnit(unit);
  };

  const handleNext = () => {
    setErrorMsg(null);
    const parsedHeight = parseFloat(height);
    const parsedWeight = parseFloat(weight);
    const parsedAge = parseInt(age, 10);

    if (isNaN(parsedHeight) || parsedHeight <= 0) {
      setErrorMsg('Please enter a valid height.');
      return;
    }
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setErrorMsg('Please enter a valid weight.');
      return;
    }
    if (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 120) {
      setErrorMsg('Please enter a valid age between 10 and 120.');
      return;
    }

    const finalHeightCm =
      heightUnit === 'cm'
        ? Math.round(parsedHeight)
        : ftToCm(parsedHeight);

    const finalWeightKg =
      weightUnit === 'kg'
        ? Math.round(parsedWeight)
        : Math.round(lbToKg(parsedWeight));

    if (finalHeightCm < 80 || finalHeightCm > 260) {
      setErrorMsg('Height must be between 80 cm and 260 cm.');
      return;
    }
    if (finalWeightKg < 30 || finalWeightKg > 350) {
      setErrorMsg('Weight must be between 30 kg and 350 kg.');
      return;
    }

    // Save to global onboarding store
    setMetrics({
      gender: gender === 'female' ? 'FEMALE' : 'MALE',
      age: parsedAge,
      heightCm: finalHeightCm,
      weightKg: finalWeightKg,
    });

    router.push('/(auth)/activity-level' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <StepBar step={2} />
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => router.push('/(auth)/activity-level' as any)}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title & Subtitle */}
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>
            We use these metrics to calculate your BMR and baseline daily energy needs.
          </Text>

          {/* Biological Sex Section */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>
              Biological Sex (for metabolic rate calculation)
            </Text>
            <View style={styles.genderRow}>
              {([
                { id: 'male' as Gender, emoji: '👨', label: 'Male' },
                { id: 'female' as Gender, emoji: '👩', label: 'Female' },
              ] as { id: Gender; emoji: string; label: string }[]).map((g) => {
                const active = gender === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.genderCard, active && styles.genderCardActive]}
                    activeOpacity={0.8}
                    onPress={() => setGender(g.id)}
                  >
                    <Text style={styles.genderEmoji}>{g.emoji}</Text>
                    <Text
                      style={[
                        styles.genderLabel,
                        active && styles.genderLabelActive,
                      ]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Height Input with cm / ft toggle */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldHeaderRow}>
              <Text style={styles.fieldLabel}>Height</Text>
              <View style={styles.togglePill}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    heightUnit === 'cm' && styles.toggleBtnActive,
                  ]}
                  onPress={() => handleHeightUnitToggle('cm')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      heightUnit === 'cm' && styles.toggleTextActive,
                    ]}
                  >
                    cm
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    heightUnit === 'ft' && styles.toggleBtnActive,
                  ]}
                  onPress={() => handleHeightUnitToggle('ft')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      heightUnit === 'ft' && styles.toggleTextActive,
                    ]}
                  >
                    ft
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.numericInput}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="180"
                placeholderTextColor={theme.colors.textMuted}
              />
              <Text style={styles.unitText}>{heightUnit}</Text>
            </View>
          </View>

          {/* Current Weight Input with kg / lbs toggle */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldHeaderRow}>
              <Text style={styles.fieldLabel}>Current Weight</Text>
              <View style={styles.togglePill}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    weightUnit === 'kg' && styles.toggleBtnActive,
                  ]}
                  onPress={() => handleWeightUnitToggle('kg')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      weightUnit === 'kg' && styles.toggleTextActive,
                    ]}
                  >
                    kg
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    weightUnit === 'lbs' && styles.toggleBtnActive,
                  ]}
                  onPress={() => handleWeightUnitToggle('lbs')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      weightUnit === 'lbs' && styles.toggleTextActive,
                    ]}
                  >
                    lbs
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.numericInput}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="82"
                placeholderTextColor={theme.colors.textMuted}
              />
              <Text style={styles.unitText}>{weightUnit}</Text>
            </View>
          </View>

          {/* Age Input */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Age</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.numericInput}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="26"
                placeholderTextColor={theme.colors.textMuted}
              />
              <Text style={styles.unitText}>years</Text>
            </View>
          </View>

          {/* Error Banner */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Trust badge */}
          <View style={styles.trustBadge}>
            <Text style={styles.trustText}>
              Backed by science: Mifflin–St Jeor equation for clinical-grade precision.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Next"
            size="lg"
            variant="primary"
            fullWidth
            onPress={handleNext}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceBase,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenMargin,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19, 19, 19, 0.05)',
  },
  skipText: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 10,
  },
  scroll: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 28,
    lineHeight: 36,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    marginBottom: 24,
  },
  fieldSection: {
    marginBottom: 20,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(19, 19, 19, 0.06)',
    borderRadius: 8,
    padding: 2,
    alignItems: 'center',
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  toggleTextActive: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(19, 19, 19, 0.07)',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  numericInput: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: theme.colors.textPrimary,
    paddingVertical: 0,
  },
  unitText: {
    fontFamily: theme.fonts.medium,
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(19, 19, 19, 0.08)',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  genderCardActive: {
    borderColor: theme.colors.saffron,
    borderWidth: 2,
    backgroundColor: '#FFFBF5',
  },
  genderEmoji: {
    fontSize: 32,
  },
  genderLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  genderLabelActive: {
    color: theme.colors.saffron,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: '#B91C1C',
    textAlign: 'center',
  },
  trustBadge: {
    backgroundColor: 'rgba(200, 194, 155, 0.22)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
  },
  trustText: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },
  footer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingBottom: 28,
    paddingTop: 12,
  },
});
