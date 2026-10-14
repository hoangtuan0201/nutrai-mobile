import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Utensils,
  Camera,
  Search,
  Coffee,
  UtensilsCrossed,
  Soup,
  Apple,
  AlertTriangle,
} from 'lucide-react-native';
import { theme } from '../../../src/constants';
import { Card, Button } from '../../../src/components';
import { mealsApi } from '../../../src/features/meals/api/meals.api';
import { Meal, MealType, DailyMealsResponse } from '../../../src/features/meals/types';
import { useUnitStore, formatFoodWeight } from '../../../src/store/unitStore';

const MEAL_SECTIONS: Array<{
  type: MealType;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
}> = [
  { type: 'BREAKFAST', label: 'Breakfast', icon: Coffee, color: '#D97706', bgColor: '#FEF3C7' },
  { type: 'LUNCH', label: 'Lunch', icon: UtensilsCrossed, color: '#16A34A', bgColor: '#DCFCE7' },
  { type: 'DINNER', label: 'Dinner', icon: Soup, color: '#2563EB', bgColor: '#DBEAFE' },
  { type: 'SNACK', label: 'Snacks & Others', icon: Apple, color: '#9333EA', bgColor: '#F3E8FF' },
];

export default function MealsListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();

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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DailyMealsResponse | null>(null);
  const { energyUnit, foodUnit } = useUnitStore();

  // Sync selectedDate if route param changes
  useEffect(() => {
    if (params.date && params.date !== selectedDate) {
      setSelectedDate(params.date);
    }
  }, [params.date]);

  const fetchMeals = useCallback(async () => {
    try {
      const res = await mealsApi.getDailyMeals(selectedDate);
      setData(res);
    } catch (error: any) {
      console.warn('Failed to load meals:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  // Auto-reload data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchMeals();
    }, [fetchMeals])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMeals();
  };

  const changeDateByDays = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);

    const newDateStr = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(dateObj);

    setSelectedDate(newDateStr);
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
      fetchMeals();
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

  const isToday =
    selectedDate ===
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>DAILY LOG</Text>
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
            <Search size={18} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnAccent]}
            onPress={() => router.push('/(main)/meals/camera')}
            activeOpacity={0.8}
          >
            <Camera size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Switcher Bar */}
      <View style={styles.dateBar}>
        <TouchableOpacity
          onPress={() => changeDateByDays(-1)}
          style={styles.dateNavBtn}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const todayStr = new Intl.DateTimeFormat('en-CA', {
              timeZone: 'Asia/Ho_Chi_Minh',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }).format(new Date());
            setSelectedDate(todayStr);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.dateText}>
            {isToday ? 'Today, ' : ''}
            {selectedDate}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => changeDateByDays(1)}
          style={styles.dateNavBtn}
          activeOpacity={0.7}
        >
          <ChevronRight size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Daily Summary Card */}
      <View style={styles.summaryContainer}>
        <Card variant="default" padding="md" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryCaloriesValue}>{summary.totalCalories}</Text>
              <Text style={styles.summaryCaloriesLabel}>KCAL CONSUMED</Text>
            </View>
            <View style={styles.macroPillsGroup}>
              <View style={[styles.macroPill, { backgroundColor: 'rgba(136, 168, 247, 0.15)' }]}>
                <Text style={[styles.macroPillVal, { color: '#3865D6' }]}>{summary.totalProtein}g</Text>
                <Text style={styles.macroPillLabel}>P</Text>
              </View>
              <View style={[styles.macroPill, { backgroundColor: 'rgba(142, 220, 94, 0.18)' }]}>
                <Text style={[styles.macroPillVal, { color: '#4D8A27' }]}>{summary.totalCarbs}g</Text>
                <Text style={styles.macroPillLabel}>C</Text>
              </View>
              <View style={[styles.macroPill, { backgroundColor: 'rgba(253, 217, 34, 0.2)' }]}>
                <Text style={[styles.macroPillVal, { color: '#B39100' }]}>{summary.totalFat}g</Text>
                <Text style={styles.macroPillLabel}>F</Text>
              </View>
            </View>
          </View>
        </Card>
      </View>

      {/* Meals Sections List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.colors.saffron} />
            <Text style={styles.loadingText}>Loading diary...</Text>
          </View>
        ) : (
          MEAL_SECTIONS.map((section) => {
            const meals = mealsByType[section.type];
            const sectionCalories = meals.reduce((sum, m) => sum + m.totalCalories, 0);

            return (
              <View key={section.type} style={styles.sectionWrap}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: section.bgColor }]}>
                      <section.icon size={16} color={section.color} />
                    </View>
                    <Text style={styles.sectionTitle}>{section.label}</Text>
                  </View>
                  <View style={styles.sectionHeaderRight}>
                    <Text style={styles.sectionCals}>{sectionCalories} {energyUnit}</Text>
                    <TouchableOpacity
                      style={styles.addSmallBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/(main)/meals/add',
                          params: { mealType: section.type, date: selectedDate, from: 'log' },
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <Plus size={16} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {meals.length === 0 ? (
                  <TouchableOpacity
                    style={styles.emptyMealCard}
                    onPress={() =>
                      router.push({
                        pathname: '/(main)/meals/add',
                        params: { mealType: section.type, date: selectedDate, from: 'log' },
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emptyMealText}>No food logged. Tap to add.</Text>
                  </TouchableOpacity>
                ) : (
                  meals.map((meal) => (
                    <Card key={meal.id} variant="default" padding="md" style={styles.mealCard}>
                      <View style={styles.mealCardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mealName}>
                            {meal.name || `${section.label} Meal`}
                          </Text>
                          <Text style={styles.mealMacros}>
                            {meal.totalCalories} {energyUnit} • P: {formatFoodWeight(meal.totalProtein, foodUnit).full} • C:{' '}
                            {formatFoodWeight(meal.totalCarbs, foodUnit).full} • F: {formatFoodWeight(meal.totalFat, foodUnit).full}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteMeal(meal.id, meal.name)}
                          style={styles.deleteBtn}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={16} color="#F04B37" />
                        </TouchableOpacity>
                      </View>

                      {meal.items && meal.items.length > 0 && (
                        <View style={styles.itemsDivider}>
                          {meal.items.map((it, idx) => (
                            <View key={it.id || idx} style={styles.itemRow}>
                              <Text style={styles.itemBullet}>•</Text>
                              <Text style={styles.itemTitle}>{it.foodName}</Text>
                              <Text style={styles.itemPortion}>
                                {it.quantity || 1} {it.unit || 'serving'} ({it.calories} {energyUnit})
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </Card>
                  ))
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sleek Delete Confirmation Modal */}
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
            <Text style={styles.modalTitle}>Delete Meal?</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to delete '{mealToDelete?.name}'? This entry will be removed from your diary.
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
  headerSubtitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 11,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  headerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 24,
    color: theme.colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(19, 19, 19, 0.08)',
  },
  actionBtnAccent: {
    backgroundColor: theme.colors.saffron,
    borderColor: theme.colors.saffron,
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenMargin,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(19, 19, 19, 0.06)',
  },
  dateNavBtn: {
    padding: 6,
  },
  dateText: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  summaryContainer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: theme.spacing.md,
  },
  summaryCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryCaloriesValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 26,
    color: theme.colors.textPrimary,
  },
  summaryCaloriesLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 10,
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
  },
  macroPillsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  macroPill: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  macroPillVal: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
  },
  macroPillLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: theme.spacing.md,
    paddingBottom: 40,
  },
  sectionWrap: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionCals: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  addSmallBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(19, 19, 19, 0.08)',
  },
  emptyMealCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(19, 19, 19, 0.08)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
  },
  emptyMealText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  mealCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mealName: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  mealMacros: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
  itemsDivider: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(19, 19, 19, 0.04)',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemBullet: {
    color: theme.colors.textSecondary,
    marginRight: 6,
  },
  itemTitle: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  itemPortion: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
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
    color: '#1B281B',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: '#656A60',
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
    color: '#1B281B',
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
