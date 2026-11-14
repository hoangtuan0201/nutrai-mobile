import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Pencil,
  X,
} from 'lucide-react-native';
import theme from '../../../src/constants/theme';
import { useAppTheme } from '../../../src/hooks/useAppTheme';
import { progressApi } from '../../../src/features/progress/api/progress.api';
import { PROFILE_QUERY_KEY } from '../../../src/features/profile/hooks/useProfile';
import {
  ProgressOverviewResponse,
  DailyMacroSummary,
} from '../../../src/features/progress/types';
import {
  CalorieIntakeCard,
  CalorieTimeframe,
} from '../../../src/features/progress/components/CalorieIntakeCard';

export default function CalorieIntakeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, isDark } = useAppTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overview, setOverview] = useState<ProgressOverviewResponse | null>(null);

  // Timeframe for the chart (Daily = 7 days, Weekly = 14 days, Monthly = 30 days)
  const [timeframe, setTimeframe] = useState<CalorieTimeframe>('Daily');

  // Today string in Vietnam timezone YYYY-MM-DD
  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // Edit Goal Modal state
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  // Fetch data (fetch full 30 days so Daily, Weekly, Monthly, and Calendar have complete data)
  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await progressApi.getOverview(30);
      setOverview(data);
    } catch (err: any) {
      console.error('Failed to load calorie intake progress:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
    }, [fetchData]),
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData(true);
  };

  const handleTimeframeChange = (tf: CalorieTimeframe) => {
    setTimeframe(tf);
  };

  // Target calories
  const targetCalories = overview?.calorieIntake.targetCalories || 2000;
  const history = overview?.calorieIntake.history || [];

  // Map of date -> DailyMacroSummary
  const historyByDate = useMemo(() => {
    const map = new Map<string, DailyMacroSummary>();
    for (const item of history) {
      map.set(item.date, item);
    }
    return map;
  }, [history]);

  // Selected Day summary
  const selectedDayLog = historyByDate.get(selectedDate);
  const selectedDayCalories = selectedDayLog ? selectedDayLog.calories : 0;
  const progressPercent = Math.min(
    100,
    Math.round((selectedDayCalories / Math.max(1, targetCalories)) * 100),
  );

  // Format date label for Today card
  const formatHeaderDate = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${monthNames[month]} ${day}`;
    }
    return dateStr;
  };

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth(); // 0-indexed

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      cals?: number;
    }> = [];

    // Empty lead cells
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        dateStr: `empty-${i}`,
        dayNum: 0,
        isCurrentMonth: false,
      });
    }

    // Days in current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayStr}`;
      const log = historyByDate.get(dateKey);

      days.push({
        dateStr: dateKey,
        dayNum: day,
        isCurrentMonth: true,
        cals: log ? log.calories : undefined,
      });
    }

    return days;
  }, [calendarMonth, historyByDate]);

  const handlePrevMonth = () => {
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
    );
  };

  const calendarMonthLabel = useMemo(() => {
    return calendarMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [calendarMonth]);

  // Open Edit Goal Modal
  const handleOpenEditGoal = () => {
    setGoalInput(String(targetCalories));
    setIsEditModalVisible(true);
  };

  // Save Goal
  const handleSaveGoal = async () => {
    const val = parseInt(goalInput.trim(), 10);
    if (isNaN(val) || val < 800 || val > 8000) {
      Alert.alert(
        'Invalid Calories',
        'Please enter a daily calorie intake target between 800 and 8,000 kcal.',
      );
      return;
    }

    try {
      setIsSavingGoal(true);
      await progressApi.updateCalorieTarget(val);
      // Invalidate profile query so Homepage & Settings immediately sync the new Calorie & Macro targets
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      setIsEditModalVisible(false);
      // Refresh overview
      await fetchData(true);
    } catch (err: any) {
      console.error('Failed to update calorie goal:', err);
      Alert.alert('Error', 'Could not update calorie goal. Please try again.');
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleBack = useCallback(() => {
    router.replace('/(main)/progress');
  }, [router]);

  // Handle Android hardware back
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBack])
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.7}
          onPress={handleBack}
        >
          <ChevronLeft size={22} color={colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Calorie Intake</Text>

        <View style={{ width: 38 }} />
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Card 1: Today Card with Expandable Calendar Inspector */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.todayTopRow}>
              <Text style={[styles.todayTitle, { color: colors.textPrimary }]}>
                {formatHeaderDate(selectedDate)}
              </Text>

              <View style={styles.todayActionsRight}>
                {selectedDate !== todayStr && (
                  <TouchableOpacity
                    style={[styles.resetTodayBtn, { backgroundColor: colors.inputBg }]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedDate(todayStr)}
                  >
                    <Text style={[styles.resetTodayText, { color: colors.textPrimary }]}>Today</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.calendarBtn,
                    { backgroundColor: colors.inputBg },
                    isCalendarExpanded && styles.calendarBtnActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setIsCalendarExpanded(!isCalendarExpanded)}
                >
                  <CalendarIcon
                    size={18}
                    color={isCalendarExpanded ? '#FFFFFF' : colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Expandable Calendar Month Grid */}
            {isCalendarExpanded && (
              <View style={[styles.calendarSection, { backgroundColor: isDark ? colors.surfaceMuted : '#FAF9F5', borderColor: colors.border }]}>
                {/* Month Navigator Header */}
                <View style={styles.monthNavRow}>
                  <TouchableOpacity
                    onPress={handlePrevMonth}
                    style={[styles.monthNavArrow, { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: colors.border }]}
                  >
                    <ChevronLeft size={18} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <Text style={[styles.monthNavTitle, { color: colors.textPrimary }]}>{calendarMonthLabel}</Text>

                  <TouchableOpacity
                    onPress={handleNextMonth}
                    style={[styles.monthNavArrow, { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: colors.border }]}
                  >
                    <ChevronRight size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Day of Week Labels */}
                <View style={styles.weekDaysRow}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                    (d, idx) => (
                      <Text key={idx} style={[styles.weekDayLabel, { color: colors.textSecondary }]}>
                        {d}
                      </Text>
                    ),
                  )}
                </View>

                {/* Days Grid */}
                <View style={styles.daysGrid}>
                  {calendarDays.map((item, idx) => {
                    if (!item.isCurrentMonth) {
                      return <View key={item.dateStr || idx} style={styles.emptyDayCell} />;
                    }

                    const isSelected = selectedDate === item.dateStr;
                    const hasCals = item.cals !== undefined && item.cals > 0;

                    return (
                      <TouchableOpacity
                        key={item.dateStr}
                        style={[
                          styles.dayCell,
                          { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: colors.border },
                          isSelected && styles.dayCellSelected,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => setSelectedDate(item.dateStr)}
                      >
                        <Text
                          style={[
                            styles.dayNumText,
                            { color: isSelected ? '#131313' : colors.textPrimary },
                            isSelected && styles.dayNumTextSelected,
                          ]}
                        >
                          {item.dayNum}
                        </Text>

                        {/* Logged calories mini badge */}
                        {hasCals && (
                          <View
                            style={[
                              styles.miniCalBadge,
                              { backgroundColor: isDark ? colors.surfaceMuted : '#E2E8F0' },
                              isSelected && styles.miniCalBadgeSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.miniCalText,
                                { color: isSelected ? '#FFFFFF' : (isDark ? colors.textPrimary : '#475569') },
                                isSelected && styles.miniCalTextSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {item.cals}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Today/Selected Day Calories & Goal Progress Row */}
            <View style={styles.calorieStatRow}>
              <View style={styles.calsLeftCol}>
                <Text style={[styles.calorieBigValue, { color: colors.textPrimary }]}>
                  {selectedDayCalories.toLocaleString()}
                </Text>
                <Text style={[styles.calorieBigUnit, { color: colors.textSecondary }]}>kcal</Text>
              </View>

              {/* Goal Button with Pencil */}
              <TouchableOpacity
                style={styles.goalButtonWithPencil}
                activeOpacity={0.7}
                onPress={handleOpenEditGoal}
              >
                <Text style={styles.goalButtonText}>
                  Goal <Text style={styles.goalValueHighlight}>{targetCalories}</Text> kcal
                </Text>
                <Pencil size={13} color="#3B82F6" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            {/* Blue Progress Bar Track */}
            <View style={[styles.progressBarTrack, { backgroundColor: colors.inputBg }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.max(4, Math.min(100, progressPercent))}%` },
                ]}
              />
            </View>
            <View style={styles.progressPercentRow}>
              <Text style={[styles.progressPercentLabel, { color: colors.textSecondary }]}>
                {progressPercent}% of daily goal
              </Text>
              <Text style={[styles.progressRemainingLabel, { color: colors.textSecondary }]}>
                {selectedDayCalories >= targetCalories
                  ? 'Goal Achieved!'
                  : `${(targetCalories - selectedDayCalories).toLocaleString()} kcal left`}
              </Text>
            </View>
          </View>

          {/* Card 2: Calorie Intake Chart Card */}
          {overview?.calorieIntake && (
            <CalorieIntakeCard
              calorieIntake={overview.calorieIntake}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              timeframe={timeframe}
              onTimeframeChange={handleTimeframeChange}
              onGoalPress={handleOpenEditGoal}
              hideHeaderGoal={true}
            />
          )}



          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Edit Daily Intake Modal ("Calories Modal" - Appediet Style) */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Calories</Text>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: colors.inputBg }]}
                activeOpacity={0.7}
                onPress={() => setIsEditModalVisible(false)}
              >
                <X size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Input Row: Your Daily Intake [ 5000 ] kcal */}
            <View style={[styles.inputContainerRow, { backgroundColor: isDark ? colors.surfaceMuted : '#FAF9F5', borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Your Daily Intake</Text>
              <View style={styles.inputWithUnit}>
                <TextInput
                  style={[styles.calorieInput, { color: colors.textPrimary }]}
                  value={goalInput}
                  onChangeText={setGoalInput}
                  keyboardType="numeric"
                  placeholder="2000"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={5}
                  selectTextOnFocus
                  autoFocus
                />
                <Text style={[styles.inputUnitSuffix, { color: colors.textSecondary }]}>kcal</Text>
              </View>
            </View>

            {/* Done Button */}
            <TouchableOpacity
              style={[styles.modalDoneBtn, { backgroundColor: colors.accent }]}
              activeOpacity={0.85}
              onPress={handleSaveGoal}
              disabled={isSavingGoal}
            >
              {isSavingGoal ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalDoneText}>Done</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    borderRadius: 14,
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
    fontSize: 15,
    color: '#131313',
  },
  todayTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    color: '#131313',
  },
  todayActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetTodayBtn: {
    backgroundColor: '#F4F2E7',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 12,
  },
  resetTodayText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#6B675A',
  },
  calendarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7F6F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarBtnActive: {
    backgroundColor: '#3B82F6',
  },
  calendarSection: {
    backgroundColor: '#FAF9F5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECEAE1',
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  monthNavArrow: {
    padding: 4,
  },
  monthNavTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#131313',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: '#8E9388',
    width: 38,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDayCell: {
    width: `${100 / 7}%`,
    height: 42,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: '#FACC15',
  },
  dayNumText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#131313',
  },
  dayNumTextSelected: {
    fontFamily: theme.fonts.bold,
    color: '#131313',
  },
  miniCalBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    paddingHorizontal: 2,
    marginTop: 1,
  },
  miniCalBadgeSelected: {
    backgroundColor: '#1E293B',
  },
  miniCalText: {
    fontFamily: theme.fonts.bold,
    fontSize: 8.5,
    color: '#475569',
  },
  miniCalTextSelected: {
    color: '#FFFFFF',
  },
  calorieStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  calsLeftCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  calorieBigValue: {
    fontFamily: theme.fonts.extraBold,
    fontSize: 28,
    color: '#131313',
  },
  calorieBigUnit: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#8E9388',
  },
  goalButtonWithPencil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  goalButtonText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12.5,
    color: '#1E40AF',
  },
  goalValueHighlight: {
    fontFamily: theme.fonts.bold,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F1EFE8',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressPercentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPercentLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 11,
    color: '#3B82F6',
  },
  progressRemainingLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: '#8E9388',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#131313',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F2E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#ECEAE1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: '#131313',
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calorieInput: {
    fontFamily: theme.fonts.extraBold,
    fontSize: 18,
    color: '#131313',
    minWidth: 60,
    textAlign: 'right',
    padding: 0,
  },
  inputUnitSuffix: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#8E9388',
  },
  modalDoneBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneText: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
