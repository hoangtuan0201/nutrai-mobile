export const formatGoalLabel = (goal: string) => {
  switch (goal) {
    case 'WEIGHT_LOSS':
    case 'LOSE_WEIGHT':
      return 'Lose fat';
    case 'MUSCLE_GAIN':
    case 'BUILD_MUSCLE':
      return 'Build muscle';
    case 'MAINTENANCE':
    case 'MAINTAIN_WEIGHT':
      return 'Maintain weight';
    default:
      return 'Healthy lifestyle';
  }
};

export const formatActivityLabel = (level: string) => {
  switch (level) {
    case 'SEDENTARY':
      return 'Sedentary';
    case 'LIGHT':
      return 'Lightly active';
    case 'VERY_ACTIVE':
      return 'Very active';
    case 'EXTRA_ACTIVE':
      return 'Extra active';
    default:
      return 'Moderately active';
  }
};

export const formatActivitySubtitle = (level: string) => {
  switch (level) {
    case 'SEDENTARY':
      return 'Little to no exercise';
    case 'LIGHT':
      return '1-3 days/week';
    case 'VERY_ACTIVE':
      return '6-7 days/week';
    case 'EXTRA_ACTIVE':
      return 'Athletic / 2x daily';
    default:
      return '3-5 days/week';
  }
};

/** 480 → "08:00" */
export const minutesToTime = (minutes: number | null | undefined) => {
  const m = minutes ?? 0;
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

