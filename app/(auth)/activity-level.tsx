/**
 * activity-level.tsx — Onboarding Step 7: "Tell me about your typical daily activity"
 * Clean selection cards matching image8 with NutraAI aesthetics and Lucide icons.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Armchair,
  Footprints,
  Flame,
  Zap,
  BicepsFlexed,
} from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, OnboardingHeader } from '../../src/components';
import {
  useOnboardingStore,
  ActivityLevelType,
} from '../../src/store/onboardingStore';
import { calculateClientNutritionPlan } from '../../src/utils/nutritionCalculator';

const OPTIONS = [
  {
    id: 'sedentary',
    enumValue: 'SEDENTARY' as ActivityLevelType,
    icon: Armchair,
    iconColor: '#88A8F7',
    iconBg: 'rgba(136, 168, 247, 0.15)',
    label: 'Not Very Active',
    desc: 'Desk job, little to no exercise',
  },
  {
    id: 'light',
    enumValue: 'LIGHT' as ActivityLevelType,
    icon: Footprints,
    iconColor: '#8EDC5E',
    iconBg: 'rgba(142, 220, 94, 0.15)',
    label: 'Lightly Active',
    desc: 'Light exercise 1–3 days/week, daily walking',
  },
  {
    id: 'moderate',
    enumValue: 'MODERATE' as ActivityLevelType,
    icon: Flame,
    iconColor: '#FF9114',
    iconBg: 'rgba(255, 145, 20, 0.12)',
    label: 'Moderately Active',
    desc: 'Moderate exercise 3–5 days/week',
    recommended: true,
  },
  {
    id: 'very',
    enumValue: 'VERY_ACTIVE' as ActivityLevelType,
    icon: Zap,
    iconColor: '#FDD922',
    iconBg: 'rgba(253, 217, 34, 0.18)',
    label: 'Very Active',
    desc: 'Hard training 6–7 days/week or active physical job',
  },
  {
    id: 'extra',
    enumValue: 'EXTRA_ACTIVE' as ActivityLevelType,
    icon: BicepsFlexed,
    iconColor: '#F04B37',
    iconBg: 'rgba(240, 75, 55, 0.12)',
    label: 'Extra Active',
    desc: 'Very hard training daily + demanding physical job',
  },
];

export default function ActivityLevelScreen() {
  const router = useRouter();
  const setActivityLevel = useOnboardingStore((s) => s.setActivityLevel);
  const setCalculatedPlan = useOnboardingStore((s) => s.setCalculatedPlan);
  const currentLevel = useOnboardingStore((s) => s.activityLevel);

  const getInitialUiId = () => {
    switch (currentLevel) {
      case 'SEDENTARY':
        return 'sedentary';
      case 'LIGHT':
        return 'light';
      case 'VERY_ACTIVE':
        return 'very';
      case 'EXTRA_ACTIVE':
        return 'extra';
      case 'MODERATE':
      default:
        return 'moderate';
    }
  };

  const [selectedId, setSelectedId] = useState(getInitialUiId());

  const handleNext = () => {
    const selectedOption =
      OPTIONS.find((o) => o.id === selectedId) || OPTIONS[2];
    const levelEnum = selectedOption.enumValue;

    // 1. Save activity level
    setActivityLevel(levelEnum);

    // 2. Compute plan with updated activity level
    const store = useOnboardingStore.getState();
    const plan = calculateClientNutritionPlan({
      gender: store.gender,
      weightKg: store.weightKg,
      heightCm: store.heightCm,
      age: store.age,
      activityLevel: levelEnum,
      fitnessGoal: store.fitnessGoal,
      pace: store.pace,
      weeklyPaceKg: store.weeklyPaceKg,
    });

    setCalculatedPlan(plan);
    router.push('/(auth)/plan-preview' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <OnboardingHeader
        step={7}
        totalSteps={7}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Tell me about your{'\n'}typical daily activity
        </Text>
        <Text style={styles.subtitle}>
          Choose the option that best reflects your current routine.
        </Text>

        <View style={styles.optionsList}>
          {OPTIONS.map((item) => {
            const isSelected = selectedId === item.id;
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => setSelectedId(item.id)}
                style={[styles.card, isSelected && styles.cardActive]}
              >
                {/* Left: Icon bubble */}
                <View
                  style={[
                    styles.iconBubble,
                    { backgroundColor: item.iconBg },
                  ]}
                >
                  <Icon size={20} color={item.iconColor} strokeWidth={2.2} />
                </View>

                {/* Middle: Label + Description */}
                <View style={styles.cardContent}>
                  <View style={styles.cardTitleRow}>
                    <Text
                      style={[
                        styles.cardLabel,
                        isSelected && styles.cardLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>Recommended</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardDesc}>{item.desc}</Text>
                </View>

                {/* Right: Radio check */}
                <View style={[styles.radio, isSelected && styles.radioActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Calculate My Plan"
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
  optionsList: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(19, 19, 19, 0.07)',
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
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  cardLabelActive: {
    color: theme.colors.textPrimary,
  },
  recommendedBadge: {
    backgroundColor: 'rgba(255, 145, 20, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  recommendedText: {
    fontFamily: theme.fonts.bold,
    fontSize: 10,
    color: theme.colors.saffron,
  },
  cardDesc: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 17,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(19, 19, 19, 0.20)',
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
