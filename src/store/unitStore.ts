import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type EnergyUnit = 'Cal' | 'kcal';
export type FoodUnit = 'metric' | 'imperial'; // metric: g/ml, imperial: oz/fl oz
export type BodyUnit = 'metric' | 'imperial'; // metric: cm/kg, imperial: ft/lbs

export interface UnitPreferences {
  energyUnit: EnergyUnit;
  foodUnit: FoodUnit;
  bodyUnit: BodyUnit;
}

interface UnitState extends UnitPreferences {
  setUnits: (units: Partial<UnitPreferences>) => void;
  resetUnits: () => void;
}

const DEFAULT_UNITS: UnitPreferences = {
  energyUnit: 'kcal',
  foodUnit: 'metric',
  bodyUnit: 'metric',
};

export const useUnitStore = create<UnitState>()(
  persist(
    (set) => ({
      ...DEFAULT_UNITS,
      setUnits: (newUnits) => set((state) => ({ ...state, ...newUnits })),
      resetUnits: () => set(DEFAULT_UNITS),
    }),
    {
      name: 'nutraai_unit_preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ─── Formatting Helpers Across Entire App ─────────────────────────────────────

export function formatWeight(
  weightKg: number,
  bodyUnit: BodyUnit = 'metric',
): { value: string; unit: string; full: string } {
  if (!weightKg || isNaN(weightKg) || weightKg <= 0) {
    const u = bodyUnit === 'metric' ? 'kg' : 'lbs';
    return { value: '0.0', unit: u, full: `0.0 ${u}` };
  }
  if (bodyUnit === 'imperial') {
    const lbs = Math.round(weightKg * 2.20462 * 10) / 10;
    return { value: lbs.toFixed(1), unit: 'lbs', full: `${lbs.toFixed(1)} lbs` };
  }
  return { value: weightKg.toFixed(1), unit: 'kg', full: `${weightKg.toFixed(1)} kg` };
}

export function formatWeightDiff(
  diffKg: number,
  bodyUnit: BodyUnit = 'metric',
): string {
  const sign = diffKg > 0 ? '+' : '';
  if (bodyUnit === 'imperial') {
    const diffLbs = Math.round(diffKg * 2.20462 * 10) / 10;
    return `${sign}${diffLbs.toFixed(1)} lbs`;
  }
  return `${sign}${diffKg.toFixed(1)} kg`;
}

export function formatHeight(
  heightCm: number,
  bodyUnit: BodyUnit = 'metric',
): { value: string; unit: string; full: string } {
  if (!heightCm || isNaN(heightCm) || heightCm <= 0) {
    const u = bodyUnit === 'metric' ? 'cm' : 'ft';
    return { value: '0', unit: u, full: `0 ${u}` };
  }
  if (bodyUnit === 'imperial') {
    const totalInches = Math.round(heightCm / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return {
      value: `${feet}'${inches}"`,
      unit: 'ft',
      full: `${feet} ft ${inches} in`,
    };
  }
  return { value: `${Math.round(heightCm)}`, unit: 'cm', full: `${Math.round(heightCm)} cm` };
}

export function formatEnergy(
  calories: number,
  energyUnit: EnergyUnit = 'kcal',
): { value: string; unit: string; full: string } {
  const val = Math.round(calories || 0);
  return {
    value: val.toLocaleString(),
    unit: energyUnit,
    full: `${val.toLocaleString()} ${energyUnit}`,
  };
}

export function formatFoodWeight(
  grams: number,
  foodUnit: FoodUnit = 'metric',
): { value: string; unit: string; full: string } {
  const g = Math.round(grams || 0);
  if (foodUnit === 'imperial') {
    const oz = Math.round((g / 28.3495) * 10) / 10;
    return { value: `${oz}`, unit: 'oz', full: `${oz} oz` };
  }
  return { value: `${g}`, unit: 'g', full: `${g} g` };
}

export function formatWater(
  ml: number,
  foodUnit: FoodUnit = 'metric',
): { value: string; unit: string; full: string } {
  const amount = Math.round(ml || 0);
  if (foodUnit === 'imperial') {
    const flOz = Math.round(amount / 29.5735);
    return { value: `${flOz}`, unit: 'fl oz', full: `${flOz} fl oz` };
  }
  return { value: `${amount}`, unit: 'ml', full: `${amount} ml` };
}
