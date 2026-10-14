import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WaterState {
  dailyGoalMl: number; // default 2000 ml (~64 fl oz)
  intakeByDate: Record<string, number>; // dateStr -> ml consumed
  addCup: (dateStr: string, mlPerCup?: number) => void;
  removeCup: (dateStr: string, mlPerCup?: number) => void;
  setIntake: (dateStr: string, ml: number) => void;
  setGoal: (goalMl: number) => void;
  resetDate: (dateStr: string) => void;
}

export const useWaterStore = create<WaterState>()(
  persist(
    (set) => ({
      dailyGoalMl: 2000,
      intakeByDate: {},
      addCup: (dateStr: string, mlPerCup = 250) =>
        set((state) => {
          const current = state.intakeByDate[dateStr] || 0;
          return {
            intakeByDate: {
              ...state.intakeByDate,
              [dateStr]: current + mlPerCup,
            },
          };
        }),
      removeCup: (dateStr: string, mlPerCup = 250) =>
        set((state) => {
          const current = state.intakeByDate[dateStr] || 0;
          return {
            intakeByDate: {
              ...state.intakeByDate,
              [dateStr]: Math.max(0, current - mlPerCup),
            },
          };
        }),
      setIntake: (dateStr: string, ml: number) =>
        set((state) => ({
          intakeByDate: {
            ...state.intakeByDate,
            [dateStr]: Math.max(0, ml),
          },
        })),
      setGoal: (goalMl: number) =>
        set(() => ({
          dailyGoalMl: Math.max(500, goalMl),
        })),
      resetDate: (dateStr: string) =>
        set((state) => ({
          intakeByDate: {
            ...state.intakeByDate,
            [dateStr]: 0,
          },
        })),
    }),
    {
      name: 'nutraai_water_intake',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
