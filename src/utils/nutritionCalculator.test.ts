import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBMR,
  calculateTDEE,
  calculateClientNutritionPlan,
  validateTargetWeight,
  getPaceOptionsForGoal,
  kgToLb,
  lbToKg,
} from './nutritionCalculator.ts';

test('calculateBMR: calculates Mifflin-St Jeor accurately', () => {
  // Male: 10*70 + 6.25*175 - 5*25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 -> 1674
  const maleBmr = calculateBMR('MALE', 70, 175, 25);
  assert.equal(maleBmr, 1674);

  // Female: 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 -> 1345
  const femaleBmr = calculateBMR('FEMALE', 60, 165, 25);
  assert.equal(femaleBmr, 1345);
});

test('calculateTDEE: applies activity multiplier correctly', () => {
  const bmr = 1500;
  assert.equal(calculateTDEE(bmr, 'SEDENTARY'), Math.round(1500 * 1.2));
  assert.equal(calculateTDEE(bmr, 'MODERATE'), Math.round(1500 * 1.55));
  assert.equal(calculateTDEE(bmr, 'EXTRA_ACTIVE'), Math.round(1500 * 1.9));
});

test('calculateClientNutritionPlan: calculates 1.8g/kg protein and 0.9g/kg fat', () => {
  const plan = calculateClientNutritionPlan({
    gender: 'MALE',
    weightKg: 70,
    heightCm: 175,
    age: 25,
    activityLevel: 'MODERATE',
    fitnessGoal: 'LOSE_WEIGHT',
    pace: 'moderate', // 0.5 kg/week -> 550 deficit
  });

  // Protein = 70 * 1.8 = 126g
  assert.equal(plan.protein, 126);
  // Fat = 70 * 0.9 = 63g
  assert.equal(plan.fat, 63);
  // Total calories check
  assert.ok(plan.calories > 0);
  assert.ok(plan.carbs >= 30);
});

test('validateTargetWeight: ensures targets align with goal direction', () => {
  // LOSE_WEIGHT: target must be lower than current
  assert.equal(validateTargetWeight(70, 65, 'LOSE_WEIGHT').isValid, true);
  assert.equal(validateTargetWeight(70, 75, 'LOSE_WEIGHT').isValid, false);

  // BUILD_MUSCLE: target must be higher than current
  assert.equal(validateTargetWeight(70, 75, 'BUILD_MUSCLE').isValid, true);
  assert.equal(validateTargetWeight(70, 65, 'BUILD_MUSCLE').isValid, false);

  // MAINTAIN_WEIGHT: any valid current weight is valid
  assert.equal(validateTargetWeight(70, 70, 'MAINTAIN_WEIGHT').isValid, true);
});

test('unit conversions: kg to lb and back', () => {
  assert.equal(kgToLb(70), 154.3);
  assert.equal(lbToKg(154.3), 70);
});

test('getPaceOptionsForGoal: returns goal-specific options', () => {
  const loseOptions = getPaceOptionsForGoal('LOSE_WEIGHT');
  assert.equal(loseOptions.length, 3);
  assert.equal(loseOptions[1].weeklyRateKg, 0.5);

  const muscleOptions = getPaceOptionsForGoal('BUILD_MUSCLE');
  assert.equal(muscleOptions.length, 3);
  assert.equal(muscleOptions[0].weeklyRateKg, 0.1);
});
