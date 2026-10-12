import { create } from 'zustand';

export type FitnessGoalType =
  | 'LOSE_WEIGHT'
  | 'MAINTAIN_WEIGHT'
  | 'BUILD_MUSCLE';

export type GenderType = 'MALE' | 'FEMALE';

export type ActivityLevelType =
  | 'SEDENTARY'
  | 'LIGHT'
  | 'MODERATE'
  | 'VERY_ACTIVE'
  | 'EXTRA_ACTIVE';

export type PaceRateId = 'slow' | 'moderate' | 'aggressive';

export interface CalculatedPlan {
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface OnboardingState {
  fitnessGoal: FitnessGoalType;
  gender: GenderType;
  age: number;
  dateOfBirth: string;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevelType;
  pace: PaceRateId;
  weeklyPaceKg: number;
  calculatedPlan: CalculatedPlan | null;
  isSynced: boolean;

  setGoal: (goal: FitnessGoalType) => void;
  setMetrics: (data: {
    gender: GenderType;
    age: number;
    heightCm: number;
    weightKg: number;
  }) => void;
  setActivityLevel: (level: ActivityLevelType) => void;
  setGoalPreferences: (data: {
    targetWeightKg: number;
    pace: PaceRateId;
    weeklyPaceKg?: number;
  }) => void;
  setCalculatedPlan: (plan: CalculatedPlan) => void;
  markSynced: () => void;
  resetOnboarding: () => void;
}

/**
 * Maps the 3 frontend onboarding goals to the 3 Prisma database enum values
 * for seamless backend compatibility.
 */
export function mapGoalToBackend(
  goal: FitnessGoalType,
): 'WEIGHT_LOSS' | 'MAINTENANCE' | 'MUSCLE_GAIN' {
  switch (goal) {
    case 'LOSE_WEIGHT':
      return 'WEIGHT_LOSS';
    case 'MAINTAIN_WEIGHT':
      return 'MAINTENANCE';
    case 'BUILD_MUSCLE':
      return 'MUSCLE_GAIN';
    default:
      return 'WEIGHT_LOSS';
  }
}

const DEFAULT_STATE = {
  fitnessGoal: 'LOSE_WEIGHT' as FitnessGoalType,
  gender: 'MALE' as GenderType,
  age: 26,
  dateOfBirth: '2000-01-01',
  heightCm: 175,
  weightKg: 70,
  targetWeightKg: 65,
  activityLevel: 'MODERATE' as ActivityLevelType,
  pace: 'moderate' as PaceRateId,
  weeklyPaceKg: 0.5,
  calculatedPlan: null,
  isSynced: false,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...DEFAULT_STATE,

  setGoal: (fitnessGoal) =>
    set((state) => {
      // Intelligently reset target weight when goal changes if it conflicts
      let newTarget = state.targetWeightKg;
      if (fitnessGoal === 'LOSE_WEIGHT' && newTarget >= state.weightKg) {
        newTarget = Math.max(30, state.weightKg - 5);
      } else if (fitnessGoal === 'BUILD_MUSCLE' && newTarget <= state.weightKg) {
        newTarget = state.weightKg + 3;
      } else if (fitnessGoal === 'MAINTAIN_WEIGHT') {
        newTarget = state.weightKg;
      }
      return { fitnessGoal, targetWeightKg: newTarget, calculatedPlan: null };
    }),

  setMetrics: ({ gender, age, heightCm, weightKg }) => {
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - (age || 26);
    const dateOfBirth = `${birthYear}-01-01`;
    set((state) => {
      // Update target weight bounds if it now conflicts with the new current weight
      let newTarget = state.targetWeightKg;
      if (state.fitnessGoal === 'LOSE_WEIGHT' && newTarget >= weightKg) {
        newTarget = Math.max(30, weightKg - 5);
      } else if (state.fitnessGoal === 'BUILD_MUSCLE' && newTarget <= weightKg) {
        newTarget = weightKg + 3;
      } else if (state.fitnessGoal === 'MAINTAIN_WEIGHT') {
        newTarget = weightKg;
      }
      return {
        gender,
        age,
        heightCm,
        weightKg,
        targetWeightKg: newTarget,
        dateOfBirth,
        calculatedPlan: null,
      };
    });
  },

  setActivityLevel: (activityLevel) =>
    set({ activityLevel, calculatedPlan: null }),

  setGoalPreferences: ({ targetWeightKg, pace, weeklyPaceKg }) =>
    set((state) => ({
      targetWeightKg,
      pace,
      weeklyPaceKg: weeklyPaceKg !== undefined ? weeklyPaceKg : state.weeklyPaceKg,
      calculatedPlan: null,
    })),

  setCalculatedPlan: (calculatedPlan) => set({ calculatedPlan }),

  markSynced: () => set({ isSynced: true }),

  resetOnboarding: () => set({ ...DEFAULT_STATE }),
}));
