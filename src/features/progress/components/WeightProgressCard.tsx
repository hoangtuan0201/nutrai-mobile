import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Line, Circle, Polyline, Text as SvgText } from 'react-native-svg';
import { ChevronRight } from 'lucide-react-native';
import theme from '../../../constants/theme';
import { WeightProgress, WeightDataPoint } from '../types';

interface WeightProgressCardProps {
  weight: WeightProgress;
  onGoalPress?: () => void;
  onPressCard?: () => void;
}

export const WeightProgressCard: React.FC<WeightProgressCardProps> = ({
  weight,
  onGoalPress,
  onPressCard,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(260, screenWidth - 76);
  const chartHeight = 150;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 26;

  // Chronological order for chart plotting (left to right)
  const rawHistory = weight.history || [];
  const history = [...rawHistory].reverse();
  const currentKg = weight.currentKg || 0;
  const targetKg = weight.targetKg || 0;

  // Calculate min and max for chart Y scale
  const allValues = [
    targetKg > 0 ? targetKg : currentKg,
    ...history.map((h: WeightDataPoint) => h.weightKg),
    currentKg > 0 ? currentKg : 60,
  ].filter((v) => v > 0);

  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const buffer = Math.max(2, (rawMax - rawMin) * 0.2);
  const minY = Math.floor(rawMin - buffer);
  const maxY = Math.ceil(rawMax + buffer);
  const yRange = Math.max(1, maxY - minY);

  const getYCoord = (val: number) => {
    const usableHeight = chartHeight - paddingTop - paddingBottom;
    const ratio = (val - minY) / yRange;
    return chartHeight - paddingBottom - ratio * usableHeight;
  };

  const getXCoord = (index: number, total: number) => {
    const usableWidth = chartWidth - paddingLeft - paddingRight;
    if (total <= 1) return paddingLeft + usableWidth / 2;
    return paddingLeft + (index / (total - 1)) * usableWidth;
  };

  // Generate Y axis ticks (e.g. 4 equidistant ticks)
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount }).map((_, i) => {
    const val = Math.round(minY + (yRange / (tickCount - 1)) * i);
    return { val, y: getYCoord(val) };
  });

  // Target Goal Y
  const targetY = targetKg > 0 ? getYCoord(targetKg) : null;

  // Build points for line
  const points = history.map((item: WeightDataPoint, index: number) => {
    const x = getXCoord(index, history.length);
    const y = getYCoord(item.weightKg);
    return { x, y, ...item };
  });

  const polylinePoints = points.map((p: { x: number; y: number }) => `${p.x},${p.y}`).join(' ');

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={onPressCard ? 0.9 : 1}
      onPress={onPressCard || onGoalPress}
    >
      {/* Top Header Row matching Appediet reference */}
      <View style={styles.topHeader}>
        <Text style={styles.title}>Weight</Text>

        <TouchableOpacity
          style={styles.goalBtn}
          activeOpacity={0.7}
          onPress={onGoalPress}
        >
          <Text style={styles.goalText}>
            Goal:{targetKg > 0 ? `${targetKg} kg` : 'Set Goal'}
          </Text>
          <ChevronRight size={14} color="#8E9388" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Current Weight Display */}
      <View style={styles.weightRow}>
        <Text style={styles.currentWeight}>
          {currentKg > 0 ? currentKg : '--'}
        </Text>
        <Text style={styles.unit}>kg</Text>
      </View>

      {/* SVG Chart */}
      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Y Axis Grid Lines & Ticks */}
          {ticks.map((tick, idx) => (
            <React.Fragment key={idx}>
              <Line
                x1={paddingLeft}
                y1={tick.y}
                x2={chartWidth - paddingRight}
                y2={tick.y}
                stroke="#F1EFE8"
                strokeWidth={1}
              />
              <SvgText
                x={paddingLeft - 8}
                y={tick.y + 4}
                fontSize={10}
                fill="#A6ABA1"
                textAnchor="end"
                fontFamily={theme.fonts.medium}
              >
                {tick.val}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Goal Line (Dashed) */}
          {targetY !== null && (
            <React.Fragment>
              <Line
                x1={paddingLeft}
                y1={targetY}
                x2={chartWidth - paddingRight}
                y2={targetY}
                stroke="#64748B"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <SvgText
                x={chartWidth - paddingRight}
                y={targetY - 5}
                fontSize={9}
                fill="#64748B"
                textAnchor="end"
                fontFamily={theme.fonts.bold}
              >
                Goal
              </SvgText>
            </React.Fragment>
          )}

          {/* Polyline connecting points */}
          {points.length > 1 && (
            <Polyline
              points={polylinePoints}
              fill="none"
              stroke={theme.colors.blue}
              strokeWidth={2.5}
            />
          )}

          {/* Points */}
          {points.map((p: any, idx: number) => (
            <React.Fragment key={idx}>
              <Circle
                cx={p.x}
                cy={p.y}
                r={5}
                fill="#FFFFFF"
                stroke={theme.colors.blue}
                strokeWidth={2.5}
              />
              {/* Date label at bottom (e.g. 10/14) */}
              <SvgText
                x={p.x}
                y={chartHeight - 6}
                fontSize={10}
                fill="#8E9388"
                textAnchor="middle"
                fontFamily={theme.fonts.regular}
              >
                {p.date.slice(5).replace('-', '/')}
              </SvgText>
            </React.Fragment>
          ))}
        </Svg>
      </View>

      <Text style={styles.footerHint}>Swipe right for more</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECEAE1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: '#131313',
  },
  goalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  goalText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
    color: '#6B675A',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  currentWeight: {
    fontFamily: theme.fonts.extraBold,
    fontSize: 28,
    color: '#131313',
  },
  unit: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#8E9388',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  footerHint: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: '#A6ABA1',
    textAlign: 'center',
    marginTop: 8,
  },
});
