import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Search,
  Plus,
  CheckCircle2,
  ChevronDown,
  Globe,
  Database,
  X,
  Utensils,
  ArrowRight,
  Coffee,
  UtensilsCrossed,
  Soup,
  Apple,
} from 'lucide-react-native';
import { theme } from '../../../src/constants';
import { mealsApi } from '../../../src/features/meals/api/meals.api';
import {
  MealType,
  FoodSearchResult,
  Meal,
} from '../../../src/features/meals/types';
import { useUnitStore } from '../../../src/store/unitStore';

interface PopularFood {
  name: string;
  calories: number;
  portion: string;
  p: number;
  c: number;
  f: number;
  imageUrl: string;
}

const POPULAR_DEFAULT_FOODS: PopularFood[] = [
  {
    name: 'Cookie',
    calories: 295,
    portion: '1 whole cookie (25gr)',
    p: 3,
    c: 38,
    f: 14,
    imageUrl:
      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Red Apple',
    calories: 95,
    portion: '1 medium apple (182g)',
    p: 0.5,
    c: 25,
    f: 0.3,
    imageUrl:
      'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Almonds',
    calories: 160,
    portion: '1 serving (28g)',
    p: 6,
    c: 6,
    f: 14,
    imageUrl:
      'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Chocolate Muffin',
    calories: 380,
    portion: '1 muffin (115g)',
    p: 5,
    c: 48,
    f: 19,
    imageUrl:
      'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Grilled Chicken Breast',
    calories: 165,
    portion: '1 fillet (100g)',
    p: 31,
    c: 0,
    f: 3.6,
    imageUrl:
      'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Steamed Rice',
    calories: 130,
    portion: '1 cup cooked (100g)',
    p: 2.7,
    c: 28,
    f: 0.3,
    imageUrl:
      'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=200&auto=format&fit=crop&q=80',
  },
];

const MEAL_TABS: Array<{ type: MealType; label: string; icon: any }> = [
  { type: 'BREAKFAST', label: 'Breakfast', icon: Coffee },
  { type: 'LUNCH', label: 'Lunch', icon: UtensilsCrossed },
  { type: 'DINNER', label: 'Dinner', icon: Soup },
  { type: 'SNACK', label: 'Snacks', icon: Apple },
];

export default function AddFoodManuallyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mealType?: MealType;
    date?: string;
    from?: 'log' | 'home' | string;
  }>();
  const { energyUnit } = useUnitStore();

  const handleBack = () => {
    if (params.from === 'log') {
      router.replace({
        pathname: '/(main)/meals',
        params: params.date ? { date: params.date } : undefined,
      });
      return;
    }
    if (params.from === 'home') {
      router.replace('/(main)');
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/meals');
    }
  };

  const [selectedType, setSelectedType] = useState<MealType>(
    params.mealType || 'LUNCH',
  );

  // Automatically select tab matching the meal type passed from Log screen (Breakfast, Lunch, Dinner, Snacks)
  useEffect(() => {
    if (params.mealType) {
      setSelectedType(params.mealType);
    }
  }, [params.mealType]);

  useFocusEffect(
    useCallback(() => {
      if (params.mealType) {
        setSelectedType(params.mealType);
      }
    }, [params.mealType])
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);
  const [showAllRecentMeals, setShowAllRecentMeals] = useState(false);
  const [addingFoodName, setAddingFoodName] = useState<string | null>(null);

  // Modern In-App Notification Modal State (replaces clunky Alert.alert)
  const [successModal, setSuccessModal] = useState<{
    visible: boolean;
    foodName: string;
    calories: number;
    mealType: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load recent meals for today
  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await mealsApi.getTodayMeals();
        if (res.meals && res.meals.length > 0) {
          setRecentMeals(res.meals.slice(0, 4));
        }
      } catch {
        // Fallback silently
      }
    }
    loadRecent();
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await mealsApi.searchFoods(searchQuery.trim(), 'all');
        const combined = [...(res.localItems || []), ...(res.usdaItems || [])];

        // Client deduplication by normalized name
        const seen = new Set<string>();
        const unique = combined.filter((f) => {
          const key = f.name.trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setSearchResults(unique);
      } catch (err: any) {
        console.warn('Food search error:', err?.message);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const quickLogFood = async (item: {
    name: string;
    calories: number;
    portion?: string;
    protein?: number;
    carbs?: number;
    fat?: number;
  }) => {
    setAddingFoodName(item.name);
    setErrorMessage(null);

    try {
      const todayStr =
        params.date ||
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Ho_Chi_Minh',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date());

      await mealsApi.createMeal({
        mealType: selectedType,
        name: item.name,
        totalCalories: Math.round(item.calories),
        totalProtein: Math.round((item.protein || 0) * 10) / 10,
        totalCarbs: Math.round((item.carbs || 0) * 10) / 10,
        totalFat: Math.round((item.fat || 0) * 10) / 10,
        loggedDate: todayStr,
        items: [
          {
            foodName: item.name,
            portionDescription: item.portion || '1 serving',
            quantity: 100,
            unit: 'serving',
            calories: Math.round(item.calories),
            protein: Math.round((item.protein || 0) * 10) / 10,
            carbs: Math.round((item.carbs || 0) * 10) / 10,
            fat: Math.round((item.fat || 0) * 10) / 10,
          },
        ],
      });

      // Show modern sleek in-app feedback dialog
      const mealTypeName =
        selectedType.charAt(0) + selectedType.slice(1).toLowerCase();

      setSuccessModal({
        visible: true,
        foodName: item.name,
        calories: Math.round(item.calories),
        mealType: mealTypeName,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to log food. Please try again.');
    } finally {
      setAddingFoodName(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Pull Indicator Handle */}
      <View style={styles.pullHandleWrap}>
        <View style={styles.pullHandle} />
      </View>

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#1B281B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Food Manually</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Meal Type Pill Selector */}
      <View style={styles.typeSelectorRow}>
        {MEAL_TABS.map((tab) => {
          const IconComp = tab.icon;
          const isActive = selectedType === tab.type;
          return (
            <TouchableOpacity
              key={tab.type}
              style={[
                styles.typeTab,
                isActive && styles.typeTabActive,
              ]}
              onPress={() => setSelectedType(tab.type)}
              activeOpacity={0.8}
            >
              <IconComp
                size={14}
                color={isActive ? '#FFFFFF' : '#656A60'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.typeTabText,
                  isActive && styles.typeTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search Input Box */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={18} color="#8E9388" />
          <TextInput
            style={styles.searchInput}
            placeholder="Food, meal or brand..."
            placeholderTextColor="#999E94"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searching ? (
            <ActivityIndicator size="small" color="#2E7D32" />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color="#8E9388" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Inline Error Banner if any */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={() => setErrorMessage(null)}>
            <X size={14} color="#B91C1C" />
          </TouchableOpacity>
        </View>
      )}

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Dynamic Search Results Mode */}
        {searchQuery.trim().length >= 2 ? (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {searchResults.length === 0 && !searching ? (
              <View style={styles.emptyWrap}>
                <Utensils size={32} color="#C4C8BE" />
                <Text style={styles.emptyTitle}>No matching food found</Text>
                <Text style={styles.emptySub}>
                  Try searching for generic terms like "chicken", "apple", or "rice"
                </Text>
              </View>
            ) : (
              searchResults.map((f, idx) => (
                <View key={`sr-${f.id || f.name}-${idx}`} style={styles.foodRow}>
                  <View style={styles.foodIconPlaceholder}>
                    <Utensils size={20} color="#656A60" />
                  </View>
                  <View style={styles.foodInfo}>
                    <View style={styles.badgeRow}>
                      {f.source === 'USDA' ? (
                        <View style={styles.usdaBadge}>
                          <Globe size={10} color="#0B4E8C" />
                          <Text style={styles.usdaBadgeText}>USDA</Text>
                        </View>
                      ) : (
                        <View style={styles.localBadge}>
                          <Database size={10} color="#1E6B20" />
                          <Text style={styles.localBadgeText}>VERIFIED</Text>
                        </View>
                      )}
                      <Text style={styles.foodName} numberOfLines={1}>
                        {f.name}
                      </Text>
                    </View>
                    <View style={styles.macroDetailsRow}>
                      <Text style={styles.foodWeightCal}>
                        {f.defaultServingSize || 100}{f.servingUnit || 'g'} •{' '}
                        <Text style={styles.boldCal}>
                          {Math.round(f.caloriesPer100g)} {energyUnit}
                        </Text>
                      </Text>
                      <View style={styles.macroTagRow}>
                        <Text style={[styles.macroTagText, { color: '#3865D6' }]}>
                          P {Math.round(f.proteinPer100g)}g
                        </Text>
                        <Text style={styles.macroDotSep}>•</Text>
                        <Text style={[styles.macroTagText, { color: '#4D8A27' }]}>
                          C {Math.round(f.carbsPer100g)}g
                        </Text>
                        <Text style={styles.macroDotSep}>•</Text>
                        <Text style={[styles.macroTagText, { color: '#B39100' }]}>
                          F {Math.round(f.fatPer100g)}g
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() =>
                      quickLogFood({
                        name: f.name,
                        calories: f.caloriesPer100g,
                        portion: `${f.defaultServingSize || 100}${f.servingUnit || 'g'}`,
                        protein: f.proteinPer100g,
                        carbs: f.carbsPer100g,
                        fat: f.fatPer100g,
                      })
                    }
                    disabled={addingFoodName === f.name}
                    activeOpacity={0.7}
                  >
                    {addingFoodName === f.name ? (
                      <ActivityIndicator size="small" color="#2E7D32" />
                    ) : (
                      <>
                        <Plus size={14} color="#2E7D32" />
                        <Text style={styles.addBtnText}>Add</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : (
          <>
            {/* Section 1: Recent Meals */}
            {recentMeals.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Recent Meals</Text>
                {recentMeals
                  .slice(0, showAllRecentMeals ? undefined : 2)
                  .map((m) => (
                    <View key={m.id} style={styles.foodRow}>
                      <Image
                        source={{
                          uri:
                            m.imageUrl ||
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80',
                        }}
                        style={styles.foodThumb}
                      />
                      <View style={styles.foodInfo}>
                        <Text style={styles.foodRecentTime}>
                          {m.loggedAt
                            ? new Date(m.loggedAt).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })
                            : 'Today'}
                        </Text>
                        <Text style={styles.foodName} numberOfLines={1}>
                          {m.name || `${m.mealType} Meal`}
                        </Text>
                        <View style={styles.macroDetailsRow}>
                          <Text style={styles.boldCal}>
                            {Math.round(m.totalCalories)} {energyUnit}
                          </Text>
                          <View style={styles.macroTagRow}>
                            <Text style={[styles.macroTagText, { color: '#3865D6' }]}>
                              P {Math.round(m.totalProtein)}g
                            </Text>
                            <Text style={styles.macroDotSep}>•</Text>
                            <Text style={[styles.macroTagText, { color: '#4D8A27' }]}>
                              C {Math.round(m.totalCarbs)}g
                            </Text>
                            <Text style={styles.macroDotSep}>•</Text>
                            <Text style={[styles.macroTagText, { color: '#B39100' }]}>
                              F {Math.round(m.totalFat)}g
                            </Text>
                          </View>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() =>
                          quickLogFood({
                            name: m.name || `${m.mealType} Meal`,
                            calories: m.totalCalories,
                            protein: m.totalProtein,
                            carbs: m.totalCarbs,
                            fat: m.totalFat,
                          })
                        }
                        disabled={addingFoodName === (m.name || `${m.mealType} Meal`)}
                        activeOpacity={0.7}
                      >
                        {addingFoodName === (m.name || `${m.mealType} Meal`) ? (
                          <ActivityIndicator size="small" color="#2E7D32" />
                        ) : (
                          <>
                            <Plus size={14} color="#2E7D32" />
                            <Text style={styles.addBtnText}>Add</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  ))}

                {recentMeals.length > 2 && (
                  <TouchableOpacity
                    style={styles.showMoreBtn}
                    onPress={() => setShowAllRecentMeals((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.showMoreText}>
                      {showAllRecentMeals ? 'Show Less' : 'Show More'}
                    </Text>
                    <ChevronDown size={14} color="#656A60" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Section 2: Recent Foods */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Recent Foods</Text>
              {POPULAR_DEFAULT_FOODS.map((food, idx) => (
                <View key={idx} style={styles.foodRow}>
                  <Image source={{ uri: food.imageUrl }} style={styles.foodThumb} />
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <View style={styles.macroDetailsRow}>
                      <Text style={styles.foodWeightCal}>
                        {food.portion} •{' '}
                        <Text style={styles.boldCal}>{food.calories} {energyUnit}</Text>
                      </Text>
                      <View style={styles.macroTagRow}>
                        <Text style={[styles.macroTagText, { color: '#3865D6' }]}>
                          P {food.p}g
                        </Text>
                        <Text style={styles.macroDotSep}>•</Text>
                        <Text style={[styles.macroTagText, { color: '#4D8A27' }]}>
                          C {food.c}g
                        </Text>
                        <Text style={styles.macroDotSep}>•</Text>
                        <Text style={[styles.macroTagText, { color: '#B39100' }]}>
                          F {food.f}g
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() =>
                      quickLogFood({
                        name: food.name,
                        calories: food.calories,
                        portion: food.portion,
                        protein: food.p,
                        carbs: food.c,
                        fat: food.f,
                      })
                    }
                    disabled={addingFoodName === food.name}
                    activeOpacity={0.7}
                  >
                    {addingFoodName === food.name ? (
                      <ActivityIndicator size="small" color="#2E7D32" />
                    ) : (
                      <>
                        <Plus size={14} color="#2E7D32" />
                        <Text style={styles.addBtnText}>Add</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ── Modern Sleek In-App Success Modal (Replaces Native Alert) ──── */}
      <Modal
        visible={!!successModal?.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <CheckCircle2 size={30} color="#2E7D32" />
            </View>

            <Text style={styles.modalTitle}>
              Added to {successModal?.mealType}
            </Text>
            <Text style={styles.modalSubtitle}>
              <Text style={styles.modalFoodHighlight}>
                {successModal?.foodName}
              </Text>{' '}
              ({successModal?.calories} {energyUnit}) added to your diary.
            </Text>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => setSuccessModal(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSecondaryText}>Add More</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setSuccessModal(null);
                  const targetDate =
                    params.date ||
                    new Intl.DateTimeFormat('en-CA', {
                      timeZone: 'Asia/Ho_Chi_Minh',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    }).format(new Date());
                  router.replace({
                    pathname: '/(main)/meals',
                    params: { date: targetDate },
                  });
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimaryText}>View Diary</Text>
                <ArrowRight size={15} color="#FFFFFF" />
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
    backgroundColor: '#FFFFFF',
  },
  pullHandleWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
  },
  pullHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DFDDD5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#1B281B',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F6F5EE',
  },
  typeTabActive: {
    backgroundColor: '#1E3120',
  },
  typeTabText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#656A60',
  },
  typeTabTextActive: {
    fontFamily: theme.fonts.bold,
    color: '#FFFFFF',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F6F1',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    borderWidth: 1,
    borderColor: '#ECEAE1',
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: '#1B281B',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#B91C1C',
    fontFamily: theme.fonts.medium,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: '#1B281B',
    marginBottom: 10,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F3EC',
  },
  foodThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F0EFEA',
  },
  foodIconPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F6F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  foodRecentTime: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: '#8A8F85',
    marginBottom: 2,
  },
  foodName: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#1B281B',
  },
  foodCaloriesText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
    color: '#656A60',
    marginTop: 2,
  },
  foodPortionText: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: '#8A8F85',
    marginTop: 2,
  },
  macroDetailsRow: {
    marginTop: 3,
    gap: 2,
  },
  foodWeightCal: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#656A60',
  },
  boldCal: {
    fontFamily: theme.fonts.bold,
    color: '#1B281B',
  },
  macroTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  macroTagText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 11,
  },
  macroDotSep: {
    fontSize: 9,
    color: '#C4C8BE',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  localBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  localBadgeText: {
    fontFamily: theme.fonts.bold,
    fontSize: 8,
    color: '#1E6B20',
  },
  usdaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#E1F0FA',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  usdaBadgeText: {
    fontFamily: theme.fonts.bold,
    fontSize: 8,
    color: '#0B4E8C',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#EDF7ED',
  },
  addBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: '#2E7D32',
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
    marginTop: 4,
  },
  showMoreText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
    color: '#656A60',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: '#1B281B',
  },
  emptySub: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: '#8A8F85',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // ── Modern Feedback Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#1B281B',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: '#656A60',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  modalFoodHighlight: {
    fontFamily: theme.fonts.bold,
    color: '#1B281B',
  },
  modalButtonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F6F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: '#1B281B',
  },
  modalPrimaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalPrimaryText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
