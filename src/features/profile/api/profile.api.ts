import { apiClient } from '../../../lib/api';

export interface NutritionTargetDto {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  effectiveFrom: string;
}

export interface CalculatedMetricsDto {
  bmr: number;
  tdee: number;
  calorieTarget: number;
}

export interface ProfileResponseDto {
  id: string;
  userId: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE';
  heightCm?: number;
  weightKg?: number;
  activityLevel?:
    | 'SEDENTARY'
    | 'LIGHT'
    | 'MODERATE'
    | 'VERY_ACTIVE'
    | 'EXTRA_ACTIVE';
  fitnessGoal?: 'WEIGHT_LOSS' | 'MAINTENANCE' | 'MUSCLE_GAIN';
  metrics?: CalculatedMetricsDto;
  activeTarget?: NutritionTargetDto;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileDto {
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE';
  heightCm?: number;
  weightKg?: number;
  activityLevel?:
    | 'SEDENTARY'
    | 'LIGHT'
    | 'MODERATE'
    | 'VERY_ACTIVE'
    | 'EXTRA_ACTIVE';
  fitnessGoal?: 'WEIGHT_LOSS' | 'MAINTENANCE' | 'MUSCLE_GAIN';
}

export const profileApi = {
  getProfile: async (): Promise<ProfileResponseDto> => {
    const response = await apiClient.get<ProfileResponseDto>('/profile');
    return response.data;
  },

  updateProfile: async (
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> => {
    const response = await apiClient.put<ProfileResponseDto>('/profile', dto);
    return response.data;
  },
};
