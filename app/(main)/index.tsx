import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  Modal,
  TextInput,
  Alert,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeNavigate } from '../../src/utils/navigationGuard';
import Svg, { Path } from 'react-native-svg';
import {
  Bell,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Leaf,
  Plus,
  X,
  Droplet,
  Droplets,
  RotateCcw,
  Minus,
  Scale,
  Utensils,
} from 'lucide-react-native';
import theme from '../../src/constants/theme';
import { Logo, CalorieRemainingCard, WeeklyCalendarStrip } from '../../src/components';
import { useAuthStore } from '../../src/store/authStore';
import { useAccount } from '../../src/features/settings/hooks/useAccount';
import { useUnreadNotificationsCount } from '../../src/features/notifications/hooks/useNotifications';
import { useProfile } from '../../src/features/profile/hooks/useProfile';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import {
  calculateClientNutritionPlan,
  FitnessGoalType,
  GenderType,
  ActivityLevelType,
  kgToLb,
  lbToKg,
} from '../../src/utils/nutritionCalculator';
import { mealsApi } from '../../src/features/meals/api/meals.api';
import { Meal, DailyNutritionSummary } from '../../src/features/meals/types';
import {
  useUnitStore,
  formatWeight,
  formatHeight,
  formatEnergy,
  formatFoodWeight,
  formatWater,
} from '../../src/store/unitStore';
import { useWaterStore } from '../../src/store/waterStore';
import { useSubscriptionStore } from '../../src/store/subscriptionStore';
import { DiscoverProCard } from '../../src/features/subscription/components/DiscoverProCard';
import { progressApi } from '../../src/features/progress/api/progress.api';

// ── Tumbler Glass SVG Component (Matching Image 1) ───────────────────────────
interface TumblerGlassProps {
  status: 'filled' | 'next' | 'empty';
  onPress: () => void;
}

const TumblerGlass: React.FC<TumblerGlassProps> = React.memo(({ status, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.cupTouchable}
    >
      <Svg width={30} height={40} viewBox="0 0 30 40">
        {status === 'filled' && (
          <>
            {/* Glass body background */}
            <Path
              d="M3 4 L27 4 L23.5 35 Q23.2 38 20 38 L10 38 Q6.8 38 6.5 35 L3 4 Z"
              fill="#DBEAFE"
              stroke="#60A5FA"
              strokeWidth={1.5}
            />
            {/* Water liquid */}
            <Path
              d="M4.5 10 L25.5 10 L23 34.5 Q22.8 37 20 37 L10 37 Q7.2 37 7 34.5 L4.5 10 Z"
              fill="#60A5FA"
            />
            {/* Water surface highlight */}
            <Path
              d="M5 10 L25 10"
              stroke="#93C5FD"
              strokeWidth={2}
              strokeLinecap="round"
            />
            {/* Reflection shine */}
            <Path
              d="M7.5 13 L9 32"
              stroke="rgba(255, 255, 255, 0.65)"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </>
        )}

        {status === 'next' && (
          <>
            {/* Dashed empty glass with + */}
            <Path
              d="M3 4 L27 4 L23.5 35 Q23.2 38 20 38 L10 38 Q6.8 38 6.5 35 L3 4 Z"
              fill="#F0F7FF"
              stroke="#60A5FA"
              strokeWidth={1.5}
              strokeDasharray="3 2.5"
            />
            {/* Plus sign in center */}
            <Path
              d="M15 15 L15 25 M10 20 L20 20"
              stroke="#3B82F6"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </>
        )}

        {status === 'empty' && (
          <>
            {/* Empty light glass */}
            <Path
              d="M3 4 L27 4 L23.5 35 Q23.2 38 20 38 L10 38 Q6.8 38 6.5 35 L3 4 Z"
              fill="#FFFFFF"
              stroke="rgba(27, 40, 27, 0.16)"
              strokeWidth={1.2}
            />
          </>
        )}
      </Svg>
    </TouchableOpacity>
  );
});

export default function HomeScreen() {
  const router = useSafeNavigate();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const isPro = useSubscriptionStore((s) => s.isPro);
  const openPaywall = useSubscriptionStore((s) => s.openPaywall);
  const { avatarUrl } = useAccount();
  const { unreadCount } = useUnreadNotificationsCount();
  const displayAvatar = avatarUrl || user?.avatarUrl;
  const { profile, updateProfile, isUpdating, refetch: refetchProfile } = useProfile();
  const onboarding = useOnboardingStore();
  const { energyUnit, foodUnit, bodyUnit } = useUnitStore();
  const { intakeByDate, dailyGoalMl, addCup, removeCup, resetDate } = useWaterStore();

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

  // Compute Greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // User details — fallback to onboarding store when profile is fetching over network
  const userName = user?.name ? user.name.split(' ')[0] : 'Tuan';
  const userWeight = profile?.weightKg ?? onboarding.weightKg ?? 70;
  const userHeight = profile?.heightCm ?? onboarding.heightCm ?? 170;
  const userGender = (profile?.gender ?? onboarding.gender ?? 'MALE') as GenderType;
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
    return onboarding.age || 26;
  }, [profile?.dateOfBirth, onboarding.age]);
  const userActivity = (profile?.activityLevel ?? onboarding.activityLevel ?? 'MODERATE') as ActivityLevelType;
  const userFitnessGoal = profile?.fitnessGoal ||
    (onboarding.fitnessGoal === 'LOSE_WEIGHT' ? 'WEIGHT_LOSS' : onboarding.fitnessGoal === 'BUILD_MUSCLE' ? 'MUSCLE_GAIN' : 'WEIGHT_LOSS');

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

  const targetCalories =
    profile?.activeTarget?.dailyCalories ||
    onboarding.calculatedPlan?.calories ||
    computedPlan.calories ||
    2187;
  const targetProtein =
    profile?.activeTarget?.dailyProtein ||
    onboarding.calculatedPlan?.protein ||
    computedPlan.protein ||
    133;
  const targetCarbs =
    profile?.activeTarget?.dailyCarbs ||
    onboarding.calculatedPlan?.carbs ||
    computedPlan.carbs ||
    263;
  const targetFat =
    profile?.activeTarget?.dailyFat ||
    onboarding.calculatedPlan?.fat ||
    computedPlan.fat ||
    67;

  // Weight & Unit computations
  const targetWeight =
    profile?.targetWeightKg ||
    onboarding.targetWeightKg ||
    (userFitnessGoal === 'WEIGHT_LOSS'
      ? Math.max(35, userWeight - 5)
      : userFitnessGoal === 'MUSCLE_GAIN'
      ? userWeight + 4
      : userWeight);

  const weightDisplay = formatWeight(userWeight, bodyUnit);
  const goalWeightDisplay = formatWeight(targetWeight, bodyUnit);
  const bmi =
    userHeight > 0
      ? (userWeight / ((userHeight / 100) * (userHeight / 100))).toFixed(1)
      : '21.0';

  const weightDiff = Math.abs(userWeight - targetWeight);
  const deltaDisplay = formatWeight(weightDiff, bodyUnit);
  const deltaLabel =
    targetWeight > userWeight
      ? 'Weight to Gain'
      : targetWeight < userWeight
      ? 'Weight to Lose'
      : 'Weight Goal';

  // Water calculations
  const currentWaterMl = intakeByDate[selectedDate] || 0;
  const filledCups = Math.min(8, Math.floor(currentWaterMl / 250));
  const waterDisplay = formatWater(currentWaterMl, foodUnit);
  const waterGoalDisplay = formatWater(dailyGoalMl, foodUnit);

  // Update Weight Modal state
  const [isUpdateWeightOpen, setIsUpdateWeightOpen] = useState(false);
  const [newWeightInput, setNewWeightInput] = useState('');

  const handleOpenUpdateWeight = () => {
    setNewWeightInput(
      bodyUnit === 'imperial'
        ? kgToLb(userWeight).toFixed(1)
        : String(userWeight)
    );
    setIsUpdateWeightOpen(true);
  };

  const handleSaveWeight = async () => {
    let parsed = parseFloat(newWeightInput);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight.');
      return;
    }
    if (bodyUnit === 'imperial') {
      parsed = lbToKg(parsed);
    }
    try {
      await updateProfile({ weightKg: parsed });
      onboarding.setMetrics({
        gender: userGender,
        age: userAge,
        heightCm: userHeight,
        weightKg: parsed,
      });
      setIsUpdateWeightOpen(false);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update weight. Please try again.');
    }
  };

  // Water Action Modal state
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);

  const handleCupPress = (cupIndex: number) => {
    if (cupIndex < filledCups) {
      setIsWaterModalOpen(true);
    } else {
      addCup(selectedDate, 250);
    }
  };

  const handleWaterMore = () => {
    setIsWaterModalOpen(true);
  };

  // Real meal & data state from backend with client-side cache by date
  const mealsCacheRef = useRef<Record<string, { summary: DailyNutritionSummary; meals: Meal[] }>>({});
  const [dailyData, setDailyData] = useState<{
    summary: DailyNutritionSummary;
    meals: Meal[];
  } | null>(null);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [focusKey, setFocusKey] = useState(0);
  const [streakDays, setStreakDays] = useState<number>(1);

  const fetchStreak = useCallback(async () => {
    try {
      const res = await progressApi.getOverview(7);
      if (res?.streak?.currentStreakDays !== undefined) {
        setStreakDays(res.streak.currentStreakDays);
      }
    } catch {
      // Keep default
    }
  }, []);

  const fetchDateData = useCallback(async (targetDate: string) => {
    const cached = mealsCacheRef.current[targetDate];
    if (cached) {
      setDailyData(cached);
    }
    try {
      const res = await mealsApi.getDailyMeals(targetDate);
      const data = {
        summary: res.summary,
        meals: res.meals || [],
      };
      const isUnchanged =
        cached &&
        cached.summary?.totalCalories === data.summary?.totalCalories &&
        cached.summary?.totalProtein === data.summary?.totalProtein &&
        cached.summary?.totalCarbs === data.summary?.totalCarbs &&
        cached.summary?.totalFat === data.summary?.totalFat &&
        cached.meals.length === data.meals.length;

      mealsCacheRef.current[targetDate] = data;
      if (!isUnchanged) {
        setDailyData(data);
      }
    } catch (err: any) {
      console.warn('Failed to load meals for dashboard:', err?.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setFocusKey((prev) => prev + 1);
      fetchDateData(selectedDate);
      fetchStreak();
    }, [fetchDateData, selectedDate, fetchStreak])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchDateData(selectedDate), refetchProfile(), fetchStreak()]);
    setRefreshing(false);
  }, [fetchDateData, selectedDate, refetchProfile, fetchStreak]);

  const handleSelectDay = (targetDate: string) => {
    setSelectedDate(targetDate);
    // Instant update from cache if available, otherwise clear to avoid stale data flicker
    if (mealsCacheRef.current[targetDate]) {
      setDailyData(mealsCacheRef.current[targetDate]);
    } else {
      setDailyData(null);
    }
    fetchDateData(targetDate);
  };

  // Consumed nutrition totals from backend (falls back to 0 if none logged)
  const consumedCalories = dailyData?.summary ? Math.round(dailyData.summary.totalCalories) : 0;
  const consumedProtein = dailyData?.summary ? Math.round(dailyData.summary.totalProtein) : 0;
  const consumedCarbs = dailyData?.summary ? Math.round(dailyData.summary.totalCarbs) : 0;
  const consumedFat = dailyData?.summary ? Math.round(dailyData.summary.totalFat) : 0;

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Top Header Bar ───────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Logo variant="full" size="md" />
        </View>

        <View style={styles.headerRight}>
          {/* Pro Upgrade Crown Icon (Only for free user) */}
          {!isPro && (
            <TouchableOpacity
              style={[
                styles.crownBtn,
                {
                  backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : '#FEE2E2',
                },
              ]}
              activeOpacity={0.75}
              onPress={() => openPaywall('header_crown')}
              accessibilityLabel="Upgrade to NutrAI Pro"
            >
              <Image
                source={require('../../assets/icons/crown-pro.png')}
                style={styles.crownImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}

          {/* Streak Badge (Matches Progress screen pastel style) */}
          <TouchableOpacity
            style={[
              styles.streakBadge,
              {
                backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : '#FEE2E2',
              },
            ]}
            activeOpacity={0.75}
            onPress={() => router.push('/(main)/progress')}
            accessibilityLabel={`Streak ${streakDays} days`}
          >
            <Image
              source={require('../../assets/icons/streakicon.png')}
              style={styles.streakIconImg}
              resizeMode="contain"
            />
            <Text
              style={[
                styles.streakCountText,
                { color: isDark ? '#FFA39E' : '#D03027' },
              ]}
            >
              {streakDays}
            </Text>
          </TouchableOpacity>

          {/* Notification Bell */}
          <TouchableOpacity
            style={[styles.bellBtn, { backgroundColor: colors.iconBg }]}
            activeOpacity={0.7}
            onPress={() => router.push('/notifications' as any)}
          >
            <Bell size={19} color={colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
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
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Greeting Section ─────────────────────────────────────── */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greetingTime, { color: colors.textSecondary }]} numberOfLines={1}>{getGreeting()}
            <Text style={[styles.userNameText, { color: colors.textPrimary }]}> {userName}</Text>
          </Text>
        </View>

        {/* ── Date Selector (Dynamic Weekly strip with swipe) ──────── */}
        <WeeklyCalendarStrip
          selectedDate={selectedDate}
          onSelectDate={handleSelectDay}
          containerStyle={{ paddingHorizontal: 0 }}
        />

        {/* ── Calorie Remaining Card ───────────────────────────────── */}
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

        {/* ── 1. Water Tracker Section (Matching Image 1) ───────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Water</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleWaterMore}
            style={styles.moreLinkBtn}
          >
            <Text style={[styles.moreLinkText, { color: colors.textSecondary }]}>More</Text>
            <ChevronRight size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.trackerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.trackerSubLabel, { color: colors.textSecondary }]}>Today's Intake</Text>
          <View style={styles.trackerValueRow}>
            <Text style={[styles.trackerBigNumber, { color: colors.textPrimary }]}>{waterDisplay.value}</Text>
            <Text style={[styles.trackerUnitText, { color: colors.textPrimary }]}>{waterDisplay.unit}</Text>
          </View>

          {/* 8 Tumbler glasses */}
          <View style={styles.tumblerRow}>
            {Array.from({ length: 8 }).map((_, idx) => {
              let status: 'filled' | 'next' | 'empty' = 'empty';
              if (idx < filledCups) {
                status = 'filled';
              } else if (idx === filledCups) {
                status = 'next';
              }
              return (
                <TumblerGlass
                  key={idx}
                  status={status}
                  onPress={() => handleCupPress(idx)}
                />
              );
            })}
          </View>

          <Text style={[styles.trackerGoalText, { color: colors.textSecondary }]}>Goal: {waterGoalDisplay.full}</Text>
        </View>

        {/* ── 2. Weight Tracker Section (Matching Image 1) ──────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Weight</Text>
        </View>

        <View style={[styles.trackerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.trackerSubLabel, { color: colors.textSecondary }]}>Current Weight</Text>
          <View style={styles.weightContentRow}>
            <View style={styles.weightValueCol}>
              <View style={styles.trackerValueRow}>
                <Text style={[styles.trackerBigNumber, { color: colors.textPrimary }]}>{weightDisplay.value}</Text>
                <Text style={[styles.trackerUnitText, { color: colors.textPrimary }]}>{weightDisplay.unit}</Text>
              </View>
              <View style={[styles.bmiPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(27, 40, 27, 0.06)' }]}>
                <Text style={[styles.bmiPillText, { color: colors.textSecondary }]}>BMI: {bmi}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.updateWeightBtn}
              activeOpacity={0.8}
              onPress={handleOpenUpdateWeight}
            >
              <Plus size={15} color="#2563EB" style={{ marginRight: 4 }} />
              <Text style={styles.updateWeightBtnText}>Update Weight</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.weightFooterDivider, { backgroundColor: colors.border }]} />

          <View style={styles.weightFooterRow}>
            <Text style={[styles.weightFooterItem, { color: colors.textSecondary }]}>
              Goal Weight: <Text style={[styles.weightFooterBold, { color: colors.textPrimary }]}>{goalWeightDisplay.full}</Text>
            </Text>
            <Text style={[styles.weightFooterItem, { color: colors.textSecondary }]}>
              {deltaLabel}: <Text style={[styles.weightFooterBold, { color: colors.textPrimary }]}>{deltaDisplay.full}</Text>
            </Text>
          </View>
        </View>


        {/* ── Recent Meals Section ─────────────────────────────────── */}
        {/* ── Recent Meals Section ─────────────────────────────────── */}
        <View style={styles.mealsHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Meals</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(main)/meals')}
            style={styles.seeAllBtn}
          >
            <Text style={[styles.seeAllText, { color: colors.textSecondary }]}>See all</Text>
            <ChevronRight size={14} color={colors.textSecondary} />
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
                style={[styles.mealCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: '/(main)/meals/[id]',
                    params: { id: meal.id, from: 'home', date: selectedDate },
                  })
                }
              >
                {meal.imageUrl ? (
                  <Image
                    source={{
                      uri: meal.imageUrl,
                    }}
                    style={styles.mealThumb}
                  />
                ) : (
                  <View style={[styles.mealThumbFallback, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Utensils size={20} color={colors.textSecondary} />
                  </View>
                )}
                <View style={styles.mealInfoCol}>
                  <Text style={[styles.mealName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {summaryTitle}
                  </Text>
                  <Text style={[styles.mealMacros, { color: colors.textSecondary }]}>
                    {Math.round(meal.totalCalories)} {energyUnit}  •  P {formatFoodWeight(meal.totalProtein, foodUnit).full}  •  C {formatFoodWeight(meal.totalCarbs, foodUnit).full}  •  F {formatFoodWeight(meal.totalFat, foodUnit).full}
                  </Text>
                  <Text style={[styles.mealTime, { color: colors.textSecondary }]}>{timeStr}</Text>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          })
        ) : (
          <TouchableOpacity
            style={[styles.emptyMealsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: '/(main)/meals/add',
                params: { from: 'home', date: selectedDate },
              })
            }
          >
            <View style={styles.emptyMealsLeft}>
              <Text style={[styles.emptyMealsTitle, { color: colors.textPrimary }]}>No meals logged today</Text>
              <Text style={[styles.emptyMealsSub, { color: colors.textSecondary }]}>
                Tap to scan food or search USDA database
              </Text>
            </View>
            <View style={[styles.emptyMealsAddBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.emptyMealsAddText}>+ Log Meal</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Discover NutraAI Pro Card (Matching Image 3) ── */}
        <DiscoverProCard />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Update Weight Modal ────────────────────────────────────── */}
      <Modal
        visible={isUpdateWeightOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsUpdateWeightOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Update Weight</Text>
              <TouchableOpacity
                onPress={() => setIsUpdateWeightOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              Enter current weight ({bodyUnit === 'metric' ? 'kg' : 'lbs'})
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              keyboardType="numeric"
              value={newWeightInput}
              onChangeText={setNewWeightInput}
              placeholder={bodyUnit === 'metric' ? 'e.g. 60.5' : 'e.g. 133.5'}
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
              onPress={handleSaveWeight}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.modalSaveBtnText}>Save Weight</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Water Action Modal (Synchronized NutraAI Custom Dialog) ── */}
      <Modal
        visible={isWaterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsWaterModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={[styles.waterIconCircle, { backgroundColor: isDark ? 'rgba(37,99,235,0.2)' : '#EFF6FF' }]}>
                  <Droplets size={18} color="#2563EB" />
                </View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Water Intake</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsWaterModalOpen(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Current Status Box */}
            <View style={[styles.waterStatusBox, { backgroundColor: colors.inputBg }]}>
              <View style={styles.waterStatusRow}>
                <Text style={[styles.waterStatusLabel, { color: colors.textSecondary }]}>Today's Intake</Text>
                <Text style={[styles.waterStatusVal, { color: colors.textPrimary }]}>{waterDisplay.full}</Text>
              </View>
              <View style={styles.waterStatusRow}>
                <Text style={[styles.waterStatusLabel, { color: colors.textSecondary }]}>Daily Goal</Text>
                <Text style={[styles.waterStatusGoal, { color: colors.textSecondary }]}>{waterGoalDisplay.full}</Text>
              </View>
              <View style={[styles.waterProgressBarTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.waterProgressBarFill,
                    {
                      width: `${Math.min(
                        100,
                        Math.round(
                          (currentWaterMl / (dailyGoalMl || 2000)) * 100
                        )
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Quick Actions List */}
            <View style={styles.waterActionsCol}>
              <TouchableOpacity
                style={[styles.waterActionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.75}
                onPress={() => {
                  addCup(selectedDate, 250);
                  setIsWaterModalOpen(false);
                }}
              >
                <View style={styles.waterActionLeft}>
                  <View style={[styles.waterActionIconWrap, { backgroundColor: isDark ? 'rgba(37,99,235,0.2)' : '#EFF6FF' }]}>
                    <Plus size={16} color="#2563EB" />
                  </View>
                  <Text style={[styles.waterActionText, { color: colors.textPrimary }]}>
                    {foodUnit === 'imperial' ? '+8 fl oz (1 cup)' : '+250 ml (1 cup)'}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.waterActionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.75}
                onPress={() => {
                  addCup(selectedDate, 500);
                  setIsWaterModalOpen(false);
                }}
              >
                <View style={styles.waterActionLeft}>
                  <View style={[styles.waterActionIconWrap, { backgroundColor: isDark ? 'rgba(37,99,235,0.2)' : '#EFF6FF' }]}>
                    <Plus size={16} color="#2563EB" />
                  </View>
                  <Text style={[styles.waterActionText, { color: colors.textPrimary }]}>
                    {foodUnit === 'imperial' ? '+16 fl oz (2 cups)' : '+500 ml (2 cups)'}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {currentWaterMl > 0 && (
                <TouchableOpacity
                  style={[styles.waterActionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  activeOpacity={0.75}
                  onPress={() => {
                    removeCup(selectedDate, 250);
                    setIsWaterModalOpen(false);
                  }}
                >
                  <View style={styles.waterActionLeft}>
                    <View style={[styles.waterActionIconWrap, { backgroundColor: colors.inputBg }]}>
                      <Minus size={16} color={colors.textSecondary} />
                    </View>
                    <Text style={[styles.waterActionText, { color: colors.textPrimary }]}>
                      {foodUnit === 'imperial' ? '-8 fl oz (Remove 1 cup)' : '-250 ml (Remove 1 cup)'}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}

              {currentWaterMl > 0 && (
                <TouchableOpacity
                  style={[styles.waterActionItem, styles.waterActionItemDanger, { backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#FFFBFB', borderColor: isDark ? 'rgba(220,38,38,0.3)' : '#FEE2E2' }]}
                  activeOpacity={0.75}
                  onPress={() => {
                    resetDate(selectedDate);
                    setIsWaterModalOpen(false);
                  }}
                >
                  <View style={styles.waterActionLeft}>
                    <View style={[styles.waterActionIconWrap, { backgroundColor: isDark ? 'rgba(220,38,38,0.2)' : '#FEF2F2' }]}>
                      <RotateCcw size={16} color="#DC2626" />
                    </View>
                    <Text style={[styles.waterActionText, { color: '#DC2626' }]}>
                      Reset Today
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#DC2626" />
                </TouchableOpacity>
              )}
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
    gap: 8,
  },
  crownBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownImg: {
    width: 22,
    height: 18,
  },
  streakBadge: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  streakIconImg: {
    width: 19,
    height: 19,
  },
  streakCountText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: theme.fonts.bold,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(27, 40, 27, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF9114',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: theme.fonts.bold,
    lineHeight: 12,
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
  avatarPlaceholder: {
    backgroundColor: '#FF9114',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  // ── Greeting
  greetingSection: {
    marginBottom: 14,
  },
  aiAssistantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 145, 20, 0.45)',
    marginBottom: 12,
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  aiAssistantPillText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#131313',
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
  dateSelectorContainer: {
    marginBottom: 16,
  },
  dateSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dateSelectorMonth: {
    fontSize: 13,
    fontWeight: '700',
    color: '#656A60',
    letterSpacing: -0.2,
  },
  todayPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F0F8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#285880',
  },
  dateSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginBottom: 16,
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
    borderRadius: 20,
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
  mealThumbFallback: {
    width: 54,
    height: 54,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: '#F3F1E7',
    borderWidth: 1,
    borderColor: '#E7E4D8',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 20,
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
  // ── Tracker Headers & Cards (Water & Weight)
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  moreLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  moreLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#797E74',
  },
  trackerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFECE2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  trackerSubLabel: {
    fontSize: 13,
    color: '#767B71',
    fontWeight: '600',
    marginBottom: 4,
  },
  trackerValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  trackerBigNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B281B',
    letterSpacing: -0.5,
  },
  trackerUnitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B281B',
  },
  // ── Tumbler Row
  tumblerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
    paddingHorizontal: 2,
  },
  cupTouchable: {
    padding: 2,
  },
  trackerGoalText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#767B71',
  },
  // ── Weight Specific
  weightContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  weightValueCol: {
    flex: 1,
  },
  bmiPill: {
    backgroundColor: 'rgba(27, 40, 27, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  bmiPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#767B71',
  },
  updateWeightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  updateWeightBtnText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
  weightFooterDivider: {
    height: 1,
    backgroundColor: '#F3EFE8',
    marginTop: 14,
    marginBottom: 10,
  },
  weightFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightFooterItem: {
    fontSize: 12,
    color: '#767B71',
    fontWeight: '600',
  },
  weightFooterBold: {
    color: '#1B281B',
    fontWeight: '700',
  },
  // ── Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
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
    fontSize: 18,
    fontWeight: '800',
    color: '#1B281B',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#656A60',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F7F6F0',
    borderWidth: 1,
    borderColor: '#E6E3D8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#1B281B',
    marginBottom: 18,
  },
  modalSaveBtn: {
    backgroundColor: '#FF9114',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  // ── Synchronized Water Modal Styles
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  waterIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterStatusBox: {
    backgroundColor: '#F7F6F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  waterStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  waterStatusLabel: {
    fontSize: 13,
    color: '#656A60',
    fontWeight: '600',
  },
  waterStatusVal: {
    fontSize: 14,
    color: '#1B281B',
    fontWeight: '800',
  },
  waterStatusGoal: {
    fontSize: 13,
    color: '#767B71',
    fontWeight: '700',
  },
  waterProgressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E6E3D8',
    marginTop: 8,
    overflow: 'hidden',
  },
  waterProgressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  waterActionsCol: {
    gap: 8,
  },
  waterActionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE2',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  waterActionItemDanger: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FFFBFB',
  },
  waterActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waterActionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B281B',
  },
});
