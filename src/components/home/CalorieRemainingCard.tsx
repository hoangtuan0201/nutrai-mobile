import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Flame, Pencil } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useUnitStore, formatFoodWeight } from '../../store/unitStore';

export interface CalorieRemainingCardProps {
  consumedCalories: number;
  targetCalories: number;
  consumedProtein: number;
  targetProtein: number;
  consumedCarbs: number;
  targetCarbs: number;
  consumedFat: number;
  targetFat: number;
  dateKey?: string;
  onTargetPress?: () => void;
}

export const CalorieRemainingCard: React.FC<CalorieRemainingCardProps> = ({
  consumedCalories,
  targetCalories,
  consumedProtein,
  targetProtein,
  consumedCarbs,
  targetCarbs,
  consumedFat,
  targetFat,
  dateKey,
  onTargetPress,
}) => {
  const router = useRouter();
  const { energyUnit, foodUnit } = useUnitStore();

  const handleTargetPress = onTargetPress || (() => router.push('/settings'));

  // Target values
  const endConsumed = Math.max(0, Math.round(consumedCalories));
  const endRemaining = Math.max(0, Math.round(targetCalories - consumedCalories));
  const targetRatio =
    targetCalories > 0
      ? Math.min(1, Math.max(0, consumedCalories / targetCalories))
      : 0;

  // Animation states
  const [displayedConsumed, setDisplayedConsumed] = useState(endConsumed);
  const [displayedRemaining, setDisplayedRemaining] = useState(endRemaining);
  const [animatedRatio, setAnimatedRatio] = useState(targetRatio);

  const prevDateKeyRef = useRef(dateKey);
  const prevConsumedRef = useRef(endConsumed);

  useEffect(() => {
    const isDateChanged = prevDateKeyRef.current !== dateKey;
    prevDateKeyRef.current = dateKey;

    // When switching dates: always sweep forward from 0 to target (never go backwards)
    // When on the same date (e.g. food logged): animate from previous value to new value
    const startConsumed = isDateChanged ? 0 : prevConsumedRef.current;
    const startRemaining = isDateChanged ? 0 : displayedRemaining;
    const startRatio = isDateChanged ? 0 : animatedRatio;

    // If day has 0 kcal and starting from 0, settle immediately without animation loop
    if (endConsumed === 0 && startConsumed === 0) {
      setDisplayedConsumed(0);
      setDisplayedRemaining(endRemaining);
      setAnimatedRatio(0);
      prevConsumedRef.current = 0;
      return;
    }

    let startTime: number | null = null;
    let animId: number;
    const duration = 850; // Snappy 850ms for responsive speedometer sweep

    // Smooth ease-out cubic curve (fast rev, graceful deceleration)
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);

      setDisplayedConsumed(
        Math.round(startConsumed + (endConsumed - startConsumed) * eased)
      );
      setDisplayedRemaining(
        Math.round(startRemaining + (endRemaining - startRemaining) * eased)
      );
      setAnimatedRatio(startRatio + (targetRatio - startRatio) * eased);

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        prevConsumedRef.current = endConsumed;
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [endConsumed, endRemaining, targetRatio, dateKey]);

  // Speedometer progress ring math
  const ringSize = 96;
  const strokeWidth = 9;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - animatedRatio);

  return (
    <View style={styles.calorieCard}>
      <View style={styles.calorieMainRow}>
        {/* Left Progress Ring (Speedometer style animated sweep) */}
        <View style={styles.ringContainer}>
          <Svg width={ringSize} height={ringSize}>
            {/* Background Track */}
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke="#F3EFE6"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Animated Gauge Arc (only rendered when ratio > 0.005 to avoid stray round dot on empty ring) */}
            {animatedRatio > 0.005 && (
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke="#FF9114"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              />
            )}
          </Svg>

          {/* Center Content with Increasing Number */}
          <View style={styles.ringCenterContent}>
            <Flame size={20} color="#FF9114" style={{ marginBottom: 2 }} />
            <Text style={styles.ringValText}>
              {displayedConsumed.toLocaleString()}
            </Text>
            <Text style={styles.ringSubText}>{energyUnit}</Text>
          </View>
        </View>

        {/* Right Information with Increasing Remaining Calories */}
        <View style={styles.calorieInfoCol}>
          <View style={styles.timeframeRow}>
            <Text style={styles.calorieRemainingLabel}>Calories remaining</Text>
          </View>

          <View style={styles.bigCalorieRow}>
            <Text style={styles.bigCalorieNumber}>
              {displayedRemaining.toLocaleString()}
            </Text>
            <Text style={styles.bigCalorieUnit}>{energyUnit}</Text>
          </View>

          <TouchableOpacity
            style={styles.targetRow}
            activeOpacity={0.7}
            onPress={handleTargetPress}
          >
            <Text style={styles.targetText}>
              Target {targetCalories.toLocaleString()} {energyUnit}
            </Text>
            <Pencil size={12} color="#797E74" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.calorieCardDivider} />

      {/* Bottom Macro Breakdown Pills */}
      <View style={styles.macroPillsRow}>
        {/* Protein */}
        <View style={styles.macroPillItem}>
          <View style={[styles.macroDot, { backgroundColor: '#5D80E6' }]} />
          <Text style={styles.macroPillLabel}>Protein</Text>
          <Text style={styles.macroPillValue}>
            {formatFoodWeight(consumedProtein, foodUnit).value} /{' '}
            {formatFoodWeight(targetProtein, foodUnit).full}
          </Text>
        </View>

        {/* Carbs */}
        <View style={styles.macroPillItem}>
          <View style={[styles.macroDot, { backgroundColor: '#7BC754' }]} />
          <Text style={styles.macroPillLabel}>Carbs</Text>
          <Text style={styles.macroPillValue}>
            {formatFoodWeight(consumedCarbs, foodUnit).value} /{' '}
            {formatFoodWeight(targetCarbs, foodUnit).full}
          </Text>
        </View>

        {/* Fat */}
        <View style={styles.macroPillItem}>
          <View style={[styles.macroDot, { backgroundColor: '#F5A623' }]} />
          <Text style={styles.macroPillLabel}>Fat</Text>
          <Text style={styles.macroPillValue}>
            {formatFoodWeight(consumedFat, foodUnit).value} /{' '}
            {formatFoodWeight(targetFat, foodUnit).full}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calorieCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EFECE2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  calorieMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringContainer: {
    position: 'relative',
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ringCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B281B',
    lineHeight: 18,
  },
  ringSubText: {
    fontSize: 11,
    color: '#767B71',
    fontWeight: '600',
  },
  calorieInfoCol: {
    flex: 1,
  },
  timeframeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  calorieRemainingLabel: {
    fontSize: 12,
    color: '#767B71',
    fontWeight: '600',
  },
  bigCalorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  bigCalorieNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B281B',
    letterSpacing: -0.5,
  },
  bigCalorieUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B281B',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  targetText: {
    fontSize: 12,
    color: '#767B71',
    fontWeight: '600',
  },
  calorieCardDivider: {
    height: 1,
    backgroundColor: '#F3EFE8',
    marginVertical: 14,
  },
  macroPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  macroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  macroPillLabel: {
    fontSize: 11,
    color: '#656A60',
    fontWeight: '600',
  },
  macroPillValue: {
    fontSize: 11,
    color: '#1B281B',
    fontWeight: '700',
  },
});
