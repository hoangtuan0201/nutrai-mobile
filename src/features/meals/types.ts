/**
 * meals feature types — matching NutraAI backend Prisma schema
 */

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
export type MealSource = 'MANUAL' | 'AI_TEXT' | 'AI_IMAGE';

export interface MealItem {
  id: string;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foodId?: string;
}

export interface Meal {
  id: string;
  userId: string;
  mealType: MealType;
  name: string;
  loggedAt: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: MealSource;
  notes?: string;
  imageUrl?: string;
  items: MealItem[];
}

export interface CreateMealPayload {
  mealType: MealType;
  name: string;
  loggedAt?: string;
  source: MealSource;
  notes?: string;
  items: Omit<MealItem, 'id'>[];
}
