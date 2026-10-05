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
import {
  Settings,
  Plus,
  Droplets,
  Flame,
  ChevronRight,
  Sparkles,
  Utensils,
  Dumbbell,
} from 'lucide-react-native';
import { theme } from '../../src/constants';
import {
  Card,
  ProgressRing,
  Badge,
  Pill,
  Button,
  Logo,
} from '../../src/components';

interface DayItem {
  dayName: string;
  dayNumber: number;
  dateStr: string;
}

export default function HomeScreen() {
  const router = useRouter();

  // Selected date state (defaults to Wednesday 14)
  const [selectedDay, setSelectedDay] = useState<number>(14);

  // Hydration tracker state
  const [waterCups, setWaterCups] = useState<number>(7);
  const totalCups = 10;

  // Days list matching the screenshot
  const days: DayItem[] = [
    { dayName: 'MON', dayNumber: 12, dateStr: '2026-09-12' },
    { dayName: 'TUE', dayNumber: 13, dateStr: '2026-09-13' },
    { dayName: 'WED', dayNumber: 14, dateStr: '2026-09-14' },
    { dayName: 'THU', dayNumber: 15, dateStr: '2026-09-15' },
    { dayName: 'FRI', dayNumber: 16, dateStr: '2026-09-16' },
    { dayName: 'SAT', dayNumber: 17, dateStr: '2026-09-17' },
  ];

  // Multi-segment macro calories for the signature ring
  // Total consumed = 1,840 kcal, Goal = 2,400 kcal
  const macroSegments = [
    { color: theme.colors.green, calories: 720, value: 180, label: 'Carbs' },
    { color: theme.colors.blue, calories: 440, value: 110, label: 'Protein' },
    { color: theme.colors.yellow, calories: 405, value: 45, label: 'Fat' },
  ];

  const handleAddWater = () => {
    if (waterCups < totalCups) {
      setWaterCups((prev) => prev + 1);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(main)/profile')}
            style={styles.avatarWrap}
          >
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
              }}
              style={styles.avatar}
            />
          </TouchableOpacity>

          <Logo variant="full" size="md" />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/settings')}
            style={styles.settingsBtn}
          >
            <Settings size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Date Selector ────────────────────────────────────── */}
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
                {isSelected && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 1. Energy Summary Card ───────────────────────────── */}
        <Card style={styles.sectionCard} padding="lg">
          <Text style={styles.cardTitle}>Energy Summary</Text>

          <View style={styles.ringWrapper}>
            <ProgressRing
              size={200}
              strokeWidth={15}
              segments={macroSegments}
              totalTarget={2400}
              centerValue="1,840"
              centerLabel="KCAL CONSUMED"
              showStats
              goal={2400}
              remaining={560}
            />
          </View>
        </Card>

        {/* ── 2. Daily Macros Card ─────────────────────────────── */}
        <Card style={styles.sectionCard} padding="lg">
          <Text style={styles.cardTitle}>Daily Macros</Text>

          {/* Carbs */}
          <View style={styles.macroRow}>
            <View
              style={[
                styles.macroIconCircle,
                { backgroundColor: 'rgba(142, 220, 94, 0.2)' },
              ]}
            >
              <View
                style={[
                  styles.macroMiniGrid,
                  { backgroundColor: theme.colors.green },
                ]}
              />
            </View>
            <View style={styles.macroInfo}>
              <View style={styles.macroTextHeader}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValues}>
                  <Text style={styles.macroCurrent}>180</Text>
                  <Text style={styles.macroTarget}> / 250g</Text>
                </Text>
              </View>
              <View style={styles.macroTrack}>
                <View
                  style={[
                    styles.macroFill,
                    {
                      width: `${(180 / 250) * 100}%`,
                      backgroundColor: theme.colors.green,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Protein */}
          <View style={styles.macroRow}>
            <View
              style={[
                styles.macroIconCircle,
                { backgroundColor: 'rgba(136, 168, 247, 0.22)' },
              ]}
            >
              <View
                style={[
                  styles.macroMiniDot,
                  { backgroundColor: theme.colors.blue },
                ]}
              />
            </View>
            <View style={styles.macroInfo}>
              <View style={styles.macroTextHeader}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValues}>
                  <Text style={styles.macroCurrent}>110</Text>
                  <Text style={styles.macroTarget}> / 140g</Text>
                </Text>
              </View>
              <View style={styles.macroTrack}>
                <View
                  style={[
                    styles.macroFill,
                    {
                      width: `${(110 / 140) * 100}%`,
                      backgroundColor: theme.colors.blue,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Fat */}
          <View style={styles.macroRow}>
            <View
              style={[
                styles.macroIconCircle,
                { backgroundColor: 'rgba(253, 217, 34, 0.25)' },
              ]}
            >
              <View
                style={[
                  styles.macroMiniDot,
                  { backgroundColor: theme.colors.yellow },
                ]}
              />
            </View>
            <View style={styles.macroInfo}>
              <View style={styles.macroTextHeader}>
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroValues}>
                  <Text style={styles.macroCurrent}>45</Text>
                  <Text style={styles.macroTarget}> / 65g</Text>
                </Text>
              </View>
              <View style={styles.macroTrack}>
                <View
                  style={[
                    styles.macroFill,
                    {
                      width: `${(45 / 65) * 100}%`,
                      backgroundColor: theme.colors.yellow,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* ── 3. Hydration Card ────────────────────────────────── */}
        <Card style={styles.sectionCard} padding="lg">
          <View style={styles.hydrationHeader}>
            <Text style={styles.cardTitle}>Hydration</Text>
            <Pill
              label={`${(waterCups * 0.25).toFixed(2)} L`}
              variant="blue"
              size="md"
            />
          </View>

          <View style={styles.hydrationBody}>
            <View style={styles.cupsGrid}>
              {Array.from({ length: totalCups }).map((_, idx) => {
                const filled = idx < waterCups;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.cupIconWrap,
                      filled && styles.cupIconWrapFilled,
                    ]}
                  >
                    <Droplets
                      size={16}
                      color={
                        filled
                          ? theme.colors.blue
                          : 'rgba(19, 19, 19, 0.2)'
                      }
                    />
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAddWater}
              style={styles.addWaterBtn}
            >
              <Plus size={18} color={theme.colors.blue} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* ── 4. Today's Meals Card ────────────────────────────── */}
        <Card style={styles.sectionCard} padding="lg">
          <View style={styles.mealsHeader}>
            <Text style={styles.cardTitle}>Today's Meals</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(main)/meals')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Meal Item 1: Avocado Toast */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(main)/meals/1')}
            style={styles.mealItem}
          >
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=160&auto=format&fit=crop&q=80',
              }}
              style={styles.mealThumb}
            />
            <View style={styles.mealDetails}>
              <Text style={styles.mealName}>Avocado Toast</Text>
              <Text style={styles.mealMeta}>Breakfast • 8:30 AM</Text>
            </View>
            <Text style={styles.mealCalories}>420 kcal</Text>
          </TouchableOpacity>

          {/* Meal Item 2: Grilled Salmon Salad */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(main)/meals/2')}
            style={styles.mealItem}
          >
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160&auto=format&fit=crop&q=80',
              }}
              style={styles.mealThumb}
            />
            <View style={styles.mealDetails}>
              <Text style={styles.mealName}>Grilled Salmon Salad</Text>
              <Text style={styles.mealMeta}>Lunch • 1:15 PM</Text>
            </View>
            <Text style={styles.mealCalories}>650 kcal</Text>
          </TouchableOpacity>

          {/* Dashed Add Meal Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(main)/meals/add')}
            style={styles.dashedAddBtn}
          >
            <Plus size={18} color={theme.colors.saffron} strokeWidth={2.4} />
            <Text style={styles.dashedAddText}>Log Another Meal</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surfaceBase,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: Platform.OS === 'android' ? 24 : 10,
    paddingBottom: 110, // Avoid overlapping floating bottom bar
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(19, 19, 19, 0.1)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    letterSpacing: 1.2,
    color: '#8B4513', // Warm golden bronze
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19, 19, 19, 0.04)',
  },

  // Date Selector
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: 2,
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    minWidth: 46,
  },
  dayCellActive: {
    backgroundColor: theme.colors.saffron,
    borderRadius: 16,
    paddingVertical: 12,
    ...theme.shadows.elevation2,
  },
  dayName: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dayNameActive: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  dayNumberActive: {
    color: '#FFFFFF',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },

  // Cards
  sectionCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: 24,
  },
  cardTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },

  // Energy Summary
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },

  // Daily Macros
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  macroIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  macroMiniGrid: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  macroMiniDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  macroInfo: {
    flex: 1,
  },
  macroTextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  macroLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  macroValues: {
    fontFamily: theme.fonts.regular,
  },
  macroCurrent: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  macroTarget: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  macroTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(19, 19, 19, 0.06)',
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Hydration
  hydrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  hydrationBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cupsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    gap: 8,
  },
  cupIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(19, 19, 19, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cupIconWrapFilled: {
    backgroundColor: 'rgba(136, 168, 247, 0.15)',
  },
  addWaterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(136, 168, 247, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.md,
  },

  // Today's Meals
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  viewAllText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#A0522D', // Sienna / Warm brown
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceCard,
    padding: theme.spacing.md,
    borderRadius: 16,
    marginBottom: theme.spacing.sm,
  },
  mealThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginRight: theme.spacing.md,
  },
  mealDetails: {
    flex: 1,
  },
  mealName: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  mealMeta: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  mealCalories: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  dashedAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 145, 20, 0.4)',
    borderRadius: 16,
    marginTop: theme.spacing.xs,
    backgroundColor: 'rgba(255, 145, 20, 0.04)',
    gap: 6,
  },
  dashedAddText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.saffron,
  },
});
