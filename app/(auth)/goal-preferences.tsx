/**
 * goal-preferences.tsx — Onboarding Step 6: "What's your goal weight?"
 * Clean, simple numeric form input for target weight, goal delta assessment,
 * target BMI, and goal-specific pace options.
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Target,
  Minus,
  Plus,
} from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, OnboardingHeader } from '../../src/components';
import {
  useOnboardingStore,
  PaceRateId,
} from '../../src/store/onboardingStore';
import {
  getPaceOptionsForGoal,
  validateTargetWeight,
  kgToLb,
  lbToKg,
  calculateBMI,
} from '../../src/utils/nutritionCalculator';

type WeightUnit = 'kg' | 'lbs';

export default function GoalPreferencesScreen() {
  const router = useRouter();
  const initialStore = useOnboardingStore.getState();

  const fitnessGoal = useOnboardingStore((s) => s.fitnessGoal);
  const currentWeightKg = useOnboardingStore((s) => s.weightKg) || 70;
  const userHeightCm = useOnboardingStore((s) => s.heightCm) || 170;

  // Determine initial valid target weight based on goal
  const getInitialTargetWeight = () => {
    const stored = initialStore.targetWeightKg;
    if (fitnessGoal === 'LOSE_WEIGHT') {
      return stored && stored < currentWeightKg
        ? stored
        : Math.max(30, currentWeightKg - 4);
    }
    if (fitnessGoal === 'BUILD_MUSCLE') {
      return stored && stored > currentWeightKg
        ? stored
        : currentWeightKg + 3;
    }
    return currentWeightKg;
  };

  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [valString, setValString] = useState<string>(
    getInitialTargetWeight().toFixed(1),
  );

  const targetWeightKg = useMemo(() => {
    const parsed = parseFloat(valString) || currentWeightKg;
    return unit === 'kg' ? parsed : lbToKg(parsed);
  }, [valString, unit, currentWeightKg]);

  const paceOptions = useMemo(
    () => getPaceOptionsForGoal(fitnessGoal),
    [fitnessGoal],
  );

  const [paceId, setPaceId] = useState<PaceRateId>(() => {
    if (fitnessGoal === 'BUILD_MUSCLE') return 'slow';
    return 'moderate';
  });

  const handleUnitToggle = (newUnit: WeightUnit) => {
    if (newUnit === unit) return;
    const current = parseFloat(valString) || currentWeightKg;
    if (newUnit === 'lbs') {
      setValString(kgToLb(current).toFixed(1));
    } else {
      setValString(lbToKg(current).toFixed(1));
    }
    setUnit(newUnit);
  };

  const adjustValue = (delta: number) => {
    const current = parseFloat(valString) || currentWeightKg;
    const next = Math.max(20, Math.min(300, current + delta));
    setValString(next.toFixed(1));
  };

  // Validation
  const validation = useMemo(
    () => validateTargetWeight(currentWeightKg, targetWeightKg, fitnessGoal),
    [currentWeightKg, targetWeightKg, fitnessGoal],
  );

  // Target BMI Assessment
  const targetBmi = useMemo(() => {
    return calculateBMI(targetWeightKg, userHeightCm);
  }, [targetWeightKg, userHeightCm]);

  // Delta calculation
  const deltaKg =
    Math.round(Math.abs(targetWeightKg - currentWeightKg) * 10) / 10;
  const deltaPct =
    currentWeightKg > 0
      ? Math.round((Math.abs(targetWeightKg - currentWeightKg) / currentWeightKg) * 1000) / 10
      : 0;

  const displayCurrentWeight =
    unit === 'kg'
      ? currentWeightKg.toFixed(1)
      : kgToLb(currentWeightKg).toFixed(1);

  const handleContinue = () => {
    if (!validation.isValid) return;

    const store = useOnboardingStore.getState();
    const selectedPaceOption =
      paceOptions.find((p) => p.id === paceId) || paceOptions[0];

    store.setGoalPreferences({
      targetWeightKg: Math.round(targetWeightKg * 10) / 10,
      pace: paceId,
      weeklyPaceKg: selectedPaceOption.weeklyRateKg,
    });

    router.push('/(auth)/activity-level' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <OnboardingHeader step={6} totalSteps={7} />

            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header row with title and unit toggle */}
              <View style={styles.titleRow}>
                <View>
                  <Text style={styles.title}>What's your{'\n'}goal weight?</Text>
                  <Text style={styles.subtitle}>
                    Current: <Text style={styles.currentValue}>{displayCurrentWeight} {unit}</Text>
                  </Text>
                </View>

                <View style={styles.unitToggle}>
                  <TouchableOpacity
                    style={[styles.unitBtn, unit === 'kg' && styles.unitBtnActive]}
                    onPress={() => handleUnitToggle('kg')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.unitText,
                        unit === 'kg' && styles.unitTextActive,
                      ]}
                    >
                      kg
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unitBtn, unit === 'lbs' && styles.unitBtnActive]}
                    onPress={() => handleUnitToggle('lbs')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.unitText,
                        unit === 'lbs' && styles.unitTextActive,
                      ]}
                    >
                      lbs
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form Input Card */}
              <View style={styles.card}>
                <View style={styles.inputRow}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => adjustValue(-0.5)}
                    activeOpacity={0.7}
                  >
                    <Minus size={22} color={theme.colors.textPrimary} />
                  </TouchableOpacity>

                  <View style={styles.numericWrap}>
                    <TextInput
                      style={styles.numericInput}
                      value={valString}
                      onChangeText={setValString}
                      keyboardType="decimal-pad"
                      maxLength={5}
                      selectTextOnFocus
                    />
                    <Text style={styles.unitLabel}>{unit}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => adjustValue(0.5)}
                    activeOpacity={0.7}
                  >
                    <Plus size={22} color={theme.colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dynamic Goal Assessment Card */}
              <View style={styles.assessmentCard}>
                <View style={styles.assessmentTopRow}>
                  <View style={styles.assessmentTitleWrap}>
                    <Target size={18} color={theme.colors.saffron} />
                    <Text style={styles.assessmentTitle}>
                      {fitnessGoal === 'LOSE_WEIGHT' &&
                        `Target: lose ${deltaKg} kg (${deltaPct}%)`}
                      {fitnessGoal === 'BUILD_MUSCLE' &&
                        `Target: gain ${deltaKg} kg (+${deltaPct}%)`}
                      {fitnessGoal === 'MAINTAIN_WEIGHT' &&
                        'Target: maintain current weight'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.targetBmiBadge,
                      { backgroundColor: targetBmi.categoryBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.targetBmiText,
                        { color: targetBmi.categoryColor },
                      ]}
                    >
                      Target BMI: {targetBmi.bmi}
                    </Text>
                  </View>
                </View>

                {/* Validation Warnings / Feedback */}
                {!validation.isValid && validation.error ? (
                  <View style={styles.warningBox}>
                    <AlertCircle size={16} color="#DC2626" />
                    <Text style={styles.warningText}>{validation.error}</Text>
                  </View>
                ) : validation.warning ? (
                  <View style={styles.infoBox}>
                    <AlertCircle size={16} color="#D97706" />
                    <Text style={styles.infoText}>{validation.warning}</Text>
                  </View>
                ) : (
                  <View style={styles.validBox}>
                    <CheckCircle2 size={16} color="#16A34A" />
                    <Text style={styles.validText}>
                      {fitnessGoal === 'LOSE_WEIGHT' &&
                        `Target weight is safely aligned below your current weight.`}
                      {fitnessGoal === 'BUILD_MUSCLE' &&
                        `Target weight is realistic for building quality lean muscle.`}
                      {fitnessGoal === 'MAINTAIN_WEIGHT' &&
                        'Target weight matches weight maintenance strategy.'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Goal-Specific Preferred Pace Selection */}
              {fitnessGoal === 'MAINTAIN_WEIGHT' ? (
                <View style={styles.maintenanceCard}>
                  <ShieldCheck size={24} color={theme.colors.saffron} />
                  <View style={styles.maintenanceTextWrap}>
                    <Text style={styles.maintenanceTitle}>
                      Weight Maintenance Strategy
                    </Text>
                    <Text style={styles.maintenanceDesc}>
                      No calorie surplus or deficit is required. Your energy targets
                      will match your total daily expenditure (TDEE) to keep your
                      weight stable.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.paceSection}>
                  <Text style={styles.sectionTitle}>
                    {fitnessGoal === 'BUILD_MUSCLE'
                      ? 'Preferred muscle-building rate'
                      : 'Preferred pace'}
                  </Text>
                  <View style={styles.paceList}>
                    {paceOptions.map((item) => {
                      const isSelected = paceId === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          activeOpacity={0.8}
                          onPress={() => setPaceId(item.id)}
                          style={[
                            styles.paceCard,
                            isSelected && styles.paceCardActive,
                          ]}
                        >
                          <View style={styles.paceLeft}>
                            <Text
                              style={[
                                styles.paceLabel,
                                isSelected && styles.paceLabelActive,
                              ]}
                            >
                              {item.label}
                            </Text>
                            <Text style={styles.paceRate}>{item.rateDisplay}</Text>
                          </View>
                          <View style={styles.paceRight}>
                            <View
                              style={[
                                styles.paceBadge,
                                item.badge === 'Recommended' &&
                                  styles.paceBadgeHighlight,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.paceBadgeText,
                                  item.badge === 'Recommended' &&
                                    styles.paceBadgeTextHighlight,
                                ]}
                              >
                                {item.badge}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.radio,
                                isSelected && styles.radioActive,
                              ]}
                            >
                              {isSelected && <View style={styles.radioDot} />}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <Button
                title="Continue"
                size="lg"
                variant="primary"
                fullWidth
                disabled={!validation.isValid}
                onPress={handleContinue}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surfaceBase },
  inner: { flex: 1 },
  scroll: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: 16,
    paddingBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 30,
    lineHeight: 38,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  currentValue: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(19, 19, 19, 0.08)',
    borderRadius: 14,
    padding: 3,
    marginTop: 4,
  },
  unitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 11,
  },
  unitBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  unitText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  unitTextActive: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 26,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(19, 19, 19, 0.07)',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(19, 19, 19, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numericWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  numericInput: {
    fontFamily: theme.fonts.extraBold,
    fontSize: 54,
    color: theme.colors.textPrimary,
    letterSpacing: -1,
    minWidth: 120,
    textAlign: 'center',
    paddingVertical: 0,
  },
  unitLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 22,
    color: theme.colors.textSecondary,
  },
  assessmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(19, 19, 19, 0.07)',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    gap: 12,
  },
  assessmentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  assessmentTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  assessmentTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  targetBmiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  targetBmiText: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  warningText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#B91C1C',
    flex: 1,
    lineHeight: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  infoText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    lineHeight: 16,
  },
  validBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  validText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#15803D',
    flex: 1,
    lineHeight: 16,
  },
  paceSection: {
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  paceList: { gap: 12 },
  paceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(19, 19, 19, 0.07)',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  paceCardActive: {
    borderColor: theme.colors.saffron,
    borderWidth: 2,
    backgroundColor: '#FFFBF5',
  },
  paceLeft: { flex: 1 },
  paceLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  paceLabelActive: { color: theme.colors.textPrimary },
  paceRate: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.saffron,
  },
  paceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(19, 19, 19, 0.07)',
  },
  paceBadgeHighlight: {
    backgroundColor: 'rgba(255, 145, 20, 0.15)',
  },
  paceBadgeText: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  paceBadgeTextHighlight: {
    color: theme.colors.saffron,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(19, 19, 19, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: theme.colors.saffron },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.saffron,
  },
  maintenanceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(19, 19, 19, 0.07)',
  },
  maintenanceTextWrap: { flex: 1 },
  maintenanceTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  maintenanceDesc: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingBottom: 32,
    paddingTop: 12,
  },
});
