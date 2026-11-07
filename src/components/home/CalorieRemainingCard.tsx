import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Flame } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { useUnitStore } from '../../store/unitStore';

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
  focusKey?: number;
  onTargetPress?: () => void;
}

export const CalorieRemainingCard: React.FC<CalorieRemainingCardProps> = React.memo(
  ({
    consumedCalories,
    targetCalories,
    consumedProtein,
    targetProtein,
    consumedCarbs,
    targetCarbs,
    consumedFat,
    targetFat,
    dateKey = '',
    focusKey = 0,
    onTargetPress,
  }) => {
    const router = useRouter();
    const { energyUnit } = useUnitStore();

    const handleTargetPress =
      onTargetPress || (() => router.push('/(main)/progress/calorie'));

    const isOverCalories = consumedCalories > targetCalories;
    const endCal = Math.max(0, Math.round(consumedCalories));
    const endBadgeCal = isOverCalories
      ? Math.max(0, Math.round(consumedCalories - targetCalories))
      : Math.max(0, Math.round(targetCalories - consumedCalories));
    const endP = Math.max(0, Math.round(consumedProtein));
    const endC = Math.max(0, Math.round(consumedCarbs));
    const endF = Math.max(0, Math.round(consumedFat));

    const endCalPct = Math.min(
      100,
      targetCalories > 0 ? (consumedCalories / targetCalories) * 100 : 0,
    );
    const endPPct = Math.min(
      100,
      targetProtein > 0 ? (consumedProtein / targetProtein) * 100 : 0,
    );
    const endCPct = Math.min(
      100,
      targetCarbs > 0 ? (consumedCarbs / targetCarbs) * 100 : 0,
    );
    const endFPct = Math.min(
      100,
      targetFat > 0 ? (consumedFat / targetFat) * 100 : 0,
    );

    // Animated.Value (0 -> 1) drives all 4 progress bars smoothly via interpolation
    const barProgress = useRef(new Animated.Value(0)).current;

    // Number counter state (throttled so React only re-renders ~20 times during sweep)
    const [counters, setCounters] = useState({
      cal: 0,
      badgeCal: 0,
      p: 0,
      c: 0,
      f: 0,
    });

    const prevTriggerRef = useRef(`${dateKey}-${focusKey}`);
    const currentCountersRef = useRef(counters);

    useEffect(() => {
      const nextTrigger = `${dateKey}-${focusKey}`;
      const isFreshSweep = prevTriggerRef.current !== nextTrigger;
      prevTriggerRef.current = nextTrigger;

      const startCounters = isFreshSweep
        ? { cal: 0, badgeCal: 0, p: 0, c: 0, f: 0 }
        : currentCountersRef.current;

      if (isFreshSweep) {
        barProgress.setValue(0);
        setCounters({ cal: 0, badgeCal: 0, p: 0, c: 0, f: 0 });
      }

      let animId: number;
      let timerId: ReturnType<typeof setTimeout>;
      const duration = 520;
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      // Delay 45ms on tab/date switch so screen transition finishes painting before animation starts
      const startDelay = isFreshSweep ? 45 : 0;

      timerId = setTimeout(() => {
        Animated.timing(barProgress, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();

        let startTime: number | null = null;
        let lastEmitTime = 0;

        const step = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(1, elapsed / duration);
          const eased = easeOutCubic(progress);

          // Throttle React text state updates to every ~28ms (or final frame) to keep UI thread at 60 FPS
          if (timestamp - lastEmitTime >= 28 || progress === 1) {
            lastEmitTime = timestamp;
            const nextState = {
              cal: Math.round(
                startCounters.cal + (endCal - startCounters.cal) * eased,
              ),
              badgeCal: Math.round(
                startCounters.badgeCal +
                  (endBadgeCal - startCounters.badgeCal) * eased,
              ),
              p: Math.round(startCounters.p + (endP - startCounters.p) * eased),
              c: Math.round(startCounters.c + (endC - startCounters.c) * eased),
              f: Math.round(startCounters.f + (endF - startCounters.f) * eased),
            };
            currentCountersRef.current = nextState;
            setCounters(nextState);
          }

          if (progress < 1) {
            animId = requestAnimationFrame(step);
          }
        };

        animId = requestAnimationFrame(step);
      }, startDelay);

      return () => {
        clearTimeout(timerId);
        if (animId) cancelAnimationFrame(animId);
        barProgress.stopAnimation();
      };
    }, [
      endCal,
      endBadgeCal,
      endP,
      endC,
      endF,
      endCalPct,
      endPPct,
      endCPct,
      endFPct,
      dateKey,
      focusKey,
      barProgress,
    ]);

    const mainBarWidth = barProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', `${endCalPct}%`],
    });
    const proteinBarWidth = barProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', `${endPPct}%`],
    });
    const carbsBarWidth = barProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', `${endCPct}%`],
    });
    const fatBarWidth = barProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', `${endFPct}%`],
    });

    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <TouchableOpacity
            style={styles.summaryCalLeft}
            activeOpacity={0.75}
            onPress={handleTargetPress}
          >
            <View style={styles.summaryFlameWrap}>
              <Flame size={20} color={theme.colors.saffron} />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Calories Consumed</Text>
              <View style={styles.summaryValueBaseline}>
                <Text style={styles.summaryCaloriesValue}>
                  {counters.cal.toLocaleString('en-US')}
                </Text>
                <Text style={styles.summaryTargetText}>
                  / {targetCalories.toLocaleString('en-US')} {energyUnit}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.remainingBadge,
              isOverCalories && styles.remainingBadgeOver,
            ]}
            activeOpacity={0.75}
            onPress={handleTargetPress}
          >
            <Text
              style={[
                styles.remainingBadgeValue,
                isOverCalories && styles.remainingBadgeValueOver,
              ]}
            >
              {isOverCalories
                ? `+${counters.badgeCal.toLocaleString('en-US')}`
                : counters.badgeCal.toLocaleString('en-US')}{' '}
              {energyUnit}
            </Text>
            <Text
              style={[
                styles.remainingBadgeSub,
                isOverCalories && styles.remainingBadgeValueOver,
              ]}
            >
              {isOverCalories ? 'over target' : 'remaining'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Calorie Animated Progress Bar */}
        <View style={styles.mainProgressTrack}>
          <Animated.View
            style={[
              styles.mainProgressFill,
              {
                width: mainBarWidth,
                backgroundColor: isOverCalories
                  ? '#F04B37'
                  : theme.colors.saffron,
              },
            ]}
          />
        </View>

        <View style={styles.summaryDivider} />

        {/* 3 Macro Progress Columns with Animated Counters & Progress Bars */}
        <View style={styles.macroGrid}>
          {/* Protein */}
          <View style={styles.macroColumn}>
            <View style={styles.macroHeaderRow}>
              <View
                style={[
                  styles.macroDot,
                  { backgroundColor: theme.macros.protein },
                ]}
              />
              <Text style={styles.macroName}>Protein</Text>
            </View>
            <Text style={styles.macroValText}>
              <Text
                style={[
                  styles.macroConsumedStrong,
                  { color: theme.macros.protein },
                ]}
              >
                {counters.p}
              </Text>
              /{targetProtein}g
            </Text>
            <View style={styles.macroMiniTrack}>
              <Animated.View
                style={[
                  styles.macroMiniFill,
                  {
                    width: proteinBarWidth,
                    backgroundColor: theme.macros.protein,
                  },
                ]}
              />
            </View>
          </View>

          {/* Carbs */}
          <View style={styles.macroColumn}>
            <View style={styles.macroHeaderRow}>
              <View
                style={[
                  styles.macroDot,
                  { backgroundColor: theme.macros.carbs },
                ]}
              />
              <Text style={styles.macroName}>Carbs</Text>
            </View>
            <Text style={styles.macroValText}>
              <Text
                style={[
                  styles.macroConsumedStrong,
                  { color: theme.macros.carbs },
                ]}
              >
                {counters.c}
              </Text>
              /{targetCarbs}g
            </Text>
            <View style={styles.macroMiniTrack}>
              <Animated.View
                style={[
                  styles.macroMiniFill,
                  {
                    width: carbsBarWidth,
                    backgroundColor: theme.macros.carbs,
                  },
                ]}
              />
            </View>
          </View>

          {/* Fat */}
          <View style={styles.macroColumn}>
            <View style={styles.macroHeaderRow}>
              <View
                style={[styles.macroDot, { backgroundColor: theme.macros.fat }]}
              />
              <Text style={styles.macroName}>Fat</Text>
            </View>
            <Text style={styles.macroValText}>
              <Text
                style={[
                  styles.macroConsumedStrong,
                  { color: theme.macros.fat },
                ]}
              >
                {counters.f}
              </Text>
              /{targetFat}g
            </Text>
            <View style={styles.macroMiniTrack}>
              <Animated.View
                style={[
                  styles.macroMiniFill,
                  {
                    width: fatBarWidth,
                    backgroundColor: theme.macros.fat,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE2',
    marginBottom: 16,
    ...theme.shadows.elevation1,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryCalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryFlameWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  summaryValueBaseline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  summaryCaloriesValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 24,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  summaryTargetText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  remainingBadge: {
    backgroundColor: '#FAF8F1',
    borderWidth: 1,
    borderColor: '#ECE9DF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    alignItems: 'flex-end',
  },
  remainingBadgeOver: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  remainingBadgeValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  remainingBadgeSub: {
    fontFamily: theme.fonts.medium,
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  remainingBadgeValueOver: {
    color: '#DC2626',
  },
  mainProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F0EFE7',
    marginTop: 14,
    overflow: 'hidden',
  },
  mainProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F2F0E8',
    marginVertical: 14,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  macroColumn: {
    flex: 1,
    backgroundColor: '#FAF9F4',
    borderRadius: 14,
    padding: 10,
  },
  macroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroName: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  macroValText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  macroConsumedStrong: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
  },
  macroMiniTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#EAE8DF',
    overflow: 'hidden',
  },
  macroMiniFill: {
    height: '100%',
    borderRadius: 3,
  },
});
