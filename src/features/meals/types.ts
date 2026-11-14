/**
 * Meals feature types — matching NutraAI backend Prisma schema & responses
 */

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
export type MealSource = 'MANUAL' | 'AI_TEXT' | 'AI_IMAGE';

export interface MealItem {
  id?: string;
  foodId?: string;
  food?: {
    id?: string;
    name?: string;
    imageUrl?: string;
  };
  imageUrl?: string;
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
  source: 'LOCAL' | 'USDA' | 'BARCODE';
  brand?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingUnit: string;
  defaultServingSize: number;
  isVerified?: boolean;
  barcode?: string;
  imageUrl?: string;
  servingSizeDescription?: string;
  servingCalories?: number;
  servingProtein?: number;
  servingCarbs?: number;
  servingFat?: number;
}

export interface SearchFoodsResponse {
  localItems: FoodSearchResult[];
  usdaItems: FoodSearchResult[];
  total: number;
}

export interface AiScanFoodItem {
  name: string;
  caloriesPer100g: number;
  estimatedGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AiScanFoodResponse {
  mealName: string;
  mealType: string;
  estimatedTotalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  confidence: number;
  advice?: string;
  items: AiScanFoodItem[];
}

export interface ScanFoodPayload {
  imageBase64: string;
  mimeType?: string;
  mealType?: MealType;
  foodHint?: string;
}
