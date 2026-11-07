import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  Plus,
  Trash2,
  Utensils,
  Camera,
  Search,
  MoreHorizontal,
} from 'lucide-react-native';
import { theme } from '../../../src/constants';
import { CalorieRemainingCard, WeeklyCalendarStrip } from '../../../src/components';
import { mealsApi } from '../../../src/features/meals/api/meals.api';
import { Meal, MealType, DailyMealsResponse } from '../../../src/features/meals/types';
import { useUnitStore, formatFoodWeight } from '../../../src/store/unitStore';
import { useProfile } from '../../../src/features/profile/hooks/useProfile';
import { useOnboardingStore } from '../../../src/store/onboardingStore';
import {
  calculateClientNutritionPlan,
  FitnessGoalType,
  GenderType,
  ActivityLevelType,
} from '../../../src/utils/nutritionCalculator';

// ── Custom Filled Meal Icons in App Saffron Orange (Matching Reference Image 2) ──
const MealSectionIcon: React.FC<{ type: MealType; color?: string }> = ({
  type,
  color = theme.colors.saffron,
}) => {
  switch (type) {
    case 'BREAKFAST':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M8.5 3.5V5.5M12.5 3V5.5"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Path
            d="M4.5 7.5H16.5V12C16.5 15.0376 14.0376 17.5 11 17.5H10C6.96243 17.5 4.5 15.0376 4.5 12V7.5Z"
            fill={color}
          />
          <Path
            d="M16.5 8.5H18C19.3807 8.5 20.5 9.61929 20.5 11C20.5 12.3807 19.3807 13.5 18 13.5H16.5"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          <Path
            d="M3.5 19.5H17.5"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'LUNCH':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 3.5V6M12 3V6M15 3.5V6"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Path
            d="M3.5 9H20.5"
            stroke={color}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          <Path
            d="M5.5 9H18.5V14.5C18.5 17.2614 16.2614 19.5 13.5 19.5H10.5C7.73858 19.5 5.5 17.2614 5.5 14.5V9Z"
            fill={color}
          />
        </Svg>
      );
    case 'DINNER':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={6} r={1.8} fill={color} />
          <Path
            d="M4.5 16C4.5 11.8579 7.85786 8.5 12 8.5C16.1421 8.5 19.5 11.8579 19.5 16H4.5Z"
            fill={color}
          />
          <Path
            d="M8.5 13.5C9.2 12 10.5 11.2 12 11"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <Path
            d="M3 18.5H21"
            stroke={color}
            strokeWidth={2.3}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'SNACK':
    default:
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M17.5 4.5C18.3 5.3 18.5 6.5 18 7.6C16.5 11.8 12.8 15.5 8.2 17C6.2 17.6 4.2 17.3 3 16.2C2.6 15.8 2.8 15.1 3.4 15C7.2 14.2 10.6 11.8 12.6 8.2C13.3 6.9 14.1 5.2 15.3 4.3C16 3.8 16.9 3.9 17.5 4.5Z"
            fill={color}
          />
          <Path
            d="M18.2 7.2C19.8 10.4 18.8 14.8 15.5 17.6C12.5 20.1 8.2 20.5 5 18.8C8.8 19 12.8 17.2 15.2 13.8C16.8 11.6 17.8 9.4 18.2 7.2Z"
            fill={color}
            fillOpacity={0.75}
          />
        </Svg>
      );
  }
};

// ── Animated Number Counter for Meal Section Headers ─────────────────────────
const AnimatedCalorieNumber: React.FC<{
  value: number;
  dateKey: string;
  focusKey: number;
}> = React.memo(({ value, dateKey, focusKey }) => {
  const targetVal = Math.max(0, Math.round(value));
  const [displayed, setDisplayed] = useState(0);
  const prevTriggerRef = useRef(`${dateKey}-${focusKey}`);
  const currentRef = useRef(0);

  useEffect(() => {
    const nextTrigger = `${dateKey}-${focusKey}`;
    const isTriggerChanged = prevTriggerRef.current !== nextTrigger;
    prevTriggerRef.current = nextTrigger;

    const startVal = isTriggerChanged ? 0 : currentRef.current;
    if (targetVal === 0 && startVal === 0) {
      setDisplayed(0);
      currentRef.current = 0;
      return;
    }

    let startTime: number | null = null;
    let animId: number;
    const duration = 550;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min(1, (timestamp - startTime) / duration);
      const eased = easeOutCubic(progress);
      const next = Math.round(startVal + (targetVal - startVal) * eased);

      if (next !== currentRef.current || progress === 1) {
        currentRef.current = next;
        setDisplayed(next);
      }

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [targetVal, dateKey, focusKey]);

  return <Text style={styles.sectionCalConsumed}>{displayed}</Text>;
});

const MEAL_SECTIONS: Array<{
  type: MealType;
  label: string;
  recommendedRatio: number;
}> = [
  {
    type: 'BREAKFAST',
    label: 'Breakfast',
    recommendedRatio: 0.25,
  },
  {
    type: 'LUNCH',
    label: 'Lunch',
    recommendedRatio: 0.35,
  },
  {
    type: 'DINNER',
    label: 'Dinner',
    recommendedRatio: 0.3,
  },
  {
    type: 'SNACK',
    label: 'Snacks',
    recommendedRatio: 0.1,
  },
];

export default function MealsListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const { profile } = useProfile();
  const onboarding = useOnboardingStore();
  const { energyUnit, foodUnit } = useUnitStore();

  // Selected date in YYYY-MM-DD format
  const [selectedDate, setSelectedDate] = useState(() => {
    return (
      params.date ||
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date())
    );
  });

  // Incremented every time the user navigates to this screen to replay the bar/counter sweep
  const [focusKey, setFocusKey] = useState(0);

  // Compute personalized nutrition targets matching Homepage
  const userWeight = profile?.weightKg || onboarding.weightKg || 60;
  const userHeight = profile?.heightCm || onboarding.heightCm || 174;
  const userGender = (profile?.gender || onboarding.gender || 'MALE') as GenderType;
  const userAge = useMemo(() => {
    if (profile?.dateOfBirth) {
      const dob = new Date(profile.dateOfBirth);
      if (!isNaN(dob.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        if (age > 0) return age;
      }
    }
    return onboarding.age || 21;
  }, [profile?.dateOfBirth, onboarding.age]);

  const userActivity = (profile?.activityLevel ||
    onboarding.activityLevel ||
    'MODERATE') as ActivityLevelType;
  const userFitnessGoal =
    profile?.fitnessGoal ||
    (onboarding.fitnessGoal === 'LOSE_WEIGHT'
      ? 'WEIGHT_LOSS'
      : onboarding.fitnessGoal === 'BUILD_MUSCLE'
      ? 'MUSCLE_GAIN'
      : 'MAINTENANCE');

  const mappedCalcGoal: FitnessGoalType =
    userFitnessGoal === 'WEIGHT_LOSS'
      ? 'LOSE_WEIGHT'
      : userFitnessGoal === 'MUSCLE_GAIN'
      ? 'BUILD_MUSCLE'
      : 'MAINTAIN_WEIGHT';

  const computedPlan = useMemo(
    () =>
      calculateClientNutritionPlan({
        gender: userGender,
        weightKg: userWeight,
        heightCm: userHeight,
        age: userAge,
        activityLevel: userActivity,
        fitnessGoal: mappedCalcGoal,
      }),
    [userGender, userWeight, userHeight, userAge, userActivity, mappedCalcGoal],
  );

  const targetCalories = profile?.activeTarget?.dailyCalories || computedPlan.calories || 2500;
  const targetProtein = profile?.activeTarget?.dailyProtein || computedPlan.protein || 120;
  const targetCarbs = profile?.activeTarget?.dailyCarbs || computedPlan.carbs || 290;
  const targetFat = profile?.activeTarget?.dailyFat || computedPlan.fat || 70;

  // Client-side cache by date for instant calendar switching
  const mealsCacheRef = useRef<Record<string, DailyMealsResponse>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DailyMealsResponse | null>(null);

  // Sync selectedDate if route param changes
  useEffect(() => {
    if (params.date && params.date !== selectedDate) {
      setSelectedDate(params.date);
    }
  }, [params.date]);

  const fetchMeals = useCallback(async (targetDate: string) => {
    const cached = mealsCacheRef.current[targetDate];
    if (cached) {
      setData(cached);
      setLoading(false);
    }
    try {
      const res = await mealsApi.getDailyMeals(targetDate);
      const isUnchanged =
        cached &&
        cached.summary?.totalCalories === res.summary?.totalCalories &&
        cached.summary?.totalProtein === res.summary?.totalProtein &&
        cached.summary?.totalCarbs === res.summary?.totalCarbs &&
        cached.summary?.totalFat === res.summary?.totalFat &&
        (cached.meals?.length || 0) === (res.meals?.length || 0);

      mealsCacheRef.current[targetDate] = res;
      if (!isUnchanged) {
        setData(res);
      }
    } catch (error: any) {
      console.warn('Failed to load meals:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-reload data & trigger counter/bar animation whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setFocusKey((prev) => prev + 1);
      fetchMeals(selectedDate);
    }, [fetchMeals, selectedDate]),
  );

  const handleSelectDate = useCallback(
    (nextDate: string) => {
      setSelectedDate(nextDate);
      if (mealsCacheRef.current[nextDate]) {
        setData(mealsCacheRef.current[nextDate]);
      } else {
        setData(null);
      }
      fetchMeals(nextDate);
    },
    [fetchMeals],
  );

  const onRefresh = () => {
    setRefreshing(true);
    setFocusKey((prev) => prev + 1);
    fetchMeals(selectedDate);
  };

  // Deletion modal state
  const [mealToDelete, setMealToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteMeal = (mealId: string, mealName?: string) => {
    setMealToDelete({ id: mealId, name: mealName || 'this meal' });
  };

  const confirmDeleteMeal = async () => {
    if (!mealToDelete) return;
    setDeleting(true);
    try {
      await mealsApi.deleteMeal(mealToDelete.id);
      setMealToDelete(null);
      fetchMeals(selectedDate);
    } catch (err: any) {
      console.warn('Could not delete meal:', err?.message);
    } finally {
      setDeleting(false);
    }
  };

  const summary = data?.summary || {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    mealCount: 0,
  };

  const consumedCalories = Math.round(summary.totalCalories || 0);
  const consumedProtein = Math.round(summary.totalProtein || 0);
  const consumedCarbs = Math.round(summary.totalCarbs || 0);
  const consumedFat = Math.round(summary.totalFat || 0);

  const mealsByType: Record<MealType, Meal[]> = {
    BREAKFAST: [],
    LUNCH: [],
    DINNER: [],
    SNACK: [],
  };

  if (data?.meals) {
    data.meals.forEach((m) => {
      if (mealsByType[m.mealType]) {
        mealsByType[m.mealType].push(m);
      }
    });
  }

  const totalLoggedItems = data?.meals?.length || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* ── Top Editorial Header ──────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerBadgeRow}>
            <Text style={styles.headerSubtitle}>DAILY LOG</Text>
            {totalLoggedItems > 0 && (
              <View style={styles.loggedCountPill}>
                <Text style={styles.loggedCountText}>
                  {totalLoggedItems} {totalLoggedItems === 1 ? 'meal' : 'meals'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.headerTitle}>Nutrition Diary</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              router.push({
                pathname: '/(main)/meals/add',
                params: { mealType: 'LUNCH', date: selectedDate, from: 'log' },
              })
            }
            activeOpacity={0.8}
          >
            <Search size={19} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnAccent]}
            onPress={() =>
              router.push({
                pathname: '/(main)/meals/camera',
                params: { from: 'log', date: selectedDate },
              })
            }
            activeOpacity={0.85}
          >
            <Camera size={19} color="#FFFFFF" />
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
            tintColor={theme.colors.saffron}
          />
        }
      >
        {/* ── Dynamic Weekly Calendar Strip with Swipe ───────────── */}
        <WeeklyCalendarStrip
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          containerStyle={styles.calendarStripWrap}
        />

        {/* ── Shared Animated Daily Nutrition Overview Card ───────── */}
        <CalorieRemainingCard
          consumedCalories={consumedCalories}
          targetCalories={targetCalories}
          consumedProtein={consumedProtein}
          targetProtein={targetProtein}
          consumedCarbs={consumedCarbs}
          targetCarbs={targetCarbs}
          consumedFat={consumedFat}
          targetFat={targetFat}
          dateKey={selectedDate}
          focusKey={focusKey}
        />

        {/* ── Meal Sections List (Sleek Reference Image 2 Style) ─── */}
        {loading && !refreshing && !data ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.colors.saffron} />
            <Text style={styles.loadingText}>Loading your nutrition diary...</Text>
          </View>
        ) : (
          MEAL_SECTIONS.map((section) => {
            const meals = mealsByType[section.type];
            const sectionCalories = Math.round(
              meals.reduce((sum, m) => sum + m.totalCalories, 0),
            );
            const recommendedCals = Math.round(targetCalories * section.recommendedRatio);

            return (
              <View key={section.type} style={styles.sectionCard}>
                {/* Sleek Section Row: [Saffron Icon] Label ...... 114/1250 kcal (+) */}
                <TouchableOpacity
                  style={styles.sectionHeader}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push({
                      pathname: '/(main)/meals/add',
                      params: {
                        mealType: section.type,
                        date: selectedDate,
                        from: 'log',
                      },
                    })
                  }
                >
                  <View style={styles.sectionHeaderLeft}>
                    <MealSectionIcon type={section.type} color={theme.colors.saffron} />
                    <Text style={styles.sectionTitle}>{section.label}</Text>
                  </View>

                  <View style={styles.sectionHeaderRight}>
                    <Text style={styles.sectionCalFraction}>
                      <AnimatedCalorieNumber
                        value={sectionCalories}
                        dateKey={selectedDate}
                        focusKey={focusKey}
                      />
                      /{recommendedCals} {energyUnit}
                    </Text>

                    <TouchableOpacity
                      style={styles.addCircleBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/(main)/meals/add',
                          params: {
                            mealType: section.type,
                            date: selectedDate,
                            from: 'log',
                          },
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {/* Only render logged food items when meals exist (no empty box) */}
                {meals.length > 0 && (
                  <View style={styles.loggedMealsList}>
                    {meals.map((meal, index) => {
                      const displayTitle =
                        meal.name ||
                        (meal.items && meal.items.length > 0
                          ? meal.items.map((i) => i.foodName).join(', ')
                          : `${section.label} Meal`);

                      const firstItemPortion =
                        meal.items && meal.items.length === 1
                          ? meal.items[0].portionDescription ||
                            `${meal.items[0].quantity || 1} ${meal.items[0].unit || 'serving'}`
                          : meal.items && meal.items.length > 1
                          ? `${meal.items.length} items`
                          : `P ${formatFoodWeight(meal.totalProtein, foodUnit).full} • C ${formatFoodWeight(meal.totalCarbs, foodUnit).full} • F ${formatFoodWeight(meal.totalFat, foodUnit).full}`;

                      return (
                        <View
                          key={meal.id}
                          style={[
                            styles.mealItemContainer,
                            index > 0 && styles.mealItemBorderTop,
                          ]}
                        >
                          <View style={styles.mealMainRow}>
                            {meal.imageUrl ? (
                              <Image
                                source={{ uri: meal.imageUrl }}
                                style={styles.mealThumb}
                              />
                            ) : (
                              <View style={styles.mealThumbFallback}>
                                <Utensils size={18} color={theme.colors.saffron} />
                              </View>
                            )}

                            <View style={styles.mealCenterCol}>
                              <Text style={styles.mealName} numberOfLines={1}>
                                {displayTitle}
                              </Text>
                              <Text style={styles.mealSubtitleText} numberOfLines={1}>
                                {Math.round(meal.totalCalories)} {energyUnit}, {firstItemPortion}
                              </Text>
                            </View>

                            <TouchableOpacity
                              onPress={() => handleDeleteMeal(meal.id, displayTitle)}
                              style={styles.moreActionBtn}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              activeOpacity={0.7}
                            >
                              <MoreHorizontal size={18} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Sleek Delete Confirmation Modal ──────────────────────── */}
      <Modal
        visible={!!mealToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setMealToDelete(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Trash2 size={24} color="#D32F2F" />
            </View>
            <Text style={styles.modalTitle}>Remove Meal Entry?</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to remove &ldquo;{mealToDelete?.name}&rdquo; from your
              nutrition diary?
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setMealToDelete(null)}
                disabled={deleting}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={confirmDeleteMeal}
                disabled={deleting}
                activeOpacity={0.8}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalDeleteText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceBase,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 11,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  loggedCountPill: {
    backgroundColor: 'rgba(255, 145, 20, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  loggedCountText: {
    fontFamily: theme.fonts.bold,
    fontSize: 10,
    color: '#D97200',
  },
  headerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 24,
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE7DC',
    ...theme.shadows.elevation1,
  },
  actionBtnAccent: {
    backgroundColor: theme.colors.saffron,
    borderColor: theme.colors.saffron,
    ...theme.shadows.elevation3,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: 4,
    paddingBottom: 40,
  },
  calendarStripWrap: {
    paddingHorizontal: 0,
    marginBottom: 14,
  },

  /* ── Sleek Meal Section Cards (Reference Image 2 Layout) ───────── */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#EFECE2',
    marginBottom: 12,
    ...theme.shadows.elevation1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionCalFraction: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  sectionCalConsumed: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.saffron,
  },
  addCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Logged Meal Items ─────────────────────────────────────────── */
  loggedMealsList: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F2F0E8',
  },
  mealItemContainer: {
    paddingVertical: 4,
  },
  mealItemBorderTop: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F3EC',
  },
  mealMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FAF8F1',
    marginRight: 14,
  },
  mealThumbFallback: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  mealCenterCol: {
    flex: 1,
    paddingRight: 8,
  },
  mealName: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginBottom: 3,
  },
  mealSubtitleText: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  moreActionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Loading & Modal ───────────────────────────────────────────── */
  loadingBox: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  loadingText: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...theme.shadows.elevation2,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F5F4EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  modalDeleteBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
