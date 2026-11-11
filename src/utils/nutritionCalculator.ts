export type FitnessGoalType =
  | 'LOSE_WEIGHT'
  | 'MAINTAIN_WEIGHT'
  | 'BUILD_MUSCLE';

export type GenderType = 'MALE' | 'FEMALE' | 'OTHER';

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

// ─── Constants ───────────────────────────────────────────────────────────────

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevelType, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTRA_ACTIVE: 1.9,
};

export const KG_TO_LB = 2.20462;
export const LB_TO_KG = 0.453592;
export const CM_TO_FT = 0.0328084;
export const FT_TO_CM = 30.48;

/** Configurable macro constants (g/kg/day) */
export const DEFAULT_PROTEIN_G_PER_KG = 1.8;
export const DEFAULT_FAT_G_PER_KG = 0.9;
export const CALORIES_PER_KG_BODY_FAT = 7000;

export interface GoalPaceOption {
  id: PaceRateId;
  label: string;
  weeklyRateKg: number;
  direction: 'lose' | 'gain' | 'maintain';
  badge: string;
  rateDisplay: string;
}

// ─── Unit Conversions ────────────────────────────────────────────────────────

export function kgToLb(kg: number): number {
  if (!kg || kg <= 0) return 0;
  return Math.round(kg * KG_TO_LB * 10) / 10;
}

export function lbToKg(lb: number): number {
  if (!lb || lb <= 0) return 0;
  return Math.round((lb * LB_TO_KG) * 10) / 10;
}

export function cmToFt(cm: number): number {
  if (!cm || cm <= 0) return 0;
  return Math.round((cm / FT_TO_CM) * 10) / 10;
}

export function ftToCm(ft: number): number {
  if (!ft || ft <= 0) return 0;
  return Math.round(ft * FT_TO_CM);
}

// ─── BMR & TDEE ──────────────────────────────────────────────────────────────

/**
 * Calculates BMR using the Mifflin-St Jeor Equation:
 * - Men:   10 * weight (kg) + 6.25 * height (cm) - 5 * age + 5
 * - Women: 10 * weight (kg) + 6.25 * height (cm) - 5 * age - 161
 */
export function calculateBMR(
  gender: GenderType,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  if (!weightKg || !heightCm || !age || weightKg <= 0 || heightCm <= 0 || age <= 0) {
    return 0;
  }
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const offset = gender === 'MALE' ? 5 : gender === 'FEMALE' ? -161 : -78;
  return Math.round((base + offset) * 100) / 100;
}

/**
 * Calculates TDEE = BMR * activityMultiplier
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: ActivityLevelType,
): number {
  if (!bmr || bmr <= 0) return 0;
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  return Math.round(bmr * multiplier);
}

// ─── Goal-Specific Pace Options ──────────────────────────────────────────────

/**
 * Returns goal-specific pace options.
 * Muscle gain uses conservative rates (0.1–0.25 kg/wk) to prioritize lean mass.
 */
export function getPaceOptionsForGoal(goal: FitnessGoalType): GoalPaceOption[] {
  switch (goal) {
    case 'LOSE_WEIGHT':
      return [
        {
          id: 'slow',
          label: 'Steady & Sustainable',
          weeklyRateKg: 0.25,
          direction: 'lose',
          badge: 'Easy',
          rateDisplay: 'Lose ~0.25 kg/week',
        },
        {
          id: 'moderate',
          label: 'Optimal Pace',
          weeklyRateKg: 0.5,
          direction: 'lose',
          badge: 'Recommended',
          rateDisplay: 'Lose ~0.50 kg/week',
        },
        {
          id: 'aggressive',
          label: 'Aggressive & Focused',
          weeklyRateKg: 0.75,
          direction: 'lose',
          badge: 'Challenging',
          rateDisplay: 'Lose ~0.75 kg/week',
        },
      ];

    case 'BUILD_MUSCLE':
      return [
        {
          id: 'slow',
          label: 'Lean Bulk (Minimal Fat)',
          weeklyRateKg: 0.1,
          direction: 'gain',
          badge: 'Recommended',
          rateDisplay: 'Gain ~0.10 kg/week',
        },
        {
          id: 'moderate',
          label: 'Standard Bulk',
          weeklyRateKg: 0.2,
          direction: 'gain',
          badge: 'Steady',
          rateDisplay: 'Gain ~0.20 kg/week',
        },
        {
          id: 'aggressive',
          label: 'Accelerated Hypertrophy',
          weeklyRateKg: 0.35,
          direction: 'gain',
          badge: 'Challenging',
          rateDisplay: 'Gain ~0.35 kg/week',
        },
      ];

    case 'MAINTAIN_WEIGHT':
    default:
      return [
        {
          id: 'moderate',
          label: 'Maintain Weight',
          weeklyRateKg: 0,
          direction: 'maintain',
          badge: 'Balance',
          rateDisplay: 'Maintain current weight',
        },
      ];
  }
}

// ─── Target Weight Validation ────────────────────────────────────────────────

export interface TargetWeightValidation {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export function validateTargetWeight(
  currentWeightKg: number,
  targetWeightKg: number,
  goal: FitnessGoalType,
): TargetWeightValidation {
  if (!currentWeightKg || currentWeightKg <= 0) {
    return { isValid: false, error: 'Current weight must be greater than 0.' };
  }

  if (goal === 'MAINTAIN_WEIGHT') {
    return { isValid: true };
  }

  if (!targetWeightKg || targetWeightKg <= 0) {
    return { isValid: false, error: 'Target weight must be greater than 0.' };
  }

  if (goal === 'LOSE_WEIGHT') {
    if (targetWeightKg >= currentWeightKg) {
      return {
        isValid: false,
        error: `Target weight (${targetWeightKg} kg) must be lower than your current weight (${currentWeightKg} kg) for weight loss.`,
      };
    }
    if (targetWeightKg < currentWeightKg * 0.6) {
      return {
        isValid: true,
        warning: 'Target weight is a very aggressive drop (>40%). Consider a closer milestone.',
      };
    }
  }

  if (goal === 'BUILD_MUSCLE') {
    if (targetWeightKg <= currentWeightKg) {
      return {
        isValid: false,
        error: `Target weight (${targetWeightKg} kg) must be higher than your current weight (${currentWeightKg} kg) to build muscle.`,
      };
    }
    if (targetWeightKg > currentWeightKg * 1.5) {
      return {
        isValid: true,
        warning: 'Target weight is significantly higher (>50%). Consider a gradual milestone.',
      };
    }
  }

  return { isValid: true };
}

// ─── Complete Nutrition Plan Calculation ─────────────────────────────────────

export interface NutritionPlanParams {
  gender: GenderType;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevelType;
  fitnessGoal: FitnessGoalType;
  pace?: PaceRateId;
  weeklyPaceKg?: number;
  proteinGPerKg?: number;
  fatGPerKg?: number;
}

export function calculateClientNutritionPlan(
  params: NutritionPlanParams,
): CalculatedPlan {
  const {
    gender,
    weightKg,
    heightCm,
    age,
    activityLevel,
    fitnessGoal,
    pace = 'moderate',
    proteinGPerKg = DEFAULT_PROTEIN_G_PER_KG,
    fatGPerKg = DEFAULT_FAT_G_PER_KG,
  } = params;

  // 1. Calculate BMR and TDEE
  const bmr = calculateBMR(gender, weightKg, heightCm, age);
  const tdee = calculateTDEE(bmr, activityLevel);

  if (bmr === 0 || tdee === 0) {
    return { bmr: 0, tdee: 0, calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  // 2. Determine weekly pace in kg
  const paceOptions = getPaceOptionsForGoal(fitnessGoal);
  const selectedPaceOption =
    paceOptions.find((p) => p.id === pace) || paceOptions[0];
  const effectiveWeeklyPaceKg =
    params.weeklyPaceKg !== undefined
      ? params.weeklyPaceKg
      : selectedPaceOption.weeklyRateKg;

  // 3. Calculate daily calorie adjustment based on pace:
  // Standard medical rate: 1 kg body tissue variation ≈ 7,000 kcal (500 kcal/day for 0.5 kg/week).
  // Synchronized with backend GOAL_CALORIE_DELTA (-500 kcal for weight loss, +300 kcal for muscle gain).
  const dailyDelta = effectiveWeeklyPaceKg === 0.5
    ? 500
    : Math.round((effectiveWeeklyPaceKg * 7000) / 7);

  let targetCalories: number;

  switch (fitnessGoal) {
    case 'LOSE_WEIGHT': {
      const rawTarget = tdee - dailyDelta;
      // Safeguards:
      // Minimum calorie floor: 1500 kcal for male, 1200 kcal for female, 1350 for other
      const minSafeFloor = gender === 'MALE' ? 1500 : gender === 'FEMALE' ? 1200 : 1350;
      // Maximum deficit safeguard: not exceeding 30% of TDEE
      const maxDeficitFloor = Math.round(tdee * 0.7);
      const safeFloor = Math.max(minSafeFloor, maxDeficitFloor);
      targetCalories = Math.max(safeFloor, rawTarget);
      break;
    }

    case 'BUILD_MUSCLE': {
      // Conservative surplus (lean hypertrophy) to minimize fat storage
      const rawTarget = tdee + dailyDelta;
      // Safeguard ceiling: for lean muscle, cap surplus at +350 kcal/day
      const maxSurplus = tdee + 350;
      targetCalories = Math.min(maxSurplus, rawTarget);
      break;
    }

    case 'MAINTAIN_WEIGHT':
    default: {
      targetCalories = tdee;
      break;
    }
  }

  // 4. Calculate Macronutrients from Body Weight:
  // Protein = weightKg * 1.8 g/kg (4 kcal/g)
  // Fat = weightKg * 0.9 g/kg (9 kcal/g)
  // Carbs = (targetCalories - protein*4 - fat*9) / 4
  let proteinG = Math.round(weightKg * proteinGPerKg);
  let fatG = Math.round(weightKg * fatGPerKg);

  const caloriesFromProtein = proteinG * 4;
  const caloriesFromFat = fatG * 9;
  const remainingCaloriesForCarbs =
    targetCalories - (caloriesFromProtein + caloriesFromFat);

  let carbsG = Math.round(Math.max(0, remainingCaloriesForCarbs / 4));

  // Safeguard: Ensure minimum carbohydrates (at least 30g) for physiological function
  if (carbsG < 30) {
    carbsG = 30;
    const adjustedRemainingForFat =
      targetCalories - (proteinG * 4 + carbsG * 4);
    fatG = Math.max(
      Math.round(weightKg * 0.5),
      Math.round(adjustedRemainingForFat / 9),
    );
  }

  return {
    bmr,
    tdee,
    calories: targetCalories,
    protein: proteinG,
    carbs: carbsG,
    fat: fatG,
  };
}

// ─── BMI Calculator & Classification ────────────────────────────────────────

export interface BMIEstimate {
  bmi: number;
  category: 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE';
  categoryLabel: string;
  categoryColor: string;
  categoryBg: string;
  message: string;
}

export function calculateBMI(weightKg: number, heightCm: number): BMIEstimate {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    return {
      bmi: 0,
      category: 'NORMAL',
      categoryLabel: 'Normal',
      categoryColor: '#16A34A',
      categoryBg: '#DCFCE7',
      message: 'Enter your height and weight to view your BMI assessment.',
    };
  }
  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

  if (bmi < 18.5) {
    return {
      bmi,
      category: 'UNDERWEIGHT',
      categoryLabel: 'Underweight',
      categoryColor: '#0284C7',
      categoryBg: '#E0F2FE',
      message:
        'Your BMI is below the healthy range. A balanced nutrition plan with adequate calories will support healthy mass and energy levels.',
    };
  }
  if (bmi < 25) {
    return {
      bmi,
      category: 'NORMAL',
      categoryLabel: 'Healthy Weight',
      categoryColor: '#16A34A',
      categoryBg: '#DCFCE7',
      message:
        'Your BMI is within the healthy weight range (18.5 - 24.9). This is associated with optimal energy and lower cardiovascular risks.',
    };
  }
  if (bmi < 30) {
    return {
      bmi,
      category: 'OVERWEIGHT',
      categoryLabel: 'Overweight',
      categoryColor: '#D97706',
      categoryBg: '#FEF3C7',
      message:
        'Your BMI falls in the overweight range. A moderate calorie deficit and consistent daily activity will help you reach a healthy weight safely.',
    };
  }
  return {
    bmi,
    category: 'OBESE',
    categoryLabel: 'Obese',
    categoryColor: '#DC2626',
    categoryBg: '#FEE2E2',
    message:
      'A structured, sustainable nutrition plan will help steady your weight and improve cardiovascular and metabolic health.',
  };
}
