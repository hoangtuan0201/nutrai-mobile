/**
 * goal-preferences.tsx — CaloriQ-inspired "Lets set the goal you are going to crush!"
 * Target weight with goal-specific validation + goal-specific pace selection cards.
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button } from '../../src/components';
import {
  useOnboardingStore,
  PaceRateId,
} from '../../src/store/onboardingStore';
import {
  calculateClientNutritionPlan,
  getPaceOptionsForGoal,
  validateTargetWeight,
  kgToLb,
  lbToKg,
} from '../../src/utils/nutritionCalculator';

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

// ─── Weight unit toggle ───────────────────────────────────────────────
type WeightUnit = 'KG' | 'LB';

// ─── Custom Dynamic Slider ───────────────────────────────────────────
interface WeightSliderProps {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  unit: WeightUnit;
}

function WeightSlider({ value, onChange, min, max, unit }: WeightSliderProps) {
  const trackWidth = useRef(0);
  const safeMin = Math.min(min, max - 1);
  const safeMax = Math.max(max, safeMin + 1);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        if (trackWidth.current === 0) return;
        const ratio = Math.max(0, Math.min(1, gs.moveX / trackWidth.current));
        const newVal = Math.round(safeMin + ratio * (safeMax - safeMin));
        onChange(newVal);
      },
    }),
  ).current;

  const onTrackLayout = (e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
  };

  const clampedVal = Math.max(safeMin, Math.min(safeMax, value));
  const pct = ((clampedVal - safeMin) / (safeMax - safeMin)) * 100;

  // Generate 5 tick marks
  const step = (safeMax - safeMin) / 4;
  const ticks = [
    Math.round(safeMin),
    Math.round(safeMin + step),
    Math.round(safeMin + step * 2),
    Math.round(safeMin + step * 3),
    Math.round(safeMax),
  ];

  return (
    <View
      style={sliderStyles.container}
      onLayout={onTrackLayout}
      {...panResponder.panHandlers}
    >
      {/* Track */}
      <View style={sliderStyles.track}>
        <View style={[sliderStyles.fill, { width: `${pct}%` }]} />
      </View>
      {/* Thumb */}
      <View
        style={[sliderStyles.thumb, { left: `${pct}%` }]}
        pointerEvents="none"
      />
      {/* Tick labels */}
      <View style={sliderStyles.labels}>
        {ticks.map((tick, i) => {
          const displayTick =
            unit === 'LB' ? Math.round(kgToLb(tick)) : tick;
          return (
            <Text key={i} style={sliderStyles.label}>
              {displayTick}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 4,
  },
  track: {
    height: 6,
    backgroundColor: 'rgba(19,19,19,0.10)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: theme.colors.saffron,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    top: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.saffron,
    marginLeft: -12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: theme.colors.saffron,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
});

export default function GoalPreferencesScreen() {
  const router = useRouter();
  const initialStore = useOnboardingStore.getState();

  const fitnessGoal = useOnboardingStore((s) => s.fitnessGoal);
  const currentWeightKg = useOnboardingStore((s) => s.weightKg) || 70;

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
    // MAINTAIN_WEIGHT
    return currentWeightKg;
  };

  const [unit, setUnit] = useState<WeightUnit>('KG');
  const [targetWeight, setTargetWeight] = useState<number>(getInitialTargetWeight);

  const paceOptions = useMemo(
    () => getPaceOptionsForGoal(fitnessGoal),
    [fitnessGoal],
  );

  const [paceId, setPaceId] = useState<PaceRateId>(() => {
    if (fitnessGoal === 'BUILD_MUSCLE') return 'slow'; // default lean bulk for muscle building
    return 'moderate';
  });

  // Calculate dynamic slider limits
  const { sliderMin, sliderMax } = useMemo(() => {
    let min = Math.max(30, currentWeightKg - 35);
    let max = Math.min(220, currentWeightKg + 35);

    if (fitnessGoal === 'LOSE_WEIGHT') {
      min = Math.max(30, currentWeightKg - 40);
      max = currentWeightKg + 5; // allow dragging slightly over to trigger warning
    } else if (fitnessGoal === 'BUILD_MUSCLE') {
      min = Math.max(30, currentWeightKg - 5);
      max = Math.min(220, currentWeightKg + 40);
    } else {
      // MAINTAIN_WEIGHT
      min = Math.max(30, currentWeightKg - 10);
      max = currentWeightKg + 10;
    }
    return { sliderMin: min, sliderMax: max };
  }, [fitnessGoal, currentWeightKg]);

  // Validation
  const validation = useMemo(
    () => validateTargetWeight(currentWeightKg, targetWeight, fitnessGoal),
    [currentWeightKg, targetWeight, fitnessGoal],
  );

  const displayTargetWeight =
    unit === 'LB' ? Math.round(kgToLb(targetWeight)) : targetWeight;

  const displayCurrentWeight =
    unit === 'LB' ? Math.round(kgToLb(currentWeightKg)) : currentWeightKg;

  const handleCalculate = () => {
    if (!validation.isValid) return;

    const store = useOnboardingStore.getState();
    const selectedPaceOption =
      paceOptions.find((p) => p.id === paceId) || paceOptions[0];

    // Save preferences to store
    store.setGoalPreferences({
      targetWeightKg: targetWeight,
      pace: paceId,
      weeklyPaceKg: selectedPaceOption.weeklyRateKg,
    });

    // Compute plan with complete user profile
    const plan = calculateClientNutritionPlan({
      gender: store.gender,
      weightKg: store.weightKg,
      heightCm: store.heightCm,
      age: store.age,
      activityLevel: store.activityLevel,
      fitnessGoal: store.fitnessGoal,
      pace: paceId,
      weeklyPaceKg: selectedPaceOption.weeklyRateKg,
    });

    store.setCalculatedPlan(plan);
    router.push('/(auth)/plan-preview' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <StepBar step={4} />
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => router.push('/(auth)/plan-preview' as any)}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Let's set the goal{'\n'}you are going to crush!
        </Text>

        {/* Current weight reference */}
        <View style={styles.currentWeightPill}>
          <Text style={styles.currentWeightText}>
            Current weight:{' '}
            <Text style={styles.currentWeightValue}>
              {displayCurrentWeight} {unit.toLowerCase()}
            </Text>
          </Text>
        </View>

        {/* Unit toggle KG / LB */}
        <View style={styles.unitToggle}>
          {(['KG', 'LB'] as WeightUnit[]).map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
              onPress={() => setUnit(u)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.unitText,
                  unit === u && styles.unitTextActive,
                ]}
              >
                {u}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Target Weight Card */}
        <View style={styles.weightCard}>
          <Text style={styles.weightCaption}>
            {fitnessGoal === 'MAINTAIN_WEIGHT'
              ? 'Target weight (Maintenance)'
              : 'Your target weight'}
          </Text>
          <Text style={styles.weightValue}>
            {displayTargetWeight}{' '}
            <Text style={styles.weightUnit}>{unit.toLowerCase()}</Text>
          </Text>

          <WeightSlider
            value={targetWeight}
            onChange={setTargetWeight}
            min={sliderMin}
            max={sliderMax}
            unit={unit}
          />

          {/* Validation Error/Warning */}
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
                  `Target is ${Math.round((currentWeightKg - targetWeight) * (unit === 'LB' ? 2.20462 : 1))} ${unit.toLowerCase()} below current weight.`}
                {fitnessGoal === 'BUILD_MUSCLE' &&
                  `Target is ${Math.round((targetWeight - currentWeightKg) * (unit === 'LB' ? 2.20462 : 1))} ${unit.toLowerCase()} above current weight.`}
                {fitnessGoal === 'MAINTAIN_WEIGHT' &&
                  'Target aligned with maintaining current weight.'}
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
          <>
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
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Calculate My Targets"
          size="lg"
          variant="primary"
          fullWidth
          disabled={!validation.isValid}
          onPress={handleCalculate}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surfaceBase },
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
    backgroundColor: 'rgba(19,19,19,0.05)',
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
    fontSize: 26,
    lineHeight: 34,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  currentWeightPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(19,19,19,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  currentWeightText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  currentWeightValue: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(19,19,19,0.07)',
    borderRadius: 14,
    padding: 4,
    alignSelf: 'center',
    marginBottom: 20,
  },
  unitBtn: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 10,
  },
  unitBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  unitText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  unitTextActive: {
    color: theme.colors.textPrimary,
  },
  weightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(19,19,19,0.07)',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  weightCaption: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  weightValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 48,
    lineHeight: 56,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -1,
  },
  weightUnit: {
    fontFamily: theme.fonts.regular,
    fontSize: 22,
    color: theme.colors.textSecondary,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
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
    marginTop: 8,
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
    marginTop: 8,
  },
  validText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#15803D',
    flex: 1,
    lineHeight: 16,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    color: theme.colors.textPrimary,
    marginBottom: 14,
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
    borderColor: 'rgba(19,19,19,0.07)',
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
    backgroundColor: 'rgba(19,19,19,0.07)',
  },
  paceBadgeHighlight: {
    backgroundColor: 'rgba(255,145,20,0.15)',
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
    borderColor: 'rgba(19,19,19,0.18)',
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
    borderColor: 'rgba(19,19,19,0.07)',
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
