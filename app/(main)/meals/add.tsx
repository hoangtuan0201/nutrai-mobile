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
  TouchableWithoutFeedback,
  BackHandler,
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
  Scan,
  Barcode,
  Mic,
  Zap,
  Check,
  Crown,
  Minus,
} from 'lucide-react-native';
import { theme } from '../../../src/constants';
import { useAppTheme } from '../../../src/hooks/useAppTheme';
import { mealsApi } from '../../../src/features/meals/api/meals.api';
import {
  MealType,
  FoodSearchResult,
  Meal,
} from '../../../src/features/meals/types';
import { useUnitStore } from '../../../src/store/unitStore';

function getFoodServingSummary(f: FoodSearchResult) {
  const servingGrams = f.defaultServingSize || 100;
  const portionLabel =
    f.servingSizeDescription ||
    (f.servingUnit && f.servingUnit !== 'g'
      ? `1 ${f.servingUnit} (${servingGrams}g)`
      : `${servingGrams}g`);

  if (f.servingCalories != null) {
    return {
      calories: Math.round(f.servingCalories),
      protein: Math.round((f.servingProtein || 0) * 10) / 10,
      carbs: Math.round((f.servingCarbs || 0) * 10) / 10,
      fat: Math.round((f.servingFat || 0) * 10) / 10,
      portionLabel,
      servingUnit: f.servingUnit || 'g',
      servingSize: servingGrams,
    };
  }

  const factor = servingGrams / 100;
  return {
    calories: Math.round(f.caloriesPer100g * factor),
    protein: Math.round(f.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(f.carbsPer100g * factor * 10) / 10,
    fat: Math.round(f.fatPer100g * factor * 10) / 10,
    portionLabel,
    servingUnit: f.servingUnit || 'g',
    servingSize: servingGrams,
  };
}

const MEAL_TABS: Array<{ type: MealType; label: string; icon: any }> = [
  { type: 'BREAKFAST', label: 'Breakfast', icon: Coffee },
  { type: 'LUNCH', label: 'Lunch', icon: UtensilsCrossed },
  { type: 'DINNER', label: 'Dinner', icon: Soup },
  { type: 'SNACK', label: 'Snacks', icon: Apple },
];

export default function AddFoodManuallyScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams<{
    mealType?: MealType;
    date?: string;
    from?: 'log' | 'home' | string;
  }>();
  const { energyUnit } = useUnitStore();

  const handleBack = useCallback(() => {
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
  }, [params.from, params.date, router]);

  // Handle hardware back button on Android
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
  const [catalogFoods, setCatalogFoods] = useState<FoodSearchResult[]>([]);
  const [loadingCatalogFoods, setLoadingCatalogFoods] = useState(true);
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);
  const [showAllRecentMeals, setShowAllRecentMeals] = useState(false);

  // Modern In-App Notification Modal State (replaces clunky Alert.alert)
  const [successModal, setSuccessModal] = useState<{
    visible: boolean;
    foodName: string;
    calories: number;
    mealType: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Meal Type Header Dropdown Modal State (Matching Image 3)
  const [isMealTypeDropdownOpen, setIsMealTypeDropdownOpen] = useState(false);

  // Portion Customizer Modal State (Allows customizing servings / amount before adding)
  const [portionModal, setPortionModal] = useState<{
    visible: boolean;
    foodId?: string;
    name: string;
    imageUrl?: string;
    servingDescription: string;
    servingUnit: string;
    baseServingSize: number;
    baseCalories: number;
    baseProtein: number;
    baseCarbs: number;
    baseFat: number;
    quantity: number;
    mealType: MealType;
  } | null>(null);
  const [savingPortion, setSavingPortion] = useState(false);

  const openPortionModal = (food: {
    foodId?: string;
    name: string;
    imageUrl?: string;
    portionDescription?: string;
    servingUnit?: string;
    servingSize?: number;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }) => {
    setPortionModal({
      visible: true,
      foodId: food.foodId,
      name: food.name,
      imageUrl: food.imageUrl,
      servingDescription: food.portionDescription || '1 serving',
      servingUnit: food.servingUnit || 'serving',
      baseServingSize: food.servingSize || 100,
      baseCalories: food.calories,
      baseProtein: food.protein || 0,
      baseCarbs: food.carbs || 0,
      baseFat: food.fat || 0,
      quantity: 1,
      mealType: selectedType,
    });
  };

  const handleSavePortionFood = async () => {
    if (!portionModal) return;
    const qty = portionModal.quantity > 0 ? portionModal.quantity : 1;
    setSavingPortion(true);
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

      const computedCalories = Math.round(portionModal.baseCalories * qty);
      const computedProtein = Math.round(portionModal.baseProtein * qty * 10) / 10;
      const computedCarbs = Math.round(portionModal.baseCarbs * qty * 10) / 10;
      const computedFat = Math.round(portionModal.baseFat * qty * 10) / 10;

      await mealsApi.createMeal({
        mealType: portionModal.mealType,
        name: portionModal.name,
        totalCalories: computedCalories,
        totalProtein: computedProtein,
        totalCarbs: computedCarbs,
        totalFat: computedFat,
        imageUrl: undefined, // Manual logs must not copy catalog food image to meal.imageUrl
        loggedDate: todayStr,
        source: 'MANUAL',
        items: [
          {
            foodId: portionModal.foodId,
            foodName: portionModal.name,
            portionDescription: `${qty} x ${portionModal.servingDescription}`,
            quantity: Math.round(portionModal.baseServingSize * qty),
            unit: portionModal.servingUnit,
            calories: computedCalories,
            protein: computedProtein,
            carbs: computedCarbs,
            fat: computedFat,
          },
        ],
      });

      const modalInfo = {
        name: portionModal.name,
        calories: computedCalories,
        mealType: portionModal.mealType,
      };

      setPortionModal(null);

      // Show success feedback
      const mealTypeName =
        modalInfo.mealType.charAt(0) + modalInfo.mealType.slice(1).toLowerCase();
      setSuccessModal({
        visible: true,
        foodName: modalInfo.name,
        calories: modalInfo.calories,
        mealType: mealTypeName,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to log food. Please try again.');
    } finally {
      setSavingPortion(false);
    }
  };

  // Quick Log Modal State (Matching Image 2)
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [quickLogCalories, setQuickLogCalories] = useState('');
  const [quickLogMealType, setQuickLogMealType] = useState<MealType>(selectedType);
  const [isQuickLogMealDropdownOpen, setIsQuickLogMealDropdownOpen] = useState(false);
  const [quickLogDescription, setQuickLogDescription] = useState('');
  const [quickLogCarbs, setQuickLogCarbs] = useState('');
  const [quickLogProtein, setQuickLogProtein] = useState('');
  const [quickLogFat, setQuickLogFat] = useState('');
  const [savingQuickLog, setSavingQuickLog] = useState(false);
  const [quickLogError, setQuickLogError] = useState<string | null>(null);

  const handleOpenQuickLog = () => {
    setQuickLogMealType(selectedType);
    setIsQuickLogMealDropdownOpen(false);
    setQuickLogError(null);
    setIsQuickLogOpen(true);
  };

  const handleSaveQuickLog = async () => {
    const cals = parseFloat(quickLogCalories);
    if (isNaN(cals) || cals <= 0) {
      setQuickLogError('Calories are required and must be greater than 0.');
      return;
    }

    setSavingQuickLog(true);
    setQuickLogError(null);

    try {
      const mealTitle =
        quickLogDescription.trim() ||
        `${quickLogMealType.charAt(0) + quickLogMealType.slice(1).toLowerCase()} Quick Log`;
      const carbs = parseFloat(quickLogCarbs) || 0;
      const protein = parseFloat(quickLogProtein) || 0;
      const fat = parseFloat(quickLogFat) || 0;

      const todayStr =
        params.date ||
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Ho_Chi_Minh',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date());

      await mealsApi.createMeal({
        mealType: quickLogMealType,
        name: mealTitle,
        totalCalories: Math.round(cals),
        totalProtein: Math.round(protein),
        totalCarbs: Math.round(carbs),
        totalFat: Math.round(fat),
        loggedDate: todayStr,
        source: 'MANUAL',
        items: [
          {
            foodName: mealTitle,
            calories: Math.round(cals),
            protein: Math.round(protein),
            carbs: Math.round(carbs),
            fat: Math.round(fat),
            quantity: 1,
            unit: 'serving',
          },
        ],
      });

      setIsQuickLogOpen(false);
      setSuccessModal({
        visible: true,
        foodName: mealTitle,
        calories: Math.round(cals),
        mealType: quickLogMealType,
      });

      // Clear quick log form
      setQuickLogCalories('');
      setQuickLogDescription('');
      setQuickLogCarbs('');
      setQuickLogProtein('');
      setQuickLogFat('');
    } catch (err: any) {
      setQuickLogError(err?.message || 'Failed to save meal. Please try again.');
    } finally {
      setSavingQuickLog(false);
    }
  };

  // Load recent meals and database food catalog on focus so Admin/DB changes appear immediately
  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadInitialData() {
        setLoadingCatalogFoods(true);
        try {
          const [mealsRes, foodsRes] = await Promise.all([
            mealsApi.getTodayMeals().catch(() => null),
            mealsApi.searchFoods('', 'local').catch(() => null),
          ]);
          if (!active) return;

          if (mealsRes?.meals) {
            setRecentMeals(mealsRes.meals.slice(0, 4));
          }
          setCatalogFoods((foodsRes?.localItems || []).slice(0, 10));
        } finally {
          if (active) setLoadingCatalogFoods(false);
        }
      }

      loadInitialData();
      return () => {
        active = false;
      };
    }, []),
  );

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

  const renderFoodResultRow = (f: FoodSearchResult, keyPrefix: string, idx: number) => {
    const serving = getFoodServingSummary(f);
    const openItemModal = () =>
      openPortionModal({
        foodId: f.id,
        name: f.name,
        imageUrl: f.imageUrl,
        portionDescription: serving.portionLabel,
        servingUnit: serving.servingUnit,
        servingSize: serving.servingSize,
        calories: serving.calories,
        protein: serving.protein,
        carbs: serving.carbs,
        fat: serving.fat,
      });

    return (
      <TouchableOpacity
        key={`${keyPrefix}-${f.id || f.name}-${idx}`}
        style={[styles.foodRow, { borderBottomColor: colors.border }]}
        activeOpacity={0.8}
        onPress={openItemModal}
      >
        {f.imageUrl ? (
          <Image source={{ uri: f.imageUrl }} style={styles.foodThumb} />
        ) : (
          <View style={[styles.foodIconPlaceholder, { backgroundColor: colors.inputBg }]}>
            <Utensils size={20} color={colors.textSecondary} />
          </View>
        )}
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
            <Text style={[styles.foodName, { color: colors.textPrimary }]} numberOfLines={1}>
              {f.name}
            </Text>
          </View>
          <View style={styles.macroDetailsRow}>
            <Text style={[styles.foodWeightCal, { color: colors.textSecondary }]}>
              {serving.portionLabel} •{' '}
              <Text style={[styles.boldCal, { color: colors.textPrimary }]}>
                {serving.calories} {energyUnit}
              </Text>
            </Text>
            <View style={styles.macroTagRow}>
              <Text style={[styles.macroTagText, { color: '#3865D6' }]}>
                P {Math.round(serving.protein)}g
              </Text>
              <Text style={styles.macroDotSep}>•</Text>
              <Text style={[styles.macroTagText, { color: '#4D8A27' }]}>
                C {Math.round(serving.carbs)}g
              </Text>
              <Text style={styles.macroDotSep}>•</Text>
              <Text style={[styles.macroTagText, { color: '#B39100' }]}>
                F {Math.round(serving.fat)}g
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: isDark ? 'rgba(46,125,50,0.2)' : '#EDF7ED' }]}
          onPress={openItemModal}
          activeOpacity={0.7}
        >
          <Plus size={14} color="#2E7D32" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      {/* ── Top Header with Meal Type Dropdown (Matching Image 3) ──── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backBtn, { backgroundColor: colors.inputBg }]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Meal Type Dropdown Trigger in Center of Header */}
        <TouchableOpacity
          style={[styles.headerDropdownBtn, { backgroundColor: colors.inputBg }]}
          activeOpacity={0.75}
          onPress={() => setIsMealTypeDropdownOpen(true)}
        >
          <Text style={[styles.headerMealTitle, { color: colors.textPrimary }]}>
            {MEAL_TABS.find((t) => t.type === selectedType)?.label || 'Lunch'}
          </Text>
          <ChevronDown size={18} color={colors.textPrimary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <View style={{ width: 36 }} />
      </View>

      {/* ── Action Shortcuts Row (Scan food & Quick Log, Matching Image 1) ──── */}
      <View style={styles.shortcutsRow}>
        {/* 1. Scan food */}
        <TouchableOpacity
          style={[styles.shortcutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: '/(main)/meals/camera',
              params: {
                from: 'add',
                originFrom: params.from || 'log',
                mealType: selectedType,
                date: params.date,
              },
            })
          }
        >
          <View style={[styles.shortcutIconWrap, { backgroundColor: isDark ? 'rgba(146,103,43,0.2)' : '#F8F3EA' }]}>
            <Scan size={20} color="#92672B" />
          </View>
          <Text style={[styles.shortcutLabel, { color: colors.textPrimary }]}>Scan food</Text>
        </TouchableOpacity>

        {/* 4. Quick Log */}
        <TouchableOpacity
          style={[styles.shortcutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.8}
          onPress={handleOpenQuickLog}
        >
          <View style={[styles.shortcutIconWrap, { backgroundColor: isDark ? 'rgba(217,119,6,0.2)' : '#FDF2E9' }]}>
            <Zap size={20} color="#D97706" />
          </View>
          <Text style={[styles.shortcutLabel, { color: colors.textPrimary }]}>Quick Log</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Food, meal or brand..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searching ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={colors.textSecondary} />
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
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Search Results</Text>
            {searchResults.length === 0 && !searching ? (
              <View style={styles.emptyWrap}>
                <Utensils size={32} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No matching food found</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  Try searching for generic terms like "chicken", "apple", or "rice"
                </Text>
              </View>
            ) : (
              searchResults.map((f, idx) => renderFoodResultRow(f, 'sr', idx))
            )}
          </View>
        ) : (
          <>
            {/* Section 1: Recent Meals */}
            {recentMeals.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Meals</Text>
                {recentMeals
                  .slice(0, showAllRecentMeals ? undefined : 2)
                  .map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.foodRow, { borderBottomColor: colors.border }]}
                      activeOpacity={0.8}
                      onPress={() =>
                        openPortionModal({
                          name: m.name || `${m.mealType} Meal`,
                          imageUrl: m.imageUrl,
                          portionDescription: '1 serving',
                          servingUnit: 'serving',
                          servingSize: 1,
                          calories: m.totalCalories,
                          protein: m.totalProtein,
                          carbs: m.totalCarbs,
                          fat: m.totalFat,
                        })
                      }
                    >
                      {m.imageUrl ? (
                        <Image
                          source={{ uri: m.imageUrl }}
                          style={styles.foodThumb}
                        />
                      ) : (
                        <View style={[styles.foodIconPlaceholder, { backgroundColor: colors.inputBg }]}>
                          <Utensils size={20} color={colors.textSecondary} />
                        </View>
                      )}
                      <View style={styles.foodInfo}>
                        <Text style={[styles.foodRecentTime, { color: colors.textSecondary }]}>
                          {m.loggedAt
                            ? new Date(m.loggedAt).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })
                            : 'Today'}
                        </Text>
                        <Text style={[styles.foodName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {m.name || `${m.mealType} Meal`}
                        </Text>
                        <View style={styles.macroDetailsRow}>
                          <Text style={[styles.boldCal, { color: colors.textPrimary }]}>
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
                        style={[styles.addBtn, { backgroundColor: isDark ? 'rgba(46,125,50,0.2)' : '#EDF7ED' }]}
                        onPress={() =>
                          openPortionModal({
                            name: m.name || `${m.mealType} Meal`,
                            imageUrl: m.imageUrl,
                            portionDescription: '1 serving',
                            servingUnit: 'serving',
                            servingSize: 1,
                            calories: m.totalCalories,
                            protein: m.totalProtein,
                            carbs: m.totalCarbs,
                            fat: m.totalFat,
                          })
                        }
                        activeOpacity={0.7}
                      >
                        <Plus size={14} color="#2E7D32" />
                        <Text style={styles.addBtnText}>Add</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}

                {recentMeals.length > 2 && (
                  <TouchableOpacity
                    style={styles.showMoreBtn}
                    onPress={() => setShowAllRecentMeals((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.showMoreText, { color: colors.textSecondary }]}>
                      {showAllRecentMeals ? 'Show Less' : 'Show More'}
                    </Text>
                    <ChevronDown size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Section 2: Database Food Catalog */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Food Database</Text>
              {loadingCatalogFoods && catalogFoods.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : catalogFoods.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Utensils size={28} color={colors.textSecondary} />
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                    No foods in catalog yet. Try searching above to find USDA items.
                  </Text>
                </View>
              ) : (
                catalogFoods.map((f, idx) => renderFoodResultRow(f, 'cat', idx))
              )}
            </View>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ── Portion Customizer Modal ───────────────────────────────── */}
      <Modal
        visible={!!portionModal?.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setPortionModal(null)}
      >
        <View style={styles.portionModalOverlay}>
          <View style={[styles.portionModalSheet, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={[styles.portionModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.portionModalTitle, { color: colors.textPrimary }]}>Customize Portion</Text>
              <TouchableOpacity
                onPress={() => setPortionModal(null)}
                style={[styles.portionCloseBtn, { backgroundColor: colors.inputBg }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {portionModal && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                {/* Food summary card */}
                <View style={[styles.portionFoodCard, { backgroundColor: colors.inputBg }]}>
                  {portionModal.imageUrl ? (
                    <Image
                      source={{ uri: portionModal.imageUrl }}
                      style={styles.portionFoodThumb}
                    />
                  ) : (
                    <View style={[styles.portionIconPlaceholder, { backgroundColor: colors.surface }]}>
                      <Utensils size={24} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.portionFoodInfo}>
                    <Text style={[styles.portionFoodName, { color: colors.textPrimary }]} numberOfLines={2}>
                      {portionModal.name}
                    </Text>
                    <Text style={[styles.portionFoodServing, { color: colors.textSecondary }]}>
                      Standard: {portionModal.servingDescription}
                    </Text>
                  </View>
                </View>

                {/* Serving stepper / quantity control */}
                <View style={[styles.portionQuantityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.portionQuantityLabel, { color: colors.textPrimary }]}>Number of Servings</Text>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      style={[styles.stepperBtn, { backgroundColor: colors.inputBg }]}
                      activeOpacity={0.7}
                      onPress={() => {
                        const newQ = Math.max(0.5, Math.round((portionModal.quantity - 0.5) * 10) / 10);
                        setPortionModal({ ...portionModal, quantity: newQ });
                      }}
                    >
                      <Minus size={18} color={colors.textPrimary} />
                    </TouchableOpacity>

                    <TextInput
                      style={[styles.stepperInput, { color: colors.textPrimary, borderBottomColor: colors.primary }]}
                      keyboardType="numeric"
                      value={String(portionModal.quantity)}
                      onChangeText={(txt) => {
                        const parsed = parseFloat(txt.replace(',', '.'));
                        if (!isNaN(parsed) && parsed > 0) {
                          setPortionModal({ ...portionModal, quantity: parsed });
                        } else if (txt === '') {
                          setPortionModal({ ...portionModal, quantity: 0 });
                        }
                      }}
                    />

                    <TouchableOpacity
                      style={[styles.stepperBtn, { backgroundColor: colors.inputBg }]}
                      activeOpacity={0.7}
                      onPress={() => {
                        const newQ = Math.round((portionModal.quantity + 0.5) * 10) / 10;
                        setPortionModal({ ...portionModal, quantity: newQ });
                      }}
                    >
                      <Plus size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  {/* Quick quantity chips */}
                  <View style={styles.portionChipsRow}>
                    {[0.5, 1, 1.5, 2, 3].map((val) => (
                      <TouchableOpacity
                        key={val}
                        style={[
                          styles.portionChip,
                          {
                            backgroundColor:
                              portionModal.quantity === val ? colors.primary : colors.inputBg,
                          },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => setPortionModal({ ...portionModal, quantity: val })}
                      >
                        <Text
                          style={[
                            styles.portionChipText,
                            {
                              color:
                                portionModal.quantity === val ? '#FFFFFF' : colors.textSecondary,
                            },
                          ]}
                        >
                          {val}x
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Nutrition summary for this quantity */}
                <View style={[styles.portionMacroCard, { backgroundColor: colors.inputBg }]}>
                  <Text style={[styles.portionMacroTitle, { color: colors.textSecondary }]}>Nutritional Content</Text>
                  <View style={styles.portionMacroGrid}>
                    <View style={styles.portionMacroCol}>
                      <Text style={[styles.portionMacroCalVal, { color: colors.textPrimary }]}>
                        {Math.round(portionModal.baseCalories * (portionModal.quantity || 1))}
                      </Text>
                      <Text style={[styles.portionMacroCalLabel, { color: colors.textSecondary }]}>{energyUnit}</Text>
                    </View>
                    <View style={[styles.portionMacroDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.portionMacroCol}>
                      <Text style={[styles.portionMacroVal, { color: '#3865D6' }]}>
                        {Math.round(portionModal.baseProtein * (portionModal.quantity || 1) * 10) / 10}g
                      </Text>
                      <Text style={[styles.portionMacroLabel, { color: colors.textSecondary }]}>Protein</Text>
                    </View>
                    <View style={[styles.portionMacroDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.portionMacroCol}>
                      <Text style={[styles.portionMacroVal, { color: '#4D8A27' }]}>
                        {Math.round(portionModal.baseCarbs * (portionModal.quantity || 1) * 10) / 10}g
                      </Text>
                      <Text style={[styles.portionMacroLabel, { color: colors.textSecondary }]}>Carbs</Text>
                    </View>
                    <View style={[styles.portionMacroDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.portionMacroCol}>
                      <Text style={[styles.portionMacroVal, { color: '#B39100' }]}>
                        {Math.round(portionModal.baseFat * (portionModal.quantity || 1) * 10) / 10}g
                      </Text>
                      <Text style={[styles.portionMacroLabel, { color: colors.textSecondary }]}>Fat</Text>
                    </View>
                  </View>
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  style={[styles.portionSubmitBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                  disabled={savingPortion}
                  onPress={handleSavePortionFood}
                >
                  {savingPortion ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.portionSubmitText}>
                        Log Food (
                        {Math.round(
                          portionModal.baseCalories * (portionModal.quantity || 1),
                        )}{' '}
                        {energyUnit})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Modern Sleek In-App Success Modal (Replaces Native Alert) ──── */}
      <Modal
        visible={!!successModal?.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalIconWrap}>
              <CheckCircle2 size={30} color={colors.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Added to {successModal?.mealType}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              <Text style={[styles.modalFoodHighlight, { color: colors.textPrimary }]}>
                {successModal?.foodName}
              </Text>{' '}
              ({successModal?.calories} {energyUnit}) added to your diary.
            </Text>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalSecondaryBtn, { backgroundColor: colors.inputBg }]}
                onPress={() => setSuccessModal(null)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalSecondaryText, { color: colors.textPrimary }]}>Add More</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { backgroundColor: colors.primary }]}
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

      {/* ── Meal Type Dropdown Modal ───────────────────────────────── */}
      <Modal
        visible={isMealTypeDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMealTypeDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.dropdownModalOverlay}
          activeOpacity={1}
          onPress={() => setIsMealTypeDropdownOpen(false)}
        >
          <View style={[styles.dropdownModalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.dropdownModalTitle, { color: colors.textPrimary }]}>Select Meal</Text>
            {MEAL_TABS.map((tab) => {
              const IconComp = tab.icon;
              const isSelected = selectedType === tab.type;
              return (
                <TouchableOpacity
                  key={tab.type}
                  style={[
                    styles.dropdownOptionRow,
                    isSelected && styles.dropdownOptionRowActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedType(tab.type);
                    setIsMealTypeDropdownOpen(false);
                  }}
                >
                  <View style={styles.dropdownOptionLeft}>
                    <View
                      style={[
                        styles.dropdownIconWrap,
                        {
                          backgroundColor: isSelected
                            ? 'rgba(255, 145, 20, 0.15)'
                            : colors.inputBg,
                        },
                      ]}
                    >
                      <IconComp
                        size={16}
                        color={isSelected ? '#FF9114' : colors.textPrimary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        { color: colors.textPrimary },
                        isSelected && styles.dropdownOptionTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </View>
                  {isSelected && <Check size={18} color="#FF9114" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Quick Log Modal (Matching Image 2) ────────────────────── */}
      <Modal
        visible={isQuickLogOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsQuickLogOpen(false)}
      >
        <SafeAreaView style={[styles.quickLogContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
          {/* Header */}
          <View style={[styles.quickLogHeader, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              onPress={() => {
                setIsQuickLogMealDropdownOpen(false);
                setIsQuickLogOpen(false);
              }}
              style={[styles.quickLogBackBtn, { backgroundColor: colors.inputBg }]}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.quickLogHeaderTitle, { color: colors.textPrimary }]}>Quick Log</Text>
            <TouchableOpacity
              onPress={() => {
                setIsQuickLogMealDropdownOpen(false);
                handleSaveQuickLog();
              }}
              disabled={savingQuickLog}
              activeOpacity={0.8}
            >
              {savingQuickLog ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <Text style={styles.quickLogSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.quickLogScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => setIsQuickLogMealDropdownOpen(false)}
          >
            <TouchableWithoutFeedback
              onPress={() => setIsQuickLogMealDropdownOpen(false)}
              accessible={false}
            >
              <View>
                {/* Inline Error if any */}
                {quickLogError && (
                  <View style={styles.quickLogErrorBanner}>
                    <Text style={styles.quickLogErrorText}>{quickLogError}</Text>
                  </View>
                )}

                {/* Block 1: Log Calories */}
                <View
                  style={[
                    styles.quickLogCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      zIndex: 50,
                      elevation: isQuickLogMealDropdownOpen ? 15 : 2,
                    },
                  ]}
                >
                  <Text style={[styles.quickLogCardHeader, { color: colors.textPrimary }]}>Log Calories</Text>

                  {/* Row 1: Calories * */}
                  <View style={styles.quickLogRow}>
                    <Text style={[styles.quickLogLabel, { color: colors.textPrimary }]}>
                      Calories <Text style={{ color: '#E11D48' }}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.quickLogInput, { color: colors.textPrimary }]}
                      placeholder="Required"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      value={quickLogCalories}
                      onChangeText={setQuickLogCalories}
                      onFocus={() => setIsQuickLogMealDropdownOpen(false)}
                      autoFocus
                    />
                  </View>

                  <View style={[styles.quickLogDivider, { backgroundColor: colors.border }]} />

                  {/* Row 2: Meal * */}
                  <View style={[styles.quickLogRow, { zIndex: 100 }]}>
                    <Text style={[styles.quickLogLabel, { color: colors.textPrimary }]}>
                      Meal <Text style={{ color: '#E11D48' }}>*</Text>
                    </Text>
                    <View style={styles.quickLogMealSelectorContainer}>
                      <TouchableOpacity
                        style={styles.quickLogMealSelector}
                        activeOpacity={0.7}
                        onPress={() => setIsQuickLogMealDropdownOpen((prev) => !prev)}
                      >
                        <Text style={styles.quickLogMealValue}>
                          {MEAL_TABS.find((t) => t.type === quickLogMealType)?.label || 'Lunch'}
                        </Text>
                        <ChevronDown
                          size={14}
                          color="#2563EB"
                          style={{
                            marginLeft: 4,
                            transform: [
                              { rotate: isQuickLogMealDropdownOpen ? '180deg' : '0deg' },
                            ],
                          }}
                        />
                      </TouchableOpacity>

                      {/* Dropdown Menu Popover right below Meal label */}
                      {isQuickLogMealDropdownOpen && (
                        <View style={[styles.quickLogDropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          {MEAL_TABS.map((tab) => {
                            const isSelected = quickLogMealType === tab.type;
                            return (
                              <TouchableOpacity
                                key={tab.type}
                                style={[
                                  styles.quickLogDropdownItem,
                                  isSelected && (isDark ? { backgroundColor: 'rgba(37,99,235,0.2)' } : styles.quickLogDropdownItemActive),
                                ]}
                                activeOpacity={0.7}
                                onPress={() => {
                                  setQuickLogMealType(tab.type);
                                  setIsQuickLogMealDropdownOpen(false);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.quickLogDropdownItemText,
                                    { color: colors.textPrimary },
                                    isSelected && styles.quickLogDropdownItemTextActive,
                                  ]}
                                >
                                  {tab.label}
                                </Text>
                                {isSelected && (
                                  <Check size={14} color="#2563EB" strokeWidth={2.5} />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={[styles.quickLogDivider, { backgroundColor: colors.border }]} />

                  {/* Row 3: Description */}
                  <View style={styles.quickLogRow}>
                    <Text style={[styles.quickLogLabel, { color: colors.textPrimary }]}>Description</Text>
                    <TextInput
                      style={[styles.quickLogInput, { color: colors.textPrimary }]}
                      placeholder="What is it?"
                      placeholderTextColor={colors.textSecondary}
                      value={quickLogDescription}
                      onChangeText={setQuickLogDescription}
                      onFocus={() => setIsQuickLogMealDropdownOpen(false)}
                    />
                  </View>
                </View>

                {/* Block 2: Nutrition Facts */}
                <View style={[styles.quickLogCard, { backgroundColor: colors.surface, borderColor: colors.border, zIndex: 1, elevation: 2 }]}>
                  <Text style={[styles.quickLogCardHeader, { color: colors.textPrimary }]}>Nutrition Facts</Text>

                  {/* Row 1: Carb (g) */}
                  <View style={styles.quickLogRow}>
                    <View style={styles.quickLogLabelWithIcon}>
                      <Text style={[styles.quickLogLabel, { color: colors.textPrimary }]}>Carb (g)</Text>
                    </View>
                    <TextInput
                      style={[styles.quickLogInput, { color: colors.textPrimary }]}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      value={quickLogCarbs}
                      onChangeText={setQuickLogCarbs}
                      onFocus={() => setIsQuickLogMealDropdownOpen(false)}
                    />
                  </View>

                  <View style={[styles.quickLogDivider, { backgroundColor: colors.border }]} />

                  {/* Row 2: Protein (g) */}
                  <View style={styles.quickLogRow}>
                    <View style={styles.quickLogLabelWithIcon}>
                      <Text style={[styles.quickLogLabel, { color: colors.textPrimary }]}>Protein (g)</Text>
                    </View>
                    <TextInput
                      style={[styles.quickLogInput, { color: colors.textPrimary }]}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      value={quickLogProtein}
                      onChangeText={setQuickLogProtein}
                      onFocus={() => setIsQuickLogMealDropdownOpen(false)}
                    />
                  </View>

                  <View style={[styles.quickLogDivider, { backgroundColor: colors.border }]} />

                  {/* Row 3: Fat (g) */}
                  <View style={styles.quickLogRow}>
                    <View style={styles.quickLogLabelWithIcon}>
                      <Text style={[styles.quickLogLabel, { color: colors.textPrimary }]}>Fat (g)</Text>
                    </View>
                    <TextInput
                      style={[styles.quickLogInput, { color: colors.textPrimary }]}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      value={quickLogFat}
                      onChangeText={setQuickLogFat}
                      onFocus={() => setIsQuickLogMealDropdownOpen(false)}
                    />
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </SafeAreaView>
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
  // ── Header Dropdown Styles
  headerDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F6F5EE',
  },
  headerMealTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#1B281B',
  },
  // ── Action Shortcuts Row (Matching Image 1)
  shortcutsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  shortcutCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9F8F3',
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ECEAE1',
  },
  shortcutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  shortcutLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 11,
    color: '#1B281B',
    textAlign: 'center',
  },
  // ── Meal Type Dropdown Modal Styles
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dropdownModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  dropdownModalTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#1B281B',
    marginBottom: 14,
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  dropdownOptionRowActive: {
    backgroundColor: 'rgba(255, 145, 20, 0.08)',
  },
  dropdownOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownOptionText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: '#1B281B',
  },
  dropdownOptionTextActive: {
    fontFamily: theme.fonts.bold,
    color: '#FF9114',
  },
  // ── Quick Log Screen Styles (Matching Image 2)
  quickLogContainer: {
    flex: 1,
    backgroundColor: '#F6F5EE',
  },
  quickLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F6F5EE',
  },
  quickLogBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(27, 40, 27, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLogHeaderTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#1B281B',
  },
  quickLogSaveText: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickLogScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  quickLogErrorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  quickLogErrorText: {
    color: '#DC2626',
    fontSize: 13,
    fontFamily: theme.fonts.medium,
  },
  quickLogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFECE2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  quickLogCardHeader: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: '#1B281B',
    marginBottom: 12,
  },
  quickLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  quickLogLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: '#1B281B',
  },
  quickLogLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickLogInput: {
    flex: 1,
    textAlign: 'right',
    fontFamily: theme.fonts.medium,
    fontSize: 15,
    color: '#1B281B',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  quickLogDivider: {
    height: 1,
    backgroundColor: '#F4F2E9',
    marginVertical: 4,
  },
  quickLogMealSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  quickLogMealValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: '#2563EB',
  },
  quickLogMealSelectorContainer: {
    position: 'relative',
    zIndex: 100,
  },
  quickLogDropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 6,
    minWidth: 135,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#EFECE2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 1000,
  },
  quickLogDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginHorizontal: 4,
    marginVertical: 1,
  },
  quickLogDropdownItemActive: {
    backgroundColor: '#EFF6FF',
  },
  quickLogDropdownItemText: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: '#374151',
  },
  quickLogDropdownItemTextActive: {
    fontFamily: theme.fonts.bold,
    color: '#2563EB',
  },
  // ── Portion Customizer Modal Styles ─────────────────────────
  portionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  portionModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  portionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
  },
  portionModalTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#1B281B',
  },
  portionCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(27, 40, 27, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionFoodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F5',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    marginBottom: 16,
  },
  portionFoodThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  portionIconPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#EAE8DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionFoodInfo: {
    flex: 1,
    marginLeft: 14,
  },
  portionFoodName: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: '#1B281B',
    marginBottom: 4,
  },
  portionFoodServing: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: '#656A60',
  },
  portionQuantityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECEAE1',
    padding: 16,
    marginBottom: 16,
  },
  portionQuantityLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: '#1B281B',
    marginBottom: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F2EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperInput: {
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    color: '#1B281B',
    textAlign: 'center',
    minWidth: 80,
    marginHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: '#2E7D32',
  },
  portionChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  portionChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F6F5EE',
  },
  portionChipActive: {
    backgroundColor: '#2E7D32',
  },
  portionChipText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: '#656A60',
  },
  portionChipTextActive: {
    fontFamily: theme.fonts.bold,
    color: '#FFFFFF',
  },
  portionSection: {
    marginBottom: 16,
  },
  portionSectionLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: '#1B281B',
    marginBottom: 10,
  },
  portionMealTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  portionMealTypeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F6F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionMealTypeChipActive: {
    backgroundColor: '#1B281B',
  },
  portionMealTypeChipText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#656A60',
  },
  portionMealTypeChipTextActive: {
    fontFamily: theme.fonts.bold,
    color: '#FFFFFF',
  },
  portionMacroCard: {
    backgroundColor: '#F8F7F2',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  portionMacroTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
    color: '#656A60',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  portionMacroGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  portionMacroCol: {
    flex: 1,
    alignItems: 'center',
  },
  portionMacroDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E8E5DA',
  },
  portionMacroCalVal: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#1B281B',
  },
  portionMacroCalLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: '#8E9388',
    marginTop: 2,
  },
  portionMacroVal: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
  },
  portionMacroLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: '#8E9388',
    marginTop: 2,
  },
  portionSubmitBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  portionSubmitText: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
