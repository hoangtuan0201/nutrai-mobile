import { create } from 'zustand';
import { AiScanFoodResponse, MealType } from '../features/meals/types';

interface AiScanState {
  imageUri: string | null;
  imageBase64: string | null;
  scanResult: AiScanFoodResponse | null;
  mealType: MealType;
  foodHint?: string;
  setScanData: (data: {
    imageUri: string;
    imageBase64?: string | null;
    scanResult: AiScanFoodResponse;
    mealType?: MealType;
    foodHint?: string;
  }) => void;
  clearScanData: () => void;
}

export const useAiScanStore = create<AiScanState>((set) => ({
  imageUri: null,
  imageBase64: null,
  scanResult: null,
  mealType: 'LUNCH',
  foodHint: undefined,
  setScanData: (data) =>
    set({
      imageUri: data.imageUri,
      imageBase64: data.imageBase64 || null,
      scanResult: data.scanResult,
      mealType: data.mealType || 'LUNCH',
      foodHint: data.foodHint,
    }),
  clearScanData: () =>
    set({
      imageUri: null,
      imageBase64: null,
      scanResult: null,
      mealType: 'LUNCH',
    }),
}));
