import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

export interface WeeklyCalendarStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export const WeeklyCalendarStrip: React.FC<WeeklyCalendarStripProps> = React.memo(({
  selectedDate,
  onSelectDate,
  containerStyle,
}) => {
  const { colors, isDark } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Math.max(280, windowWidth - 40);
  const weekScrollRef = useRef<ScrollView>(null);
  const hasInitialScrolled = useRef(false);

  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }, []);

  const PAST_WEEKS = 16;
  const FUTURE_WEEKS = 1;
  const currentWeekIndex = PAST_WEEKS;
  const [visibleWeekIndex, setVisibleWeekIndex] = useState<number>(currentWeekIndex);

  // Dynamic multi-week list supporting swipe to older days (16 weeks past, 1 week future)
  const weeks = useMemo(() => {
    const [y, m, d] = todayStr.split('-').map(Number);
    const localDate = new Date(Date.UTC(y, m - 1, d));
    const dayOfWeek = localDate.getUTCDay(); // 0: Sun, 1: Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const shortMonths = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const result: Array<{
      weekIndex: number;
      monthLabel: string;
      days: Array<{
        dayName: string;
        dayNumber: number;
        fullDate: string;
        isToday: boolean;
      }>;
    }> = [];

    for (let offset = -PAST_WEEKS; offset <= FUTURE_WEEKS; offset++) {
      const days: Array<{
        dayName: string;
        dayNumber: number;
        fullDate: string;
        isToday: boolean;
      }> = [];

      for (let i = 0; i < 7; i++) {
        const iter = new Date(localDate);
        iter.setUTCDate(localDate.getUTCDate() + mondayOffset + offset * 7 + i);
        const iso = iter.toISOString().split('T')[0];
        days.push({
          dayName: dayNames[i],
          dayNumber: iter.getUTCDate(),
          fullDate: iso,
          isToday: iso === todayStr,
        });
      }

      // Compute month label for this week
      const firstDayDate = new Date(days[0].fullDate + 'T00:00:00Z');
      const lastDayDate = new Date(days[6].fullDate + 'T00:00:00Z');
      const m1 = firstDayDate.getUTCMonth();
      const y1 = firstDayDate.getUTCFullYear();
      const m2 = lastDayDate.getUTCMonth();
      const y2 = lastDayDate.getUTCFullYear();

      let monthLabel = '';
      if (m1 === m2 && y1 === y2) {
        monthLabel = `${monthNames[m1]} ${y1}`;
      } else if (y1 === y2) {
        monthLabel = `${shortMonths[m1]} – ${shortMonths[m2]} ${y1}`;
      } else {
        monthLabel = `${shortMonths[m1]} ${y1} – ${shortMonths[m2]} ${y2}`;
      }

      result.push({
        weekIndex: offset,
        monthLabel,
        days,
      });
    }

    return result;
  }, [todayStr]);

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / containerWidth);
      if (index >= 0 && index < weeks.length) {
        setVisibleWeekIndex(index);
      }
    },
    [containerWidth, weeks.length]
  );

  const handleWeekScrollLayout = useCallback(() => {
    if (!hasInitialScrolled.current && weekScrollRef.current) {
      hasInitialScrolled.current = true;
      const targetIdx = weeks.findIndex((w) =>
        w.days.some((d) => d.fullDate === selectedDate)
      );
      const initialIdx = targetIdx !== -1 ? targetIdx : currentWeekIndex;
      weekScrollRef.current.scrollTo({
        x: initialIdx * containerWidth,
        animated: false,
      });
      setVisibleWeekIndex(initialIdx);
    }
  }, [currentWeekIndex, containerWidth, selectedDate, weeks]);

  const handleJumpToToday = useCallback(() => {
    onSelectDate(todayStr);
    weekScrollRef.current?.scrollTo({
      x: currentWeekIndex * containerWidth,
      animated: true,
    });
    setVisibleWeekIndex(currentWeekIndex);
  }, [onSelectDate, todayStr, currentWeekIndex, containerWidth]);

  const prevSelectedDateRef = useRef(selectedDate);

  // Sync scroll position ONLY when selectedDate is updated from outside or user tapped a date
  // Do NOT listen to visibleWeekIndex, so user can freely swipe between weeks without snapping back
  useEffect(() => {
    if (prevSelectedDateRef.current !== selectedDate) {
      prevSelectedDateRef.current = selectedDate;
      const targetWeekIdx = weeks.findIndex((w) =>
        w.days.some((d) => d.fullDate === selectedDate)
      );
      if (targetWeekIdx !== -1) {
        weekScrollRef.current?.scrollTo({
          x: targetWeekIdx * containerWidth,
          animated: true,
        });
        setVisibleWeekIndex(targetWeekIdx);
      }
    }
  }, [selectedDate, containerWidth, weeks]);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Header with Month Title & Today button */}
      <View style={styles.headerRow}>
        <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>
          {weeks[visibleWeekIndex]?.monthLabel || ''}
        </Text>
        {(visibleWeekIndex !== currentWeekIndex || selectedDate !== todayStr) && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleJumpToToday}
            style={[styles.todayPillBtn, { backgroundColor: colors.surfaceMuted }]}
          >
            <RotateCcw size={11} color={colors.accent} strokeWidth={2.5} />
            <Text style={[styles.todayPillText, { color: colors.accent }]}>Today</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Swipeable Weekly Strip (Native Paging) */}
      <ScrollView
        ref={weekScrollRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        bounces={false}
        contentOffset={{ x: currentWeekIndex * containerWidth, y: 0 }}
        onLayout={handleWeekScrollLayout}
        onMomentumScrollEnd={handleScrollEnd}
        style={{ width: containerWidth }}
      >
        {weeks.map((w, wIdx) => (
          <View
            key={`week_${wIdx}`}
            style={[styles.weekRow, { width: containerWidth }]}
          >
            {w.days.map((d) => {
              const isSelected = selectedDate === d.fullDate;
              return (
                <TouchableOpacity
                  key={d.fullDate}
                  activeOpacity={0.75}
                  onPress={() => onSelectDate(d.fullDate)}
                  style={[
                    styles.dayCell,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isSelected && [
                      styles.dayCellActive,
                      {
                        backgroundColor: isDark ? colors.accent : '#131313',
                        borderColor: isDark ? colors.accent : '#131313',
                      },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.dayName,
                      { color: isDark ? colors.textMuted : '#285880' },
                      isSelected && styles.dayNameActive,
                    ]}
                  >
                    {d.dayName}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: colors.textPrimary },
                      isSelected && styles.dayNumberActive,
                    ]}
                  >
                    {d.dayNumber}
                  </Text>
                  {d.isToday && !isSelected && (
                    <View style={styles.todayIndicatorDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  monthLabel: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    letterSpacing: -0.2,
  },
  todayPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayPillText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayCell: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  dayCellActive: {
    shadowOpacity: 0.12,
    elevation: 3,
  },
  dayName: {
    fontSize: 10,
    fontFamily: 'Manrope_700Bold',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  dayNameActive: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontSize: 17,
    fontFamily: 'Manrope_800ExtraBold',
  },
  dayNumberActive: {
    color: '#FFFFFF',
  },
  todayIndicatorDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF9114',
  },
});
