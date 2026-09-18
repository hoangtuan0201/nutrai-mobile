/**
 * nutrition feature types
 */

export interface NutritionTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailySummary {
  date: string;
  caloriesConsumed: number;
  caloriesTarget: number;
  proteinConsumed: number;
  proteinTarget: number;
  carbsConsumed: number;
  carbsTarget: number;
  fatConsumed: number;
  fatTarget: number;
  waterGlasses: number;
  waterTarget: number;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  days: DailySummary[];
  averageCalories: number;
  averageProtein: number;
  averageCarbs: number;
  averageFat: number;
}
