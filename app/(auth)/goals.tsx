/**
 * goals.tsx — CaloriQ-inspired "What is your main goal?" screen
 * Large bold title, simple white rounded cards with icon + label + radio check.
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Scale, Activity, Dumbbell, Zap } from 'lucide-react-native';
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
          style={[
            barStyles.segment,
            i < step && barStyles.segmentActive,
          ]}
        />
      ))}
    </View>
  );
}
const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, flex: 1, marginLeft: 10 },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(19,19,19,0.10)',
  },
  segmentActive: {
    backgroundColor: theme.colors.saffron,
  },
});

// ─── Goal options ────────────────────────────────────────────────────
const GOALS = [
  {
    id: 'lose',
    icon: Scale,
    label: 'Lose weight',
    iconBg: 'rgba(240,75,55,0.12)',
    iconColor: '#F04B37',
  },
  {
    id: 'maintain',
    icon: Activity,
    label: 'Maintain weight',
    iconBg: 'rgba(136,168,247,0.18)',
    iconColor: '#88A8F7',
  },
  {
    id: 'build_muscle',
    icon: Dumbbell,
    label: 'Build muscle',
    iconBg: 'rgba(253,217,34,0.22)',
    iconColor: '#C8A000',
  },
];

import { useOnboardingStore, FitnessGoalType } from '../../src/store/onboardingStore';

export default function ChooseGoalScreen() {
  const router = useRouter();
  const setGoal = useOnboardingStore((s) => s.setGoal);
  const currentGoal = useOnboardingStore((s) => s.fitnessGoal);

  // Map internal store enum to UI ids
  const getInitialUiId = () => {
    if (currentGoal === 'MAINTAIN_WEIGHT') return 'maintain';
    if (currentGoal === 'BUILD_MUSCLE') return 'build_muscle';
    return 'lose';
  };

  const [selectedGoal, setSelectedGoal] = useState<string>(getInitialUiId());

  const handleNext = () => {
    let goalEnum: FitnessGoalType = 'LOSE_WEIGHT';
    if (selectedGoal === 'maintain') goalEnum = 'MAINTAIN_WEIGHT';
    else if (selectedGoal === 'build_muscle') goalEnum = 'BUILD_MUSCLE';

    setGoal(goalEnum);
    router.push('/(auth)/user-metrics' as any);
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
        <StepBar step={1} />
        <TouchableOpacity activeOpacity={0.6} onPress={() => router.push('/(auth)/user-metrics' as any)}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.title}>What is your{'\n'}main goal?</Text>

        <View style={styles.optionsList}>
          {GOALS.map((item) => {
            const isSelected = selectedGoal === item.id;
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => setSelectedGoal(item.id)}
                style={[styles.card, isSelected && styles.cardActive]}
              >
                {/* Icon bubble */}
                <View style={[styles.iconBubble, { backgroundColor: item.iconBg }]}>
                  <Icon size={20} color={item.iconColor} strokeWidth={2.2} />
                </View>

                {/* Label */}
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelActive]}>
                  {item.label}
                </Text>

                {/* Radio dot */}
                <View style={[styles.radio, isSelected && styles.radioActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title="Next"
          size="lg"
          variant="primary"
          fullWidth
          onPress={handleNext}
        />
      </View>
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
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: 24,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 30,
    lineHeight: 38,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 28,
  },
  optionsList: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(19,19,19,0.07)',
    gap: 14,
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardActive: {
    borderColor: theme.colors.saffron,
    borderWidth: 2,
    backgroundColor: '#FFFBF5',
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    flex: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  cardLabelActive: {
    color: theme.colors.textPrimary,
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
  radioActive: {
    borderColor: theme.colors.saffron,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.saffron,
  },
  footer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingBottom: 32,
    paddingTop: 12,
  },
});
