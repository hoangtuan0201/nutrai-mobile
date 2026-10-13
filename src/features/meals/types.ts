/**
 * Meals feature types — matching NutraAI backend Prisma schema & responses
 */

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
export type MealSource = 'MANUAL' | 'AI_TEXT' | 'AI_IMAGE';

export interface MealItem {
  id?: string;
  foodId?: string;
  foodName: string;
  portionDescription?: string;
  quantity?: number;
  unit?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sortOrder?: number;
}

export interface Meal {
  id: string;
  userId: string;
  mealType: MealType;
  name?: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  imageUrl?: string;
  source: MealSource;
  loggedDate: string;
  loggedAt: string;
  items: MealItem[];
}

export interface DailyMealsSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
}

export type DailyNutritionSummary = DailyMealsSummary;

export interface DailyMealsResponse {
  date: string;
  summary: DailyMealsSummary;
  meals: Meal[];
}

export interface CreateMealPayload {
  mealType: MealType;
  name?: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  imageUrl?: string;
  source?: MealSource;
  loggedDate?: string; // YYYY-MM-DD
  items?: MealItem[];
}

export interface FoodSearchResult {
  id?: string;
  name: string;
  source: 'LOCAL' | 'USDA';
  brand?: string;
  categoryName?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingUnit: string;
  defaultServingSize: number;
  isVerified?: boolean;
}

export interface SearchFoodsResponse {
  localItems: FoodSearchResult[];
  usdaItems: FoodSearchResult[];
  total: number;
}
