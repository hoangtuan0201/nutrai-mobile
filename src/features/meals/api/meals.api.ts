import { apiClient } from '../../../lib/api';
import {
  CreateMealPayload,
  DailyMealsResponse,
  Meal,
  SearchFoodsResponse,
  FoodSearchResult,
  ScanFoodPayload,
  AiScanFoodResponse,
} from '../types';

export const mealsApi = {
  /**
   * Scan food using Gemini Multimodal Vision API
   */
  async scanFoodWithAi(payload: ScanFoodPayload): Promise<AiScanFoodResponse> {
    const response = await apiClient.post<AiScanFoodResponse>('/ai/scan-food', payload);
    return response.data;
  },

  /**
   * Get meals and nutrition summary for today
   */
  async getTodayMeals(): Promise<DailyMealsResponse> {
    const response = await apiClient.get<DailyMealsResponse>('/meals/today');
    return response.data;
  },

  /**
   * Get meals and nutrition summary for a specific calendar date (YYYY-MM-DD)
   */
  async getDailyMeals(date?: string): Promise<DailyMealsResponse> {
    const url = date ? `/meals?date=${encodeURIComponent(date)}` : '/meals/today';
    const response = await apiClient.get<DailyMealsResponse>(url);
    return response.data;
  },

  /**
   * Create a new meal log
   */
  async createMeal(payload: CreateMealPayload): Promise<Meal> {
    const response = await apiClient.post<Meal>('/meals', payload);
    return response.data;
  },

  /**
   * Get meal detail by ID
   */
  async getMealById(id: string): Promise<Meal> {
    const response = await apiClient.get<Meal>(`/meals/${id}`);
    return response.data;
  },

  /**
   * Update an existing meal log by ID
   */
  async updateMeal(id: string, payload: Partial<CreateMealPayload>): Promise<Meal> {
    const response = await apiClient.put<Meal>(`/meals/${id}`, payload);
    return response.data;
  },

  /**
   * Delete a meal log by ID
   */
  async deleteMeal(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/meals/${id}`,
    );
    return response.data;
  },

  /**
   * Search foods from internal PostgreSQL repository and USDA FoodData Central
   */
  async searchFoods(query: string, source: 'all' | 'local' | 'usda' = 'all'): Promise<SearchFoodsResponse> {
    const response = await apiClient.get<SearchFoodsResponse>('/foods/search', {
      params: { query, source },
    });
    return response.data;
  },

  /**
   * Lookup packaged food nutrition by barcode without saving to local database
   */
  async getFoodByBarcode(barcode: string): Promise<FoodSearchResult> {
    const response = await apiClient.get<FoodSearchResult>(`/foods/barcode/${encodeURIComponent(barcode)}`);
    return response.data;
  },

  /**
   * Import or cache a USDA food item into internal database
   */
  async importUsdaFood(food: FoodSearchResult): Promise<any> {
    const response = await apiClient.post('/foods/import-usda', food);
    return response.data;
  },
};
