export interface BMIInfo {
  value: number;
  category: 'Severe Thinness' | 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
  minHealthyWeightKg: number;
  maxHealthyWeightKg: number;
}

export interface WeightDataPoint {
  id?: string;
  date: string;
  dateTime?: string;
  weightKg: number;
  changeKg?: number;
  note?: string;
}

export interface WeightProgress {
  currentKg: number;
  targetKg: number;
  startKg?: number;
  changeKg: number;
  history: WeightDataPoint[];
}

export interface DailyMacroSummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
}

export interface CalorieIntakeProgress {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  history: DailyMacroSummary[];
  averageCalories: number;
}

export interface ProgressOverviewResponse {
  bmi: BMIInfo;
  weight: WeightProgress;
  calorieIntake: CalorieIntakeProgress;
  streak: {
    currentStreakDays: number;
  };
}

export interface LogWeightPayload {
  weightKg: number;
  note?: string;
  loggedDate?: string;
}
