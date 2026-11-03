import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Calendar,
  Pencil,
  Flag,
  Scale,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react-native';
import Svg, {
  Line,
  Circle,
  Polyline,
  Polygon,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import theme from '../../../src/constants/theme';
import { progressApi } from '../../../src/features/progress/api/progress.api';
import { ProgressOverviewResponse, WeightDataPoint } from '../../../src/features/progress/types';
import { LogWeightModal } from '../../../src/features/progress/components/LogWeightModal';
import { EditGoalsModal } from '../../../src/features/profile/components/EditGoalsModal';
import { useUnitStore, formatWeight } from '../../../src/store/unitStore';

export default function WeightDetailScreen() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(260, screenWidth - 76);
  const chartHeight = 160;
  const paddingLeft = 34;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 26;

  const { bodyUnit, setUnits } = useUnitStore();

  const [overview, setOverview] = useState<ProgressOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLogModalVisible, setIsLogModalVisible] = useState<boolean>(false);
  const [selectedDateForLog, setSelectedDateForLog] = useState<string | undefined>(undefined);
  const [isGoalModalVisible, setIsGoalModalVisible] = useState<boolean>(false);

  const fetchOverview = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      const data = await progressApi.getOverview(30);
      setOverview(data);
    } catch (e) {
      console.error('Failed to load weight progress:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleLogSubmit = async (weightKg: number, note?: string, loggedDate?: string) => {
    await progressApi.logWeight({ weightKg, note, loggedDate });
    await fetchOverview(true);
  };

  const weight = overview?.weight;
  const bmi = overview?.bmi;
  const rawHistory = weight?.history || [];
  // For chart: chronological left-to-right
  const chartHistory = [...rawHistory].reverse();
  // For history list: newest first
  const listHistory = rawHistory;

  const currentKg = weight?.currentKg || 0;
  const targetKg = weight?.targetKg || 0;
  const startKg = weight?.startKg || (rawHistory[rawHistory.length - 1]?.weightKg) || currentKg;

  // Goal & Progress math
  const isGainGoal = targetKg > 0 && startKg > 0 ? targetKg > startKg : false;

  // Semantic diff status: green for goal-aligned, red for opposing goal
  const getWeightDiffStatus = (diffKg: number) => {
    if (diffKg === 0) {
      return { isGood: true, color: '#64748B', bgColor: '#F1F5F9' };
    }
    const isGood = isGainGoal ? diffKg > 0 : diffKg < 0;
    return {
      isGood,
      color: isGood ? '#16A34A' : '#EF4444',
      bgColor: isGood ? '#DCFCE7' : '#FEE2E2',
    };
  };

  const formatLogDate = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      const now = new Date();
      const todayYear = now.getFullYear();
      const todayMonth = now.getMonth();
      const todayDay = now.getDate();

      if (year === todayYear && month === todayMonth && day === todayDay) {
        return 'Today';
      }

      const yesterday = new Date(todayYear, todayMonth, todayDay - 1);
      if (
        year === yesterday.getFullYear() &&
        month === yesterday.getMonth() &&
        day === yesterday.getDate()
      ) {
        return 'Yesterday';
      }

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      return `${monthNames[month]} ${day}`;
    }
    return dateStr;
  };

  // Change vs previous measurement
  const prevLog = rawHistory.length > 1 ? rawHistory[1] : null;
  const changeVsPrev = prevLog ? Math.round((currentKg - prevLog.weightKg) * 10) / 10 : 0;
  const prevDateLabel = prevLog ? formatLogDate(prevLog.date) : 'start';
  let progressPercent = 0;
  let gainedOrLost = 0;
  let remainingKg = 0;

  if (targetKg > 0 && startKg > 0) {
    if (isGainGoal) {
      const totalNeeded = Math.max(0.1, targetKg - startKg);
      gainedOrLost = Math.max(0, currentKg - startKg);
      progressPercent = Math.max(0, Math.min(100, Math.round((gainedOrLost / totalNeeded) * 100)));
      remainingKg = Math.max(0, targetKg - currentKg);
    } else {
      const totalNeeded = Math.max(0.1, startKg - targetKg);
      gainedOrLost = Math.max(0, startKg - currentKg);
      progressPercent = Math.max(0, Math.min(100, Math.round((gainedOrLost / totalNeeded) * 100)));
      remainingKg = Math.max(0, currentKg - targetKg);
    }
  }

  // Estimated completion date (assuming 0.5kg pace per week)
  const estimatedWeeks = remainingKg > 0 ? Math.ceil(remainingKg / 0.5) : 0;
  const estimatedDate = new Date(Date.now() + estimatedWeeks * 7 * 86400000);
  const estimatedDateLabel =
    remainingKg <= 0
      ? 'Goal Reached!'
      : estimatedDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });

  // Chart Y-Scale calculations
  const allValues = [
    targetKg > 0 ? targetKg : currentKg,
    ...chartHistory.map((h) => h.weightKg),
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

  const tickCount = 4;
  const ticks = Array.from({ length: tickCount }).map((_, i) => {
    const val = Math.round(minY + (yRange / (tickCount - 1)) * i);
    return { val, y: getYCoord(val) };
  });

  const targetY = targetKg > 0 ? getYCoord(targetKg) : null;

  const points = chartHistory.map((item: WeightDataPoint, index: number) => {
    const x = getXCoord(index, chartHistory.length);
    const y = getYCoord(item.weightKg);
    return { x, y, ...item };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  const areaPolygonPoints =
    points.length > 0
      ? `${points[0].x},${chartHeight - paddingBottom} ` +
        points.map((p) => `${p.x},${p.y}`).join(' ') +
        ` ${points[points.length - 1].x},${chartHeight - paddingBottom}`
      : '';

  // BMI pointer calculation
  const clampedBmi = bmi ? Math.max(14, Math.min(40, bmi.value)) : 22;
  const bmiPointerPercent = ((clampedBmi - 14) / (40 - 14)) * 100;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F2E7" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => router.navigate('/(main)/progress')}
        >
          <ChevronLeft size={22} color="#131313" strokeWidth={2.5} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Weight</Text>

        <View style={{ width: 38 }} />
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.colors.saffron} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchOverview(true)}
              tintColor={theme.colors.saffron}
            />
          }
        >
          {/* Card 1: Today Card with Unit Switch and + Update Action Button */}
          <View style={styles.card}>
            <View style={styles.todayTopRow}>
              <Text style={styles.todayTitle}>Today</Text>

              {/* Unit Toggle Pill (lbs / kg) */}
              <View style={styles.unitToggleWrap}>
                <TouchableOpacity
                  style={[
                    styles.unitToggleBtn,
                    bodyUnit === 'imperial' && styles.unitToggleBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setUnits({ bodyUnit: 'imperial' })}
                >
                  <Text
                    style={[
                      styles.unitToggleText,
                      bodyUnit === 'imperial' && styles.unitToggleTextActive,
                    ]}
                  >
                    lbs
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.unitToggleBtn,
                    bodyUnit === 'metric' && styles.unitToggleBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setUnits({ bodyUnit: 'metric' })}
                >
                  <Text
                    style={[
                      styles.unitToggleText,
                      bodyUnit === 'metric' && styles.unitToggleTextActive,
                    ]}
                  >
                    kg
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.calendarBtn}
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedDateForLog(new Date().toISOString().split('T')[0]);
                  setIsLogModalVisible(true);
                }}
              >
                <Calendar size={18} color="#131313" />
              </TouchableOpacity>
            </View>

            <View style={styles.todayBottomRow}>
              <View>
                <View style={styles.todayValueRow}>
                  <Text style={styles.todayWeightValue}>
                    {formatWeight(currentKg, bodyUnit).value}
                  </Text>
                  <Text style={styles.todayWeightUnit}>
                    {formatWeight(currentKg, bodyUnit).unit}
                  </Text>
                </View>

                {/* Pill badge showing change vs previous date */}
                {changeVsPrev !== 0 && (() => {
                  const status = getWeightDiffStatus(changeVsPrev);
                  return (
                    <View style={[styles.prevDiffPill, { backgroundColor: status.bgColor }]}>
                      <Text style={[styles.prevDiffText, { color: status.color }]}>
                        {changeVsPrev > 0 ? `+ ${changeVsPrev}` : `${changeVsPrev}`} kg vs {prevDateLabel}{' '}
                        {changeVsPrev > 0 ? '↗' : '↘'}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              {/* + Update Button right on Today Card */}
              <TouchableOpacity
                style={styles.updateBtn}
                activeOpacity={0.85}
                onPress={() => setIsLogModalVisible(true)}
              >
                <Text style={styles.updateBtnText}>+ Update</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 2: Goal & Progress Card */}
          <View style={styles.card}>
            <View style={styles.goalWeightsRow}>
              {/* Start Weight */}
              <View style={styles.goalWeightCol}>
                <Text style={styles.goalColLabel}>Start Weight</Text>
                <TouchableOpacity
                  style={styles.goalValWithPencil}
                  activeOpacity={0.7}
                  onPress={() => setIsGoalModalVisible(true)}
                >
                  <Text style={styles.goalWeightNum}>
                    {formatWeight(startKg, bodyUnit).value}
                  </Text>
                  <Text style={styles.goalWeightUnit}>
                    {formatWeight(startKg, bodyUnit).unit}
                  </Text>
                  <Pencil size={13} color="#8E9388" />
                </TouchableOpacity>
              </View>

              <ArrowRight size={18} color="#8E9388" />

              {/* Goal Weight */}
              <View style={[styles.goalWeightCol, { alignItems: 'flex-end' }]}>
                <Text style={styles.goalColLabel}>Goal Weight</Text>
                <TouchableOpacity
                  style={styles.goalValWithPencil}
                  activeOpacity={0.7}
                  onPress={() => setIsGoalModalVisible(true)}
                >
                  <Text style={styles.goalWeightNum}>
                    {formatWeight(targetKg, bodyUnit).value}
                  </Text>
                  <Text style={styles.goalWeightUnit}>
                    {formatWeight(targetKg, bodyUnit).unit}
                  </Text>
                  <Pencil size={13} color="#8E9388" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Progress Percentage & Estimated Target Date Pill */}
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressPercentText}>
                Progress: {progressPercent}%
              </Text>
              <View style={styles.targetDatePill}>
                <Flag size={12} color="#60A5FA" />
                <Text style={styles.targetDateText}>{estimatedDateLabel}</Text>
              </View>
            </View>

            {/* Progress Bar with Pointer */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.max(4, progressPercent))}%` },
                ]}
              >
                <View style={styles.progressPointerDot} />
              </View>
            </View>

            {/* Gained/Lost & Remaining */}
            <View style={styles.progressBottomRow}>
              <Text style={styles.progressSubLabel}>
                {isGainGoal ? 'Gained' : 'Lost'}:{' '}
                <Text style={styles.progressSubValue}>
                  {gainedOrLost.toFixed(1)} kg
                </Text>
              </Text>
              <Text style={styles.progressSubLabel}>
                Remaining:{' '}
                <Text style={styles.progressSubValue}>
                  {remainingKg.toFixed(1)} kg
                </Text>
              </Text>
            </View>
          </View>

          {/* Card 3: Current BMI Card */}
          {bmi && (
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>Current BMI</Text>
              <View style={styles.bmiValueRow}>
                <Text style={styles.bmiValueNum}>{bmi.value}</Text>
                <Text style={styles.bmiCategoryText}>{bmi.category}</Text>
              </View>

              {/* Segmented Color Track */}
              <View style={styles.gaugeContainer}>
                <View style={styles.gaugeTrack}>
                  <View style={[styles.segment, { flex: 2, backgroundColor: '#60A5FA' }]} />
                  <View style={[styles.segment, { flex: 2.5, backgroundColor: '#38BDF8' }]} />
                  <View style={[styles.segment, { flex: 6.5, backgroundColor: '#8EDC5E' }]} />
                  <View style={[styles.segment, { flex: 5, backgroundColor: '#FBBF24' }]} />
                  <View style={[styles.segment, { flex: 5, backgroundColor: '#FB923C' }]} />
                  <View style={[styles.segment, { flex: 5, backgroundColor: '#F87171' }]} />
                </View>

                {/* Circular Pointer */}
                <View style={[styles.pointerWrap, { left: `${bmiPointerPercent}%` }]}>
                  <View style={styles.pointerOuter}>
                    <View style={styles.pointerInner} />
                  </View>
                </View>
              </View>

              {/* Scale Labels */}
              <View style={styles.scaleLabelsRow}>
                <Text style={styles.scaleText}>15</Text>
                <Text style={styles.scaleText}>16</Text>
                <Text style={styles.scaleText}>18.5</Text>
                <Text style={styles.scaleText}>25</Text>
                <Text style={styles.scaleText}>30</Text>
                <Text style={styles.scaleText}>35</Text>
                <Text style={styles.scaleText}>40</Text>
              </View>
            </View>
          )}

          {/* Card 4: Weight Chart Card */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Weight</Text>

            <View style={styles.chartStatRow}>
              <Text style={styles.chartWeightNum}>
                {formatWeight(currentKg, bodyUnit).value}
              </Text>
              <Text style={styles.chartWeightUnit}>
                {formatWeight(currentKg, bodyUnit).unit}
              </Text>

              {weight?.changeKg !== undefined && weight.changeKg !== 0 && (() => {
                const status = getWeightDiffStatus(weight.changeKg);
                return (
                  <View style={[styles.chartBadge, { backgroundColor: status.bgColor }]}>
                    <Text style={[styles.chartBadgeText, { color: status.color }]}>
                      {weight.changeKg > 0 ? '▲' : '▼'} {Math.abs(weight.changeKg)}
                    </Text>
                  </View>
                );
              })()}
            </View>

            {/* SVG Chart with Gradient Area Fill */}
            <View style={styles.svgWrapper}>
              <Svg width={chartWidth} height={chartHeight}>
                <Defs>
                  <LinearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={theme.colors.blue} stopOpacity="0.35" />
                    <Stop offset="100%" stopColor={theme.colors.blue} stopOpacity="0.0" />
                  </LinearGradient>
                </Defs>

                {/* Y Axis Grid Lines */}
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

                {/* Gradient area under polyline */}
                {points.length > 1 && areaPolygonPoints && (
                  <Polygon points={areaPolygonPoints} fill="url(#weightGrad)" />
                )}

                {/* Polyline */}
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

            <Text style={styles.chartFooterHint}>Swipe right for more</Text>
          </View>

          {/* Card 5: History Card at the bottom (Tap any item to edit/update) */}
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={[styles.cardSectionTitle, { marginBottom: 0 }]}>History</Text>
              <Text style={{ fontFamily: theme.fonts.medium, fontSize: 12, color: '#8E9388' }}>
                Tap row to edit
              </Text>
            </View>

            {listHistory.length === 0 ? (
              <Text style={styles.emptyHistoryText}>
                No weight logs yet. Tap "+ Update" on Today card to record your weight!
              </Text>
            ) : (
              <View style={styles.historyList}>
                {listHistory.map((item, idx) => {
                  const hasChange = item.changeKg !== undefined && item.changeKg !== 0;
                  const diff = item.changeKg || 0;
                  const status = getWeightDiffStatus(diff);

                  return (
                    <TouchableOpacity
                      key={item.id || idx}
                      style={styles.historyRow}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedDateForLog(item.date);
                        setIsLogModalVisible(true);
                      }}
                    >
                      <View style={styles.scaleIconWrap}>
                        <Scale size={20} color={theme.colors.blue} />
                      </View>

                      <View style={styles.historyInfoCol}>
                        <Text style={styles.historyDateText}>
                          {formatLogDate(item.date)}
                        </Text>
                        <View style={styles.historyWeightSubRow}>
                          <Text style={styles.historyWeightValue}>
                            {formatWeight(item.weightKg, bodyUnit).full}
                          </Text>
                          {hasChange && (
                            <View style={styles.historyDiffRow}>
                              <Text
                                style={[
                                  styles.historyDiffText,
                                  { color: status.color },
                                ]}
                              >
                                {diff > 0 ? `+${diff}` : `${diff}`} kg
                              </Text>
                              {diff > 0 ? (
                                <ArrowUpRight size={13} color={status.color} />
                              ) : (
                                <ArrowDownRight size={13} color={status.color} />
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Log/Update Weight Modal */}
      <LogWeightModal
        visible={isLogModalVisible}
        initialWeight={
          selectedDateForLog && listHistory.find((h) => h.date === selectedDateForLog)
            ? listHistory.find((h) => h.date === selectedDateForLog)!.weightKg
            : currentKg || 60
        }
        initialDate={selectedDateForLog}
        onClose={() => {
          setIsLogModalVisible(false);
          setSelectedDateForLog(undefined);
        }}
        onSubmit={handleLogSubmit}
      />

      {/* Edit Goals Modal */}
      <EditGoalsModal
        visible={isGoalModalVisible}
        onClose={() => setIsGoalModalVisible(false)}
        onSaved={() => fetchOverview(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F2E7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAE1',
  },
  headerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#131313',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
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
  cardSectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: '#131313',
    marginBottom: 8,
  },
  // ── Today Card Styles ──
  todayTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#131313',
  },
  unitToggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#F4F2E7',
    borderRadius: 12,
    padding: 2,
  },
  unitToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  unitToggleBtnActive: {
    backgroundColor: '#131313',
  },
  unitToggleText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
    color: '#8E9388',
  },
  unitToggleTextActive: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bold,
  },
  calendarBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#F4F2E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  todayWeightValue: {
    fontFamily: theme.fonts.extraBold,
    fontSize: 34,
    color: '#131313',
  },
  todayWeightUnit: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: '#8E9388',
  },
  prevDiffPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  prevDiffText: {
    fontFamily: theme.fonts.bold,
    fontSize: 11,
    color: '#EF4444',
  },
  updateBtn: {
    backgroundColor: '#4F75FF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#4F75FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  updateBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  // ── Goal & Progress Card Styles ──
  goalWeightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F6F5EE',
  },
  goalWeightCol: {
    gap: 2,
  },
  goalColLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#8E9388',
  },
  goalValWithPencil: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  goalWeightNum: {
    fontFamily: theme.fonts.extraBold,
    fontSize: 22,
    color: '#131313',
  },
  goalWeightUnit: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: '#8E9388',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressPercentText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#131313',
  },
  targetDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  targetDateText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 11,
    color: '#2563EB',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1EFE8',
    marginBottom: 10,
    position: 'relative',
    overflow: 'visible',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4F75FF',
    borderRadius: 4,
    position: 'relative',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  progressPointerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4F75FF',
    position: 'absolute',
    right: -4,
  },
  progressBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressSubLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#8E9388',
  },
  progressSubValue: {
    fontFamily: theme.fonts.bold,
    color: '#131313',
  },
  // ── BMI Card Styles ──
  bmiValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
  },
  bmiValueNum: {
    fontFamily: theme.fonts.extraBold,
    fontSize: 24,
    color: '#131313',
  },
  bmiCategoryText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.blue,
  },
  gaugeContainer: {
    position: 'relative',
    height: 18,
    justifyContent: 'center',
    marginBottom: 6,
  },
  gaugeTrack: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
  },
  pointerWrap: {
    position: 'absolute',
    marginLeft: -10,
    top: -1,
  },
  pointerOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: theme.colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  pointerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.blue,
  },
  scaleLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  scaleText: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: '#999E94',
  },
  // ── Chart Card Styles ──
  chartStatRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 10,
  },
  chartWeightNum: {
    fontFamily: theme.fonts.extraBold,
    fontSize: 28,
    color: '#131313',
  },
  chartWeightUnit: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: '#8E9388',
  },
  chartBadge: {
    backgroundColor: 'rgba(255, 145, 20, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 6,
  },
  chartBadgeText: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.saffron,
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartFooterHint: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: '#A6ABA1',
    textAlign: 'center',
    marginTop: 8,
  },
  // ── History Card Styles ──
  emptyHistoryText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: '#8E9388',
    textAlign: 'center',
    paddingVertical: 16,
  },
  historyList: {
    gap: 12,
    marginTop: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F7F2',
  },
  scaleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  historyInfoCol: {
    flex: 1,
  },
  historyDateText: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: '#8E9388',
    marginBottom: 2,
  },
  historyWeightSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyWeightValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: '#131313',
  },
  historyDiffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  historyDiffText: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
  },
});
