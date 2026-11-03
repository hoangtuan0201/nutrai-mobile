import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, {
  Line,
  Circle,
  Polyline,
  Rect,
  G,
  Path,
  Text as SvgText,
} from 'react-native-svg';
import { ChevronRight } from 'lucide-react-native';
import theme from '../../../constants/theme';
import { WeightProgress, WeightDataPoint } from '../types';
import { useUnitStore, formatWeight } from '../../../store/unitStore';

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
  const { bodyUnit } = useUnitStore();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(260, screenWidth - 76);
  const chartHeight = 175;
  const paddingLeft = 34;
  const paddingRight = 16;
  const paddingTop = 32; // headroom for centered floating tooltip
  const paddingBottom = 26;

  // Chronological order for chart plotting (left to right)
  const rawHistory = weight.history || [];
  const history = useMemo(() => [...rawHistory].reverse(), [rawHistory]);
  const currentKg = weight.currentKg || 0;
  const targetKg = weight.targetKg || 0;

  // Selected point tracking (defaults to latest point)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeIndex = useMemo(() => {
    if (history.length === 0) return -1;
    if (selectedId) {
      const foundIdx = history.findIndex(
        (item, idx) => (item.id || `${item.date}_${idx}`) === selectedId,
      );
      if (foundIdx !== -1) return foundIdx;
    }
    return history.length - 1;
  }, [history, selectedId]);

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
    const gap = usableWidth / total;
    return paddingLeft + index * gap + gap / 2;
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
    const pointKey = item.id || `${item.date}_${index}`;
    return { x, y, pointKey, ...item };
  });

  const polylinePoints = points.map((p: { x: number; y: number }) => `${p.x},${p.y}`).join(' ');
  const hitWidth = points.length > 0
    ? (chartWidth - paddingLeft - paddingRight) / points.length
    : 60;

  return (
    <View style={styles.card}>
      {/* Top Header Row matching Appediet reference */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.headerTitleWrap}
          activeOpacity={onPressCard ? 0.7 : 1}
          onPress={onPressCard || onGoalPress}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.title}>Weight</Text>
            {onPressCard && <ChevronRight size={16} color="#8E9388" />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.goalBtn}
          activeOpacity={0.7}
          onPress={onGoalPress || onPressCard}
        >
          <Text style={styles.goalText}>
            Goal:{targetKg > 0 ? formatWeight(targetKg, bodyUnit).full : 'Set Goal'}
          </Text>
          <ChevronRight size={14} color="#8E9388" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Current Weight Display */}
      <TouchableOpacity
        style={styles.weightRow}
        activeOpacity={onPressCard ? 0.7 : 1}
        onPress={onPressCard}
      >
        <Text style={styles.currentWeight}>
          {currentKg > 0 ? formatWeight(currentKg, bodyUnit).value : '--'}
        </Text>
        <Text style={styles.unit}>{formatWeight(currentKg, bodyUnit).unit}</Text>
      </TouchableOpacity>

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

          {/* Points & Interactive Hit Areas */}
          {points.map((p, idx: number) => {
            const isSelected = idx === activeIndex;

            return (
              <G key={p.pointKey}>
                {/* Wide transparent hit area for easy tapping */}
                <Rect
                  x={p.x - Math.max(22, hitWidth / 2)}
                  y={0}
                  width={Math.max(44, hitWidth)}
                  height={chartHeight}
                  fill="transparent"
                  onPress={() => setSelectedId(p.pointKey)}
                />

                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? 6 : 5}
                  fill={isSelected ? theme.colors.blue : '#FFFFFF'}
                  stroke={isSelected ? '#FFFFFF' : theme.colors.blue}
                  strokeWidth={2.5}
                  onPress={() => setSelectedId(p.pointKey)}
                />

                {/* Date label at bottom (e.g. 10/14) */}
                <SvgText
                  x={p.x}
                  y={chartHeight - 6}
                  fontSize={10}
                  fill={isSelected ? '#131313' : '#8E9388'}
                  textAnchor="middle"
                  fontFamily={isSelected ? theme.fonts.bold : theme.fonts.regular}
                  onPress={() => setSelectedId(p.pointKey)}
                >
                  {p.date.slice(5).replace('-', '/')}
                </SvgText>
              </G>
            );
          })}

          {/* Centered Floating Tooltip for Selected Point */}
          {activeIndex >= 0 && points[activeIndex] && (() => {
            const p = points[activeIndex];
            const tooltipWidth = 72;
            const tooltipHeight = 24;
            const arrowHeight = 5;
            const tooltipY = Math.max(2, p.y - tooltipHeight - arrowHeight - 6);

            const minLeft = paddingLeft + 2;
            const maxRight = chartWidth - paddingRight - 2;
            const boxLeft = p.x - tooltipWidth / 2;
            const boxRight = p.x + tooltipWidth / 2;

            let boxOffset = 0;
            if (boxLeft < minLeft) {
              boxOffset = minLeft - boxLeft;
            } else if (boxRight > maxRight) {
              boxOffset = maxRight - boxRight;
            }

            // Keep the arrow (-5..5) well inside the rounded corners (rx=8) of the pill
            const maxShift = tooltipWidth / 2 - 12;
            boxOffset = Math.max(-maxShift, Math.min(maxShift, boxOffset));

            const tooltipLabel = formatWeight(p.weightKg, bodyUnit).full;

            return (
              <G
                key={`tooltip_${p.pointKey}`}
                transform={`translate(${p.x}, ${tooltipY})`}
              >
                <Rect
                  x={-tooltipWidth / 2 + boxOffset}
                  y={0}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  rx={8}
                  fill="#1E293B"
                />
                <Path
                  d={`M -5 ${tooltipHeight - 1}
                     L 0 ${tooltipHeight + arrowHeight}
                     L 5 ${tooltipHeight - 1}
                     Z`}
                  fill="#1E293B"
                />
                <SvgText
                  x={boxOffset}
                  y={tooltipHeight / 2 + 3.5}
                  fontSize={10.5}
                  fill="#FFFFFF"
                  textAnchor="middle"
                  fontFamily={theme.fonts.bold}
                >
                  {tooltipLabel}
                </SvgText>
              </G>
            );
          })()}
        </Svg>
      </View>
    </View>
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
  headerTitleWrap: {
    flex: 1,
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
