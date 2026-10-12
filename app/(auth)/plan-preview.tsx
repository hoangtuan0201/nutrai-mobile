/**
 * plan-preview.tsx — "Your daily nutrition plan" results screen
 * Shows CalculatingLoader for 3s then reveals the plan summary.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Flame,
  BicepsFlexed,
  Wheat,
  Droplet,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, Logo, CalculatingLoader } from '../../src/components';
import { useAuthStore } from '../../src/store/authStore';

const LOADING_DURATION = 5500; // ms (gives realistic AI calculation feeling across all 5 steps)

import {
  useOnboardingStore,
  mapGoalToBackend,
} from '../../src/store/onboardingStore';
import { calculateClientNutritionPlan } from '../../src/utils/nutritionCalculator';
import { profileApi } from '../../src/features/profile/api/profile.api';

export default function PlanPreviewScreen() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const isLoggedIn = Boolean(user || accessToken);

  const goal = useOnboardingStore((s) => s.fitnessGoal);

  const calculatedPlan = React.useMemo(() => {
    const s = useOnboardingStore.getState();
    return (
      s.calculatedPlan ||
      calculateClientNutritionPlan({
        gender: s.gender,
        weightKg: s.weightKg,
        heightCm: s.heightCm,
        age: s.age,
        activityLevel: s.activityLevel,
        fitnessGoal: s.fitnessGoal,
        pace: s.pace,
        weeklyPaceKg: s.weeklyPaceKg,
      })
    );
  }, []);

  const calories = calculatedPlan.calories.toLocaleString();
  const protein = calculatedPlan.protein.toString();
  const carbs = calculatedPlan.carbs.toString();
  const fat = calculatedPlan.fat.toString();

  const [isCalculating, setIsCalculating] = useState(true);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCalculating(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, LOADING_DURATION);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = async () => {
    if (isLoggedIn) {
      const s = useOnboardingStore.getState();
      try {
        await profileApi.updateProfile({
          gender: s.gender,
          heightCm: s.heightCm,
          weightKg: s.weightKg,
          activityLevel: s.activityLevel,
          fitnessGoal: mapGoalToBackend(s.fitnessGoal),
          dateOfBirth: s.dateOfBirth,
        });
        s.markSynced();
      } catch (err) {
        console.warn('Profile sync on continue warning:', err);
      }
      router.replace('/(main)');
    } else {
      router.push('/(auth)/register');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Calculating overlay */}
      <CalculatingLoader visible={isCalculating} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        {/* Full progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim }}
      >
        {/* Hero section */}
        <View style={styles.heroSection}>
          <View style={styles.heroLogo}>
            <Logo variant="full" size="md" />
          </View>
          <Text style={styles.title}>
            Your daily{'\n'}nutrition <Text style={styles.titleAccent}>plan</Text>
          </Text>
          <Text style={styles.subtitle}>
            {goal === 'LOSE_WEIGHT' &&
              'Calculated based on your physical stats and weight-loss target.'}
            {goal === 'BUILD_MUSCLE' &&
              'Calculated based on your physical stats and lean muscle target.'}
            {goal === 'MAINTAIN_WEIGHT' &&
              'Calculated based on your physical stats and maintenance energy balance.'}
          </Text>
        </View>

        {/* Calorie card — dark */}
        <View style={styles.calorieCard}>
          <View style={styles.calorieTopRow}>
            <View style={styles.calorieIconLabel}>
              <Flame size={18} color={theme.colors.saffron} />
              <Text style={styles.calorieCardLabel}>Recommended Daily Intake</Text>
            </View>
            <View style={styles.estimateBadge}>
              <Text style={styles.estimateBadgeText}>Estimate</Text>
            </View>
          </View>

          <Text style={styles.calorieNumber}>{calories} kcal</Text>

          <View style={styles.calorieInfoRow}>
            <Info size={14} color="rgba(255,255,255,0.55)" />
            <Text style={styles.calorieInfoText}>
              Based on your BMR, activity level, and goal.
            </Text>
          </View>
        </View>

        {/* Macro grid */}
        <Text style={styles.sectionTitle}>Macro Targets</Text>
        <View style={styles.macroGrid}>
          {[
            { icon: BicepsFlexed, color: theme.colors.blue,   bg: 'rgba(136,168,247,0.18)', label: 'Protein', value: protein },
            { icon: Wheat,        color: theme.colors.green,  bg: 'rgba(142,220,94,0.18)',  label: 'Carbs',   value: carbs   },
            { icon: Droplet,      color: theme.colors.yellow, bg: 'rgba(253,217,34,0.22)',  label: 'Fat',     value: fat     },
          ].map(({ icon: Icon, color, bg, label, value }) => (
            <View key={label} style={styles.macroCard}>
              <View style={[styles.macroIconWrap, { backgroundColor: bg }]}>
                <Icon size={20} color={color} />
              </View>
              <Text style={styles.macroLabel}>{label}</Text>
              <Text style={styles.macroValue}>{value} g</Text>
            </View>
          ))}
        </View>

        {/* Info callout */}
        <TouchableOpacity style={styles.callout} activeOpacity={0.8}>
          <Info size={16} color={theme.colors.textSecondary} />
          <Text style={styles.calloutText}>
            These targets are estimates. Track meals to fine-tune your plan.
          </Text>
        </TouchableOpacity>
      </Animated.ScrollView>

      {!isCalculating && (
        <View style={styles.footer}>
          <Button
            title="Continue"
            size="lg"
            variant="primary"
            fullWidth
            onPress={handleContinue}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backLink}
          >
            <Text style={styles.backLinkText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}
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
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(19,19,19,0.05)',
  },
  progressBar: {
    flex: 1, height: 4,
    backgroundColor: 'rgba(19,19,19,0.10)',
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.saffron,
    borderRadius: 2,
  },
  scroll: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: 8,
    paddingBottom: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  heroLogo: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF9114',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 5,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 30, lineHeight: 38,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: theme.colors.saffron,
    fontFamily: theme.fonts.extraBold,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 13, lineHeight: 19,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  calorieCard: {
    backgroundColor: '#1E2F25',
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    shadowColor: '#1E2F25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
  calorieTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calorieIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calorieCardLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  estimateBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  estimateBadgeText: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },
  calorieNumber: {
    fontFamily: theme.fonts.bold,
    fontSize: 40, lineHeight: 48,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  calorieInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calorieInfoText: {
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 16,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    color: theme.colors.textPrimary,
    marginBottom: 14,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(19,19,19,0.06)',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  macroIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  macroLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  macroValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: theme.colors.textPrimary,
    marginTop: 4,
  },
  callout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200,194,155,0.20)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  calloutText: {
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 12, lineHeight: 17,
    color: '#4A483E',
  },
  footer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 8,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  backLinkText: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
