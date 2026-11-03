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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Pencil,
  X,
} from 'lucide-react-native';
import theme from '../../../src/constants/theme';
import { progressApi } from '../../../src/features/progress/api/progress.api';
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

        <Text style={styles.headerTitle}>Calorie Intake</Text>

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
              onRefresh={onRefresh}
              tintColor={theme.colors.saffron}
              colors={[theme.colors.saffron]}
            />
          }
        >
          {/* Card 1: Today Card with Expandable Calendar Inspector */}
          <View style={styles.card}>
            <View style={styles.todayTopRow}>
              <Text style={styles.todayTitle}>
                {formatHeaderDate(selectedDate)}
              </Text>

              <View style={styles.todayActionsRight}>
                {selectedDate !== todayStr && (
                  <TouchableOpacity
                    style={styles.resetTodayBtn}
                    activeOpacity={0.7}
                    onPress={() => setSelectedDate(todayStr)}
                  >
                    <Text style={styles.resetTodayText}>Today</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.calendarBtn,
                    isCalendarExpanded && styles.calendarBtnActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setIsCalendarExpanded(!isCalendarExpanded)}
                >
                  <CalendarIcon
                    size={18}
                    color={isCalendarExpanded ? '#FFFFFF' : '#131313'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Expandable Calendar Month Grid */}
            {isCalendarExpanded && (
              <View style={styles.calendarSection}>
                {/* Month Navigator Header */}
                <View style={styles.monthNavRow}>
                  <TouchableOpacity
                    onPress={handlePrevMonth}
                    style={styles.monthNavArrow}
                  >
                    <ChevronLeft size={18} color="#131313" />
                  </TouchableOpacity>

                  <Text style={styles.monthNavTitle}>{calendarMonthLabel}</Text>

                  <TouchableOpacity
                    onPress={handleNextMonth}
                    style={styles.monthNavArrow}
                  >
                    <ChevronRight size={18} color="#131313" />
                  </TouchableOpacity>
                </View>

                {/* Day of Week Labels */}
                <View style={styles.weekDaysRow}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                    (d, idx) => (
                      <Text key={idx} style={styles.weekDayLabel}>
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
                          isSelected && styles.dayCellSelected,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => setSelectedDate(item.dateStr)}
                      >
                        <Text
                          style={[
                            styles.dayNumText,
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
                              isSelected && styles.miniCalBadgeSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.miniCalText,
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
                <Text style={styles.calorieBigValue}>
                  {selectedDayCalories.toLocaleString()}
                </Text>
                <Text style={styles.calorieBigUnit}>kcal</Text>
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
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.max(4, Math.min(100, progressPercent))}%` },
                ]}
              />
            </View>
            <View style={styles.progressPercentRow}>
              <Text style={styles.progressPercentLabel}>
                {progressPercent}% of daily goal
              </Text>
              <Text style={styles.progressRemainingLabel}>
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
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Calories</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
                onPress={() => setIsEditModalVisible(false)}
              >
                <X size={18} color="#131313" />
              </TouchableOpacity>
            </View>

            {/* Input Row: Your Daily Intake [ 5000 ] kcal */}
            <View style={styles.inputContainerRow}>
              <Text style={styles.inputLabel}>Your Daily Intake</Text>
              <View style={styles.inputWithUnit}>
                <TextInput
                  style={styles.calorieInput}
                  value={goalInput}
                  onChangeText={setGoalInput}
                  keyboardType="numeric"
                  placeholder="2000"
                  placeholderTextColor="#A6ABA1"
                  maxLength={5}
                  selectTextOnFocus
                  autoFocus
                />
                <Text style={styles.inputUnitSuffix}>kcal</Text>
              </View>
            </View>

            {/* Done Button */}
            <TouchableOpacity
              style={styles.modalDoneBtn}
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
    borderRadius: 24,
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
