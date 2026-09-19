import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { theme } from '../../constants';

export interface MacroSegment {
  color: string;
  value: number; // in grams or kcal
  calories?: number;
  label?: string;
}

export interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  // Multi-segment mode (NutraAI Signature Macro Ring)
  segments?: MacroSegment[];
  totalTarget?: number;
  // Single metric mode
  consumed?: number;
  target?: number;
  progressColor?: string;
  trackColor?: string;
  // Center content
  centerValue?: string | number;
  centerLabel?: string;
  centerSublabel?: string;
  showStats?: boolean;
  goal?: number;
  remaining?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size = 190,
  strokeWidth = 14,
  segments,
  totalTarget = 2400,
  consumed,
  target,
  progressColor = theme.colors.saffron,
  trackColor = 'rgba(19, 19, 19, 0.07)',
  centerValue,
  centerLabel = 'KCAL CONSUMED',
  centerSublabel,
  showStats = false,
  goal,
  remaining,
  children,
  style,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Render multi-segment or single segment
  const isMultiSegment = segments && segments.length > 0;

  // Calculate segments for multi-segment mode
  let cumulativeAngle = -90;
  const segmentElements = isMultiSegment
    ? segments.map((seg, index) => {
        // Calories from this macro: carbs 4kcal/g, protein 4kcal/g, fat 9kcal/g or direct calories
        const cal = seg.calories ?? seg.value;
        const ratio = Math.max(0, Math.min(cal / (totalTarget || 1), 1));
        const arcLength = ratio * circumference;
        const currentAngle = cumulativeAngle;

        // Advance angle for next segment with a small gap (2 degrees)
        const gapDegrees = 3;
        const arcDegrees = ratio * 360;
        cumulativeAngle += arcDegrees + gapDegrees;

        if (arcLength <= 0) return null;

        return (
          <Circle
            key={index}
            cx={center}
            cy={center}
            r={radius}
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${Math.max(arcLength - 2, 0)} ${circumference}`}
            strokeLinecap="round"
            fill="none"
            originX={center}
            originY={center}
            rotation={currentAngle}
          />
        );
      })
    : null;

  // Single metric calculation
  const singleRatio =
    consumed !== undefined && target !== undefined
      ? Math.min(Math.max(consumed / (target || 1), 0), 1)
      : 0;
  const singleOffset = circumference - singleRatio * circumference;

  const displayCenterValue =
    centerValue !== undefined
      ? centerValue
      : consumed !== undefined
      ? consumed.toLocaleString()
      : '0';

  const calcGoal = goal ?? target ?? totalTarget;
  const calcRemaining =
    remaining ??
    (consumed !== undefined && calcGoal !== undefined
      ? Math.max(calcGoal - consumed, 0)
      : 0);

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.ringContainer, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          {/* Background Track Circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {isMultiSegment ? (
            <G>{segmentElements}</G>
          ) : (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={progressColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={singleOffset}
              strokeLinecap="round"
              fill="none"
              originX={center}
              originY={center}
              rotation="-90"
            />
          )}
        </Svg>

        {/* Center Content */}
        <View style={styles.centerContent}>
          {children ? (
            children
          ) : (
            <>
              <Text style={styles.centerValue}>{displayCenterValue}</Text>
              <Text style={styles.centerLabel}>{centerLabel}</Text>
              {centerSublabel && (
                <Text style={styles.centerSublabel}>{centerSublabel}</Text>
              )}
            </>
          )}
        </View>
      </View>

      {/* Optional Stats Footer (Goal vs Remaining) */}
      {showStats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Goal</Text>
            <Text style={styles.statValue}>{calcGoal.toLocaleString()}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={[styles.statValue, styles.remainingValue]}>
              {calcRemaining.toLocaleString()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  centerValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  centerLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  centerSublabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(19, 19, 19, 0.08)',
  },
  statLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  remainingValue: {
    color: theme.colors.saffron,
  },
});
