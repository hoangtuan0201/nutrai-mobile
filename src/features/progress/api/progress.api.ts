import { apiClient } from '../../../lib/api';
import { ProgressOverviewResponse, LogWeightPayload, WeightDataPoint } from '../types';

export const progressApi = {
  /**
   * Get comprehensive progress overview (BMI gauge, weight progress, calorie intake chart, streak)
   * @param days Number of days for chart history (default 7)
   */
  async getOverview(days = 7): Promise<ProgressOverviewResponse> {
    const response = await apiClient.get<ProgressOverviewResponse>('/progress/overview', {
      params: { days },
    });
    return response.data;
  },

  /**
   * Log or update body weight for a given date
   */
  async logWeight(payload: LogWeightPayload): Promise<WeightDataPoint> {
    const response = await apiClient.post<WeightDataPoint>('/progress/weight', payload);
    return response.data;
  },

  /**
   * Get raw weight logs history
   */
  async getWeightHistory(): Promise<WeightDataPoint[]> {
    const response = await apiClient.get<WeightDataPoint[]>('/progress/weight-history');
    return response.data;
  },

  /**
   * Update daily calorie intake target
   */
  async updateCalorieTarget(dailyCalories: number): Promise<{
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFat: number;
  }> {
    const response = await apiClient.put('/progress/calorie-target', { dailyCalories });
    return response.data;
  },
};
