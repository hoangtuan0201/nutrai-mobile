export type MacroType = 'carbs' | 'protein' | 'fat';

export interface NutritionTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroProgress {
  consumed: number;
  target: number;
  unit: string;
}

export interface DailyNutrition {
  date: string;
  caloriesConsumed: number;
  caloriesTarget: number;
  macros: {
    carbs: MacroProgress;
    protein: MacroProgress;
    fat: MacroProgress;
  };
  waterGlasses: number;
  waterTarget: number;
}

export interface MealItem {
  id: string;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealLog {
  id: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  name: string;
  time: string;
  calories: number;
  items: MealItem[];
}
