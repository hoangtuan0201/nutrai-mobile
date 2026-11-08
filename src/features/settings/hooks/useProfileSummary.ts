import { useProfile } from '../../profile/hooks/useProfile';
import { useOnboardingStore } from '../../../store/onboardingStore';
import {
  calculateClientNutritionPlan,
  ActivityLevelType,
  FitnessGoalType,
  GenderType,
} from '../../../utils/nutritionCalculator';

export type ProfileGoal = 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE';

/**
 * Single source of truth for the values shown on the Settings screen.
 * Prefers server profile → falls back to onboarding store → defaults.
 */
export function useProfileSummary() {
  const { profile, updateProfile, isUpdating } = useProfile();
  const onboarding = useOnboardingStore();

  const calculateAge = (dob?: string): number => {
    const fallback = onboarding.age || 21;
    if (!dob) return fallback;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return fallback;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age > 0 ? age : fallback;
  };

  const age = profile?.dateOfBirth ? calculateAge(profile.dateOfBirth) : onboarding.age || 21;
  const heightCm = profile?.heightCm || onboarding.heightCm || 174;
  const weightKg = profile?.weightKg || onboarding.weightKg || 60;
  const gender = (profile?.gender || onboarding.gender || 'MALE') as GenderType;
  const activity = (profile?.activityLevel || onboarding.activityLevel || 'MODERATE') as ActivityLevelType;
  const goal: ProfileGoal =
    profile?.fitnessGoal ||
    (onboarding.fitnessGoal === 'LOSE_WEIGHT'
      ? 'WEIGHT_LOSS'
      : onboarding.fitnessGoal === 'BUILD_MUSCLE'
      ? 'MUSCLE_GAIN'
      : 'MAINTENANCE');
  const targetWeightKg = profile?.targetWeightKg || onboarding.targetWeightKg || weightKg;

  const calcGoal: FitnessGoalType =
    goal === 'WEIGHT_LOSS' ? 'LOSE_WEIGHT' : goal === 'MUSCLE_GAIN' ? 'BUILD_MUSCLE' : 'MAINTAIN_WEIGHT';

  const plan = calculateClientNutritionPlan({
    gender,
    weightKg,
    heightCm,
    age,
    activityLevel: activity,
    fitnessGoal: calcGoal,
  });

  return {
    profile,
    onboarding,
    updateProfile,
    isUpdating,
    age,
    heightCm,
    weightKg,
    gender,
    activity,
    goal,
    targetWeightKg,
    plan,
  };
}

export type ProfileSummary = ReturnType<typeof useProfileSummary>;

