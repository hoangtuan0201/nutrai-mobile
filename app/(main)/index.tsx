import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import {
  Bell,
  Flame,
  Pencil,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Leaf,
  Plus,
} from 'lucide-react-native';
import theme from '../../src/constants/theme';
import { Logo } from '../../src/components';
import { useAuthStore } from '../../src/store/authStore';
import { useProfile } from '../../src/features/profile/hooks/useProfile';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import {
  calculateClientNutritionPlan,
  FitnessGoalType,
  GenderType,
  ActivityLevelType,
} from '../../src/utils/nutritionCalculator';
import { mealsApi } from '../../src/features/meals/api/meals.api';
import { Meal, DailyNutritionSummary } from '../../src/features/meals/types';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile } = useProfile();
  const onboarding = useOnboardingStore();

  // Vietnam local today
  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Dynamic 7 days of the current week based on Asia/Ho_Chi_Minh
  const weekDays = useMemo(() => {
    const [y, m, d] = todayStr.split('-').map(Number);
    const localDate = new Date(Date.UTC(y, m - 1, d));
    const dayOfWeek = localDate.getUTCDay(); // 0: Sun, 1: Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const result: Array<{
      dayName: string;
      dayNumber: number;
      fullDate: string;
      isToday: boolean;
    }> = [];
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    for (let i = 0; i < 7; i++) {
      const iter = new Date(localDate);
      iter.setUTCDate(localDate.getUTCDate() + mondayOffset + i);
      const iso = iter.toISOString().split('T')[0];
      result.push({
        dayName: dayNames[i],
        dayNumber: iter.getUTCDate(),
        fullDate: iso,
        isToday: iso === todayStr,
      });
    }
    return result;
  }, [todayStr]);

  // Compute Greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // User details
  const userName = user?.name ? user.name.split(' ')[0] : 'Tuan';
  const userWeight = profile?.weightKg || onboarding.weightKg || 60;
  const userHeight = profile?.heightCm || onboarding.heightCm || 174;
  const userGender = (profile?.gender || onboarding.gender || 'MALE') as GenderType;
  const userAge = onboarding.age || 21;
  const userActivity = (profile?.activityLevel || onboarding.activityLevel || 'MODERATE') as ActivityLevelType;
  const userFitnessGoal = profile?.fitnessGoal ||
    (onboarding.fitnessGoal === 'LOSE_WEIGHT' ? 'WEIGHT_LOSS' : onboarding.fitnessGoal === 'BUILD_MUSCLE' ? 'MUSCLE_GAIN' : 'MAINTENANCE');

  const mappedCalcGoal: FitnessGoalType =
    userFitnessGoal === 'WEIGHT_LOSS'
      ? 'LOSE_WEIGHT'
      : userFitnessGoal === 'MUSCLE_GAIN'
      ? 'BUILD_MUSCLE'
      : 'MAINTAIN_WEIGHT';

  // Scientific calculation engine (Protein = weight * 1.8, Fat = weight * 0.9, Carbs = remainder)
  const computedPlan = calculateClientNutritionPlan({
    gender: userGender,
    weightKg: userWeight,
    heightCm: userHeight,
    age: userAge,
    activityLevel: userActivity,
    fitnessGoal: mappedCalcGoal,
  });

  const targetCalories = profile?.activeTarget?.dailyCalories || computedPlan.calories || 2500;
  const targetProtein = profile?.activeTarget?.dailyProtein || computedPlan.protein || 120;
  const targetCarbs = profile?.activeTarget?.dailyCarbs || computedPlan.carbs || 290;
  const targetFat = profile?.activeTarget?.dailyFat || computedPlan.fat || 70;

  // Real meal &    tate from backend
  const [dailyData, setDailyData] = useState<{
    summary: DailyNutritionSummary;
    meals: Meal[];
  } | null>(null);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDateData = useCallback(async (targetDate: string) => {
    try {
      const res = await mealsApi.getDailyMeals(targetDate);
      setDailyData({
        summary: res.summary,
        meals: res.meals || [],
      });
    } catch (err: any) {
      console.warn('Failed to load meals for dashboard:', err?.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDateData(selectedDate);
    }, [fetchDateData, selectedDate])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDateData(selectedDate);
    setRefreshing(false);
  }, [fetchDateData, selectedDate]);

  const handleSelectDay = (targetDate: string) => {
    setSelectedDate(targetDate);
    fetchDateData(targetDate);
  };

  // Consumed nutrition totals from backend (falls back to 0 if none logged)
  const consumedCalories = dailyData?.summary ? Math.round(dailyData.summary.totalCalories) : 0;
  const remainingCalories = Math.max(0, targetCalories - consumedCalories);
  const consumedProtein = dailyData?.summary ? Math.round(dailyData.summary.totalProtein) : 0;
  const consumedCarbs = dailyData?.summary ? Math.round(dailyData.summary.totalCarbs) : 0;
  const consumedFat = dailyData?.summary ? Math.round(dailyData.summary.totalFat) : 0;

  // Progress ring math
  const ringSize = 96;
  const strokeWidth = 9;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(1, Math.max(0, consumedCalories / (targetCalories || 1)));
  const strokeDashoffset = circumference * (1 - progressRatio);

  const getMealThumbnail = (meal: Meal): string => {
    if (meal.items && meal.items[0]?.foodName) {
      const name = meal.items[0].foodName.toLowerCase();
      if (name.includes('burger')) {
        return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80';
      }
      if (name.includes('fry') || name.includes('fries')) {
        return 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=200&auto=format&fit=crop&q=80';
      }
      if (name.includes('salad')) {
        return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&auto=format&fit=crop&q=80';
      }
      if (name.includes('chicken')) {
        return 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=200&auto=format&fit=crop&q=80';
      }
      if (name.includes('rice')) {
        return 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=200&auto=format&fit=crop&q=80';
      }
      if (name.includes('smoothie') || name.includes('berry')) {
        return 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&auto=format&fit=crop&q=80';
      }
    }
    if (meal.mealType === 'BREAKFAST') {
      return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&auto=format&fit=crop&q=80';
    }
    if (meal.mealType === 'LUNCH') {
      return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80';
    }
    if (meal.mealType === 'DINNER') {
      return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=200&auto=format&fit=crop&q=80';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top Header Bar ───────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Logo variant="full" size="md" />
        </View>

        <View style={styles.headerRight}>
          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.bellBtn}
            activeOpacity={0.7}
            onPress={() => router.push('/settings')}
          >
            <Bell size={20} color="#1B281B" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>

          {/* User Profile Avatar -> Clicking navigates to /settings (Unified Profile & Settings) */}
          <TouchableOpacity
            style={styles.avatarBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/settings')}
          >
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              }}
              style={styles.avatarImg}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2E7D32"
          />
        }
      >
        {/* ── Greeting Section ─────────────────────────────────────── */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTime}>{getGreeting()}
            <Text style={styles.userNameText}> {userName}</Text>
          </Text>
        </View>

        {/* ── Date Selector (Dynamic Weekly strip) ──────────────────── */}
        <View style={styles.dateSelectorRow}>
          {weekDays.map((d) => {
            const isSelected = selectedDate === d.fullDate;
            return (
              <TouchableOpacity
                key={d.fullDate}
                activeOpacity={0.75}
                onPress={() => handleSelectDay(d.fullDate)}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellActive,
                ]}
              >
                <Text
                  style={[
                    styles.dayName,
                    isSelected && styles.dayNameActive,
                  ]}
                >
                  {d.dayName}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
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

        {/* ── Calorie Remaining Card ───────────────────────────────── */}
        <View style={styles.calorieCard}>
          <View style={styles.calorieMainRow}>
            {/* Left Progress Ring */}
            <View style={styles.ringContainer}>
              <Svg width={ringSize} height={ringSize}>
                {/* Track */}
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke="#F3EFE6"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Progress */}
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
              </Svg>

              <View style={styles.ringCenterContent}>
                <Flame size={20} color="#FF9114" style={{ marginBottom: 2 }} />
                <Text style={styles.ringValText}>
                  {consumedCalories.toLocaleString()}
                </Text>
                <Text style={styles.ringSubText}>kcal</Text>
              </View>
            </View>

            {/* Right Information */}
            <View style={styles.calorieInfoCol}>
              <View style={styles.timeframeRow}>
                <Text style={styles.calorieRemainingLabel}>Calories remaining</Text>
              </View>

              <View style={styles.bigCalorieRow}>
                <Text style={styles.bigCalorieNumber}>
                  {remainingCalories.toLocaleString()}
                </Text>
                <Text style={styles.bigCalorieUnit}>kcal</Text>
              </View>

              <TouchableOpacity
                style={styles.targetRow}
                activeOpacity={0.7}
                onPress={() => router.push('/settings')}
              >
                <Text style={styles.targetText}>
                  Target {targetCalories.toLocaleString()} kcal
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
                {consumedProtein} / {targetProtein} g
              </Text>
            </View>

            {/* Carbs */}
            <View style={styles.macroPillItem}>
              <View style={[styles.macroDot, { backgroundColor: '#7BC754' }]} />
              <Text style={styles.macroPillLabel}>Carbs</Text>
              <Text style={styles.macroPillValue}>
                {consumedCarbs} / {targetCarbs} g
              </Text>
            </View>

            {/* Fat */}
            <View style={styles.macroPillItem}>
              <View style={[styles.macroDot, { backgroundColor: '#F5A623' }]} />
              <Text style={styles.macroPillLabel}>Fat</Text>
              <Text style={styles.macroPillValue}>
                {consumedFat} / {targetFat} g
              </Text>
            </View>
          </View>
        </View>


        {/* ── AI Nutrition Assistant Banner ────────────────────────── */}
        <TouchableOpacity
          style={styles.aiBanner}
          activeOpacity={0.85}
          onPress={() => router.push('/ai')}
        >
          <View style={styles.aiSparkleWrap}>
            <Sparkles size={18} color="#2A382A" />
          </View>
          <View style={styles.aiTextCol}>
            <Text style={styles.aiTitle}>AI Nutrition Assistant</Text>
            <Text style={styles.aiSubtitle}>
              Get personalized advice, meal ideas and more.
            </Text>
          </View>
          <View style={styles.aiArrowBtn}>
            <ArrowRight size={16} color="#1B281B" />
          </View>
        </TouchableOpacity>

        {/* ── Recent Meals Section ─────────────────────────────────── */}
        {/* ── Recent Meals Section ─────────────────────────────────── */}
        <View style={styles.mealsHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Meals</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(main)/meals')}
            style={styles.seeAllBtn}
          >
            <Text style={styles.seeAllText}>See all</Text>
            <ChevronRight size={14} color="#686C63" />
          </TouchableOpacity>
        </View>

        {dailyData?.meals && dailyData.meals.length > 0 ? (
          dailyData.meals.slice(0, 3).map((meal) => {
            const timeStr = meal.loggedAt
              ? new Date(meal.loggedAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })
              : 'Today';

            const summaryTitle =
              meal.name ||
              (meal.items && meal.items.length > 0
                ? meal.items.map((i) => i.foodName).join(', ')
                : 'Logged Meal');

            return (
              <TouchableOpacity
                key={meal.id}
                style={styles.mealCard}
                activeOpacity={0.8}
                onPress={() => router.push('/(main)/meals')}
              >
                <Image
                  source={{
                    uri: getMealThumbnail(meal),
                  }}
                  style={styles.mealThumb}
                />
                <View style={styles.mealInfoCol}>
                  <Text style={styles.mealName} numberOfLines={1}>
                    {summaryTitle}
                  </Text>
                  <Text style={styles.mealMacros}>
                    {Math.round(meal.totalCalories)} kcal  •  P {Math.round(meal.totalProtein)}g  •  C {Math.round(meal.totalCarbs)}g  •  F {Math.round(meal.totalFat)}g
                  </Text>
                  <Text style={styles.mealTime}>{timeStr}</Text>
                </View>
                <ChevronRight size={18} color="#A6ABA1" />
              </TouchableOpacity>
            );
          })
        ) : (
          <TouchableOpacity
            style={styles.emptyMealsCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: '/(main)/meals/add',
                params: { from: 'home', date: selectedDate },
              })
            }
          >
            <View style={styles.emptyMealsLeft}>
              <Text style={styles.emptyMealsTitle}>No meals logged today</Text>
              <Text style={styles.emptyMealsSub}>
                Tap to scan food or search USDA database
              </Text>
            </View>
            <View style={styles.emptyMealsAddBtn}>
              <Text style={styles.emptyMealsAddText}>+ Log Meal</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F5EE', // Warm oat beige matching CaloriQ design
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(27, 40, 27, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF9114',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#DFDCD0',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  // ── Greeting
  greetingSection: {
    marginBottom: 16,
  },
  greetingTime: {
    fontSize: 16,
    color: '#656A60',
    fontWeight: '500',
  },

  userNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B281B',
    letterSpacing: -0.5,
  },
  leafIcon: {
    fontSize: 20,
  },
  greetingSub: {
    fontSize: 14,
    color: '#6E7369',
    marginTop: 4,
    fontWeight: '500',
  },
  // ── Date Selector
  dateSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 6,
  },
  dayCell: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  dayCellActive: {
    backgroundColor: '#131313',
    borderColor: '#131313',
    shadowOpacity: 0.12,
    elevation: 3,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#285880', // Soft blue text matching Image 1
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  dayNameActive: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1B281B',
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
  // ── Calorie Card
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B281B',
    letterSpacing: -0.3,
  },
  // ── AI Banner
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAE7DD',
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DFDBD0',
  },
  aiSparkleWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiTextCol: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1B281B',
    marginBottom: 1,
  },
  aiSubtitle: {
    fontSize: 11,
    color: '#656A60',
    fontWeight: '500',
  },
  aiArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCD8CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Recent Meals
  mealsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#656A60',
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFECE2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  mealThumb: {
    width: 54,
    height: 54,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: '#EFECE2',
  },
  mealInfoCol: {
    flex: 1,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B281B',
    marginBottom: 3,
  },
  mealMacros: {
    fontSize: 11,
    color: '#656A60',
    fontWeight: '500',
    marginBottom: 2,
  },
  mealTime: {
    fontSize: 10,
    color: '#8A8F85',
    fontWeight: '500',
  },
  emptyMealsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFECE2',
    borderStyle: 'dashed',
  },
  emptyMealsLeft: {
    flex: 1,
    marginRight: 12,
  },
  emptyMealsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B281B',
    marginBottom: 4,
  },
  emptyMealsSub: {
    fontSize: 12,
    color: '#656A60',
    fontWeight: '500',
  },
  emptyMealsAddBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  emptyMealsAddText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
