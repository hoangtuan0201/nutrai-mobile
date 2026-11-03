import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, {
  Defs,
  ClipPath,
  Rect,
  Line,
  G,
  Path,
  Text as SvgText,
} from 'react-native-svg';
import { ChevronRight } from 'lucide-react-native';
import theme from '../../../constants/theme';
import { CalorieIntakeProgress, DailyMacroSummary } from '../types';

export type CalorieTimeframe = 'Daily' | 'Weekly' | 'Monthly';

// Synchronized Macro Colors with Homepage & Theme
export const MACRO_THEME_COLORS = {
  carbs: '#7BC754',   // Soft Leaf Green (from Homepage CalorieRemainingCard)
  protein: '#5D80E6', // Soft Blue / Violet (from Homepage CalorieRemainingCard)
  fat: '#F5A623',     // Golden Honey / Amber (from Homepage CalorieRemainingCard)
  quickLog: '#9CA3AF',// Neutral Gray for Quick Log
};

interface ChartBarItem {
  id: string;
  label: string;
  fullDate?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quickLog: number;
  tooltipText: string;
  isLogged: boolean;
}

interface CalorieIntakeCardProps {
  calorieIntake: CalorieIntakeProgress;
  onGoalPress?: () => void;
  onPressCard?: () => void;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  timeframe?: CalorieTimeframe;
  onTimeframeChange?: (tf: CalorieTimeframe) => void;
  hideHeaderGoal?: boolean;
}

export const CalorieIntakeCard: React.FC<CalorieIntakeCardProps> = ({
  calorieIntake,
  onGoalPress,
  onPressCard,
  selectedDate,
  onSelectDate,
  timeframe = 'Daily',
  onTimeframeChange,
  hideHeaderGoal = false,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(260, screenWidth - 76);
  const chartHeight = 195;
  const paddingLeft = 38;
  const paddingRight = 16;
  const paddingTop = 32; // headroom for centered floating tooltip
  const paddingBottom = 26;

  const rawHistory = calorieIntake.history || [];
  const targetCalories = calorieIntake.targetCalories || 2000;

  // Transform and aggregate data according to selected timeframe (Daily, Weekly, Monthly)
  const chartBars = useMemo((): ChartBarItem[] => {
    if (rawHistory.length === 0) return [];

    if (timeframe === 'Daily') {
      // Last 7 days
      const days = rawHistory.slice(-7);
      return days.map((d) => {
        const fatCals = (d.fat || 0) * 9;
        const proteinCals = (d.protein || 0) * 4;
        const carbCals = (d.carbs || 0) * 4;
        const macrosTotal = fatCals + proteinCals + carbCals;
        const quickLogCals = Math.max(0, d.calories - macrosTotal);

        return {
          id: d.date,
          label: d.date.slice(5).replace('-', '/'),
          fullDate: d.date,
          calories: d.calories,
          protein: d.protein || 0,
          carbs: d.carbs || 0,
          fat: d.fat || 0,
          quickLog: quickLogCals,
          tooltipText: `${d.calories} kcal`,
          isLogged: d.calories > 0,
        };
      });
    }

    if (timeframe === 'Weekly') {
      // Group last 28 days into 4 weeks of 7 days
      const last28 = rawHistory.slice(-28);
      const weeks: ChartBarItem[] = [];
      const totalWeeks = Math.min(4, Math.ceil(last28.length / 7));

      for (let w = 0; w < totalWeeks; w++) {
        const start = Math.max(0, last28.length - (totalWeeks - w) * 7);
        const end = last28.length - (totalWeeks - w - 1) * 7;
        const slice = last28.slice(start, end);
        if (slice.length === 0) continue;

        const loggedDays = slice.filter((d) => d.calories > 0);
        const count = Math.max(1, loggedDays.length);
        const sumCals = slice.reduce((s, d) => s + d.calories, 0);
        const sumPro = slice.reduce((s, d) => s + (d.protein || 0), 0);
        const sumCarb = slice.reduce((s, d) => s + (d.carbs || 0), 0);
        const sumFat = slice.reduce((s, d) => s + (d.fat || 0), 0);

        const avgCals = Math.round(sumCals / count);
        const avgPro = Math.round((sumPro / count) * 10) / 10;
        const avgCarb = Math.round((sumCarb / count) * 10) / 10;
        const avgFat = Math.round((sumFat / count) * 10) / 10;

        const fatCals = avgFat * 9;
        const proteinCals = avgPro * 4;
        const carbCals = avgCarb * 4;
        const quickLogCals = Math.max(0, avgCals - (fatCals + proteinCals + carbCals));

        const endDate = slice[slice.length - 1].date;
        const isCurrent = w === totalWeeks - 1;
        const weekLabel = isCurrent ? 'This Wk' : `W${w + 1}`;

        weeks.push({
          id: `week_${w}_${endDate}`,
          label: weekLabel,
          fullDate: endDate,
          calories: avgCals,
          protein: avgPro,
          carbs: avgCarb,
          fat: avgFat,
          quickLog: quickLogCals,
          tooltipText: `${avgCals} kcal/d`,
          isLogged: avgCals > 0,
        });
      }

      return weeks;
    }

    // Monthly: Group by calendar month
    const monthGroups = new Map<string, DailyMacroSummary[]>();
    for (const d of rawHistory) {
      const monthKey = d.date.slice(0, 7); // YYYY-MM
      if (!monthGroups.has(monthKey)) monthGroups.set(monthKey, []);
      monthGroups.get(monthKey)!.push(d);
    }

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const months: ChartBarItem[] = [];
    for (const [key, slice] of monthGroups.entries()) {
      const parts = key.split('-');
      const monthIndex = parseInt(parts[1], 10) - 1;
      const label = monthNames[monthIndex] || key;

      const loggedDays = slice.filter((d) => d.calories > 0);
      const count = Math.max(1, loggedDays.length);
      const sumCals = slice.reduce((s, d) => s + d.calories, 0);
      const sumPro = slice.reduce((s, d) => s + (d.protein || 0), 0);
      const sumCarb = slice.reduce((s, d) => s + (d.carbs || 0), 0);
      const sumFat = slice.reduce((s, d) => s + (d.fat || 0), 0);

      const avgCals = Math.round(sumCals / count);
      const avgPro = Math.round((sumPro / count) * 10) / 10;
      const avgCarb = Math.round((sumCarb / count) * 10) / 10;
      const avgFat = Math.round((sumFat / count) * 10) / 10;

      const fatCals = avgFat * 9;
      const proteinCals = avgPro * 4;
      const carbCals = avgCarb * 4;
      const quickLogCals = Math.max(0, avgCals - (fatCals + proteinCals + carbCals));

      months.push({
        id: `month_${key}`,
        label,
        fullDate: slice[slice.length - 1]?.date,
        calories: avgCals,
        protein: avgPro,
        carbs: avgCarb,
        fat: avgFat,
        quickLog: quickLogCals,
        tooltipText: `${avgCals} kcal/d`,
        isLogged: avgCals > 0,
      });
    }

    return months.slice(-6); // show up to last 6 months
  }, [rawHistory, timeframe]);

  // Selected bar tracking
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);

  // Default to selecting the active or last bar
  const activeBarId = useMemo(() => {
    if (selectedDate && timeframe === 'Daily') {
      const match = chartBars.find((b) => b.fullDate === selectedDate);
      if (match) return match.id;
    }
    if (internalActiveId && chartBars.some((b) => b.id === internalActiveId)) {
      return internalActiveId;
    }
    // Default to last logged bar
    const lastLogged = [...chartBars].reverse().find((b) => b.isLogged);
    return lastLogged ? lastLogged.id : chartBars.length > 0 ? chartBars[chartBars.length - 1].id : null;
  }, [selectedDate, timeframe, internalActiveId, chartBars]);

  // Compute average calories for the current timeframe
  const displayAverage = useMemo(() => {
    const logged = chartBars.filter((b) => b.isLogged);
    if (logged.length === 0) return 0;
    return Math.round(logged.reduce((s, b) => s + b.calories, 0) / logged.length);
  }, [chartBars]);

  // Subtitle timeframe text
  const subtitleLabel = useMemo(() => {
    if (timeframe === 'Daily') return 'Last 7 days';
    if (timeframe === 'Weekly') return 'Weekly avg (Last 4 weeks)';
    return 'Monthly avg';
  }, [timeframe]);

  // Compute maximum Y for scale
  const maxRecorded = Math.max(0, ...chartBars.map((h) => h.calories));
  const rawMax = Math.max(targetCalories * 1.25, maxRecorded * 1.15, 1200);
  const stepSize = rawMax > 4000 ? 1500 : rawMax > 2500 ? 1000 : 750;
  const maxY = Math.ceil(rawMax / stepSize) * stepSize;

  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const usableBottom = chartHeight - paddingBottom;

  const getYCoord = (val: number) => {
    const ratio = Math.min(1, Math.max(0, val / maxY));
    return chartHeight - paddingBottom - ratio * usableHeight;
  };

  const targetY = getYCoord(targetCalories);

  // 4 Y axis ticks
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount }).map((_, i) => {
    const val = Math.round((maxY / (tickCount - 1)) * i);
    return { val, y: getYCoord(val) };
  });

  // Calculate Bar geometry
  const barCount = Math.max(1, chartBars.length);
  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const gap = usableWidth / barCount;
  const barWidth = Math.min(22, Math.max(16, gap * 0.46));
  const topRadius = Math.min(6, barWidth / 2);

  const handleBarPress = (item: ChartBarItem) => {
    setInternalActiveId(item.id);
    if (item.fullDate && onSelectDate && timeframe === 'Daily') {
      onSelectDate(item.fullDate);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerTitleWrap}
          activeOpacity={onPressCard ? 0.7 : 1}
          onPress={onPressCard}
        >
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.title}>Calorie Intake</Text>
              {onPressCard && <ChevronRight size={16} color="#8E9388" />}
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statValue}>
                {displayAverage > 0 ? displayAverage.toLocaleString() : '0'}
              </Text>
              <Text style={styles.unit}>kcal</Text>
              <Text style={styles.timeframe}>{subtitleLabel}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {!hideHeaderGoal && targetCalories > 0 && (
          <TouchableOpacity
            style={styles.goalButton}
            activeOpacity={0.7}
            onPress={onGoalPress || onPressCard}
          >
            <Text style={styles.goalLabel}>Goal {targetCalories} kcal</Text>
            <ChevronRight size={14} color="#8E9388" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stacked Bar Chart */}
      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            {chartBars.map((bar, idx) => {
              const barCenterX = paddingLeft + idx * gap + gap / 2;
              const barX = barCenterX - barWidth / 2;
              const totalBarHeight = (bar.calories / maxY) * usableHeight;
              const barY = Math.max(paddingTop, usableBottom - totalBarHeight);
              const height = Math.max(2, usableBottom - barY);
              const r = Math.min(topRadius, height / 2);

              // SVG Path: Flat bottom, rounded top-left and top-right corners only
              const clipPathD = `
                M ${barX} ${usableBottom}
                L ${barX} ${barY + r}
                A ${r} ${r} 0 0 1 ${barX + r} ${barY}
                L ${barX + barWidth - r} ${barY}
                A ${r} ${r} 0 0 1 ${barX + barWidth} ${barY + r}
                L ${barX + barWidth} ${usableBottom}
                Z
              `;

              return (
                <ClipPath key={`clip_${bar.id || idx}`} id={`clip_${bar.id || idx}`}>
                  <Path d={clipPathD} />
                </ClipPath>
              );
            })}
          </Defs>

          {/* Grid lines & Y Ticks */}
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
                x={paddingLeft - 6}
                y={tick.y + 3.5}
                fontSize={9}
                fill="#A6ABA1"
                textAnchor="end"
                fontFamily={theme.fonts.medium}
              >
                {tick.val}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Goal Line (Dashed) */}
          <Line
            x1={paddingLeft}
            y1={targetY}
            x2={chartWidth - paddingRight}
            y2={targetY}
            stroke="#94A3B8"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <SvgText
            x={chartWidth - paddingRight}
            y={targetY - 4}
            fontSize={9}
            fill="#64748B"
            textAnchor="end"
            fontFamily={theme.fonts.bold}
          >
            Goal
          </SvgText>

          {/* Stacked Bars */}
          {chartBars.map((bar: ChartBarItem, idx: number) => {
            const barCenterX = paddingLeft + idx * gap + gap / 2;
            const barX = barCenterX - barWidth / 2;

            // Macro calories
            const fatCals = bar.fat * 9;
            const proteinCals = bar.protein * 4;
            const carbCals = bar.carbs * 4;
            const quickLogCals = bar.quickLog;

            // Layer Heights
            const fatH = (fatCals / maxY) * usableHeight;
            const proteinH = (proteinCals / maxY) * usableHeight;
            const carbH = (carbCals / maxY) * usableHeight;
            const quickH = (quickLogCals / maxY) * usableHeight;

            // Coordinates from bottom to top:
            // 1. Fat (#F5A623) at bottom
            // 2. Protein (#5D80E6) middle
            // 3. Carb (#7BC754) upper
            // 4. Quick Log (#9CA3AF) top
            const fatY = usableBottom - fatH;
            const proteinY = fatY - proteinH;
            const carbY = proteinY - carbH;
            const quickY = carbY - quickH;

            const totalBarHeight = (bar.calories / maxY) * usableHeight;
            const topBarY = usableBottom - totalBarHeight;

            const isSelected = activeBarId === bar.id;

            return (
              <G key={`bar_${bar.id || idx}`}>
                {/* Invisible wide hit area for easy tapping */}
                <Rect
                  x={barCenterX - gap / 2}
                  y={0}
                  width={gap}
                  height={chartHeight}
                  fill="transparent"
                  onPress={() => handleBarPress(bar)}
                />

                {/* Empty / unlogged placeholder dot */}
                {!bar.isLogged && (
                  <Rect
                    x={barX + barWidth * 0.35}
                    y={usableBottom - 3}
                    width={barWidth * 0.3}
                    height={3}
                    rx={1.5}
                    fill="#E2E8F0"
                    onPress={() => handleBarPress(bar)}
                  />
                )}

                {/* Stacked Fill with Flat Bottom & Top Rounded ClipPath */}
                {bar.isLogged && (
                  <G
                    clipPath={`url(#clip_${bar.id || idx})`}
                    onPress={() => handleBarPress(bar)}
                  >
                    {/* 1. Fat: Yellow / Amber #F5A623 */}
                    <Rect
                      x={barX}
                      y={fatY}
                      width={barWidth}
                      height={fatH}
                      fill={MACRO_THEME_COLORS.fat}
                    />
                    {/* 2. Protein: Blue #5D80E6 */}
                    <Rect
                      x={barX}
                      y={proteinY}
                      width={barWidth}
                      height={proteinH}
                      fill={MACRO_THEME_COLORS.protein}
                    />
                    {/* 3. Carb: Green #7BC754 */}
                    <Rect
                      x={barX}
                      y={carbY}
                      width={barWidth}
                      height={carbH}
                      fill={MACRO_THEME_COLORS.carbs}
                    />
                    {/* 4. Quick Log: Gray #9CA3AF */}
                    {quickH > 0 && (
                      <Rect
                        x={barX}
                        y={quickY}
                        width={barWidth}
                        height={quickH}
                        fill={MACRO_THEME_COLORS.quickLog}
                      />
                    )}
                  </G>
                )}

                {/* Perfectly Centered Floating Tooltip: Root positioned directly at (barCenterX, tooltipY) */}
                {isSelected && bar.isLogged && (() => {
                  const tooltipWidth = 72;
                  const tooltipHeight = 24;
                  const arrowHeight = 5;

                  // Tooltip Y above bar top
                  const tooltipY = Math.max(2, topBarY - tooltipHeight - arrowHeight - 3);

                  // Keep box within chart horizontally if bar is at extreme edge
                  const minLeft = paddingLeft + 2;
                  const maxRight = chartWidth - paddingRight - 2;
                  const boxLeft = barCenterX - tooltipWidth / 2;
                  const boxRight = barCenterX + tooltipWidth / 2;

                  let boxOffset = 0;
                  if (boxLeft < minLeft) {
                    boxOffset = minLeft - boxLeft;
                  } else if (boxRight > maxRight) {
                    boxOffset = maxRight - boxRight;
                  }

                  return (
                    <G
                      key={`tooltip_${bar.id || idx}`}
                      transform={`translate(${barCenterX}, ${tooltipY})`}
                    >
                      {/* Tooltip Background Box centered around x = 0 */}
                      <Rect
                        x={-tooltipWidth / 2 + boxOffset}
                        y={0}
                        width={tooltipWidth}
                        height={tooltipHeight}
                        rx={8}
                        fill="#1E293B"
                      />
                      {/* Triangle arrow centered at x = 0 pointing directly at bar center */}
                      <Path
                        d={`M -5 ${tooltipHeight}
                           L 0 ${tooltipHeight + arrowHeight}
                           L 5 ${tooltipHeight}
                           Z`}
                        fill="#1E293B"
                      />
                      {/* Centered text inside box */}
                      <SvgText
                        x={boxOffset}
                        y={tooltipHeight / 2 + 3.5}
                        fontSize={10.5}
                        fill="#FFFFFF"
                        textAnchor="middle"
                        fontFamily={theme.fonts.bold}
                      >
                        {bar.tooltipText}
                      </SvgText>
                    </G>
                  );
                })()}

                {/* X-axis label */}
                <SvgText
                  x={barCenterX}
                  y={chartHeight - 6}
                  fontSize={9}
                  fill={isSelected ? '#131313' : '#8E9388'}
                  textAnchor="middle"
                  fontFamily={isSelected ? theme.fonts.bold : theme.fonts.regular}
                  onPress={() => handleBarPress(bar)}
                >
                  {bar.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Macro Legend Synchronized with Homepage */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.square, { backgroundColor: MACRO_THEME_COLORS.carbs }]} />
          <Text style={styles.legendText}>Carb</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.square, { backgroundColor: MACRO_THEME_COLORS.protein }]} />
          <Text style={styles.legendText}>Protein</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.square, { backgroundColor: MACRO_THEME_COLORS.fat }]} />
          <Text style={styles.legendText}>Fat</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.square, { backgroundColor: MACRO_THEME_COLORS.quickLog }]} />
          <Text style={styles.legendText}>Quick Log</Text>
        </View>
      </View>

      {/* Timeframe Segmented Control */}
      <View style={styles.segmentedContainer}>
        {(['Daily', 'Weekly', 'Monthly'] as CalorieTimeframe[]).map((tf) => {
          const isActive = timeframe === tf;
          return (
            <TouchableOpacity
              key={tf}
              style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
              activeOpacity={0.7}
              onPress={() => onTimeframeChange && onTimeframeChange(tf)}
            >
              <Text
                style={[
                  styles.segmentText,
                  isActive && styles.segmentTextActive,
                ]}
              >
                {tf}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.swipeHint}>Swipe right for more • Tap bar to inspect</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: '#131313',
    marginBottom: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    fontFamily: theme.fonts.extraBold,
    fontSize: 24,
    color: '#131313',
  },
  unit: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: '#8E9388',
  },
  timeframe: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: '#A6ABA1',
    marginLeft: 4,
  },
  goalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F7F6F0',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  goalLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
    color: '#6B675A',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F4F2E7',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  square: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: '#6B675A',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F4F2E7',
    borderRadius: 12,
    padding: 3,
    marginTop: 4,
    marginBottom: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#8E9388',
  },
  segmentTextActive: {
    fontFamily: theme.fonts.semiBold,
    color: '#FFFFFF',
  },
  swipeHint: {
    fontFamily: theme.fonts.regular,
    fontSize: 10.5,
    color: '#A6ABA1',
    textAlign: 'center',
    marginTop: 2,
  },
});
