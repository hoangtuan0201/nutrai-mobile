import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import {
  Bell,
  Flame,
  Pencil,
  ChevronDown,
  Dumbbell,
  Wheat,
  Droplet,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Leaf,
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

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile } = useProfile();
  const onboarding = useOnboardingStore();

  const [selectedTimeframe, setSelectedTimeframe] = useState('Today');
  const [selectedDay, setSelectedDay] = useState<number>(14);

  const days = [
    { dayName: 'MON', dayNumber: 12 },
    { dayName: 'TUE', dayNumber: 13 },
    { dayName: 'WED', dayNumber: 14 },
    { dayName: 'THU', dayNumber: 15 },
    { dayName: 'FRI', dayNumber: 16 },
    { dayName: 'SAT', dayNumber: 17 },
  ];

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

  // Example consumed values
  const consumedCalories = 1250;
  const remainingCalories = Math.max(0, targetCalories - consumedCalories);
  const consumedProtein = 85;
  const consumedCarbs = 120;
  const consumedFat = 35;

  // Progress ring math
  const ringSize = 96;
  const strokeWidth = 9;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(1, Math.max(0, consumedCalories / (targetCalories || 1)));
  const strokeDashoffset = circumference * (1 - progressRatio);

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
      >
        {/* ── Greeting Section ─────────────────────────────────────── */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTime}>{getGreeting()}
            <Text style={styles.userNameText}> {userName}</Text>
          </Text>
        </View>

        {/* ── Date Selector (Weekly strip matching design) ──────────── */}
        <View style={styles.dateSelectorRow}>
          {days.map((d) => {
            const isSelected = selectedDay === d.dayNumber;
            return (
              <TouchableOpacity
                key={d.dayNumber}
                activeOpacity={0.75}
                onPress={() => setSelectedDay(d.dayNumber)}
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
                <TouchableOpacity
                  style={styles.timeframePill}
                  activeOpacity={0.7}
                  onPress={() => setSelectedTimeframe(selectedTimeframe === 'Today' ? 'Week' : 'Today')}
                >
                  <Text style={styles.timeframeText}>{selectedTimeframe}</Text>
                  <ChevronDown size={13} color="#686C63" />
                </TouchableOpacity>
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

        {/* ── Macro Targets Section ────────────────────────────────── */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionTitle}>Macro Targets</Text>
          <Text style={styles.sectionSubtitle}>
            Balance your nutrition, reach your goals.
          </Text>
        </View>

        <View style={styles.macroCardsRow}>
          {/* Card 1: Protein */}
          <View style={styles.macroTargetCard}>
            <View style={[styles.macroBadgeCircle, { backgroundColor: '#E4ECFB' }]}>
              <Dumbbell size={18} color="#5D80E6" />
            </View>
            <Text style={styles.macroCardName}>Protein</Text>
            <Text style={styles.macroCardValue}>{targetProtein} g</Text>
            <Text style={styles.macroCardSub}>/ day</Text>
          </View>

          {/* Card 2: Carbs */}
          <View style={styles.macroTargetCard}>
            <View style={[styles.macroBadgeCircle, { backgroundColor: '#E8F6E4' }]}>
              <Wheat size={18} color="#559C38" />
            </View>
            <Text style={styles.macroCardName}>Carbs</Text>
            <Text style={styles.macroCardValue}>{targetCarbs} g</Text>
            <Text style={styles.macroCardSub}>/ day</Text>
          </View>

          {/* Card 3: Fat */}
          <View style={styles.macroTargetCard}>
            <View style={[styles.macroBadgeCircle, { backgroundColor: '#FEF8DE' }]}>
              <Droplet size={18} color="#E5A817" />
            </View>
            <Text style={styles.macroCardName}>Fat</Text>
            <Text style={styles.macroCardValue}>{targetFat} g</Text>
            <Text style={styles.macroCardSub}>/ day</Text>
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

        {/* Meal 1 */}
        <TouchableOpacity
          style={styles.mealCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(main)/meals')}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80',
            }}
            style={styles.mealThumb}
          />
          <View style={styles.mealInfoCol}>
            <Text style={styles.mealName}>Grilled Chicken Bowl</Text>
            <Text style={styles.mealMacros}>
              520 kcal  •  P 42g  •  C 55g  •  F 18g
            </Text>
            <Text style={styles.mealTime}>12:30 PM</Text>
          </View>
          <ChevronRight size={18} color="#A6ABA1" />
        </TouchableOpacity>

        {/* Meal 2 */}
        <TouchableOpacity
          style={styles.mealCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(main)/meals')}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&auto=format&fit=crop&q=80',
            }}
            style={styles.mealThumb}
          />
          <View style={styles.mealInfoCol}>
            <Text style={styles.mealName}>Berry Smoothie</Text>
            <Text style={styles.mealMacros}>
              280 kcal  •  P 18g  •  C 32g  •  F 8g
            </Text>
            <Text style={styles.mealTime}>8:15 AM</Text>
          </View>
          <ChevronRight size={18} color="#A6ABA1" />
        </TouchableOpacity>

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
  timeframePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F2EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 2,
  },
  timeframeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#556052',
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
  // ── Macro Targets
  sectionHeaderWrap: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B281B',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#767B71',
    marginTop: 2,
    fontWeight: '500',
  },
  macroCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  macroTargetCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE2',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  macroBadgeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  macroCardName: {
    fontSize: 12,
    color: '#656A60',
    fontWeight: '600',
    marginBottom: 2,
  },
  macroCardValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1B281B',
    letterSpacing: -0.3,
  },
  macroCardSub: {
    fontSize: 11,
    color: '#8A8F85',
    fontWeight: '500',
    marginTop: 1,
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
});
