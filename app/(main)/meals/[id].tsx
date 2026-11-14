import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  StatusBar,
  Platform,
  BackHandler,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Trash2,
  Edit3,
  Clock,
  Sparkles,
  Plus,
  Minus,
  Check,
  X,
  Flame,
  Utensils,
  AlertCircle,
} from 'lucide-react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { theme } from '../../../src/constants';
import { useAppTheme } from '../../../src/hooks/useAppTheme';
import { mealsApi } from '../../../src/features/meals/api/meals.api';
import { Meal, MealItem, MealType } from '../../../src/features/meals/types';
import { useUnitStore, formatFoodWeight } from '../../../src/store/unitStore';

// ── Custom Meal Type Icons ──────────────────────────────────────────────────
const MealSectionIcon: React.FC<{ type: MealType; size?: number; color?: string }> = ({
  type,
  size = 20,
  color = theme.colors.saffron,
}) => {
  switch (type) {
    case 'BREAKFAST':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M8.5 3.5V5.5M12.5 3V5.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Path d="M4.5 7.5H16.5V12C16.5 15.0376 14.0376 17.5 11 17.5H10C6.96243 17.5 4.5 15.0376 4.5 12V7.5Z" fill={color} />
          <Path d="M16.5 8.5H18C19.3807 8.5 20.5 9.61929 20.5 11C20.5 12.3807 19.3807 13.5 18 13.5H16.5" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M3.5 19.5H17.5" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
        </Svg>
      );
    case 'LUNCH':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M9 3.5V6M12 3V6M15 3.5V6" stroke={color} strokeWidth={2} strokeLinecap="round" />
          <Path d="M3.5 9H20.5" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
          <Path d="M5.5 9H18.5V14.5C18.5 17.2614 16.2614 19.5 13.5 19.5H10.5C7.73858 19.5 5.5 17.2614 5.5 14.5V9Z" fill={color} />
        </Svg>
      );
    case 'DINNER':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={6} r={1.8} fill={color} />
          <Path d="M4.5 16C4.5 11.8579 7.85786 8.5 12 8.5C16.1421 8.5 19.5 11.8579 19.5 16H4.5Z" fill={color} />
          <Path d="M8.5 13.5C9.2 12 10.5 11.2 12 11" stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M3 18.5H21" stroke={color} strokeWidth={2.3} strokeLinecap="round" />
        </Svg>
      );
    case 'SNACK':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M17.5 4.5C18.3 5.3 18.5 6.5 18 7.6C16.5 11.8 12.8 15.5 8.2 17C6.2 17.6 4.2 17.3 3 16.2C2.6 15.8 2.8 15.1 3.4 15C7.2 14.2 10.6 11.8 12.6 8.2C13.3 6.9 14.1 5.2 15.3 4.3C16 3.8 16.9 3.9 17.5 4.5Z" fill={color} />
          <Path d="M18.2 7.2C19.8 10.4 18.8 14.8 15.5 17.6C12.5 20.1 8.2 20.5 5 18.8C8.8 19 12.8 17.2 15.2 13.8C16.8 11.6 17.8 9.4 18.2 7.2Z" fill={color} fillOpacity={0.75} />
        </Svg>
      );
  }
};

export default function MealDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { id, from, date } = useLocalSearchParams<{ id: string; from?: string; date?: string }>();
  const { energyUnit, foodUnit } = useUnitStore();

  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit quantity modal state
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<MealItem | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('1');
  const [editUnit, setEditUnit] = useState<string>('serving');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirmation modal state
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Success toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // ── Always navigate back to Log tab (or Home if opened from Home) ────────
  const handleBack = useCallback(() => {
    if (from === 'home') {
      router.replace('/(main)');
    } else {
      router.replace({
        pathname: '/(main)/meals',
        params: date ? { date } : undefined,
      });
    }
  }, [from, date, router]);

  // Handle hardware back on Android
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => subscription.remove();
  }, [handleBack]);

  // ── Fetch Meal Detail ───────────────────────────────────────────────────
  const fetchMealDetail = useCallback(async () => {
    if (!id) return;
    try {
      setErrorMessage(null);
      const data = await mealsApi.getMealById(id);
      setMeal(data);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Could not load meal details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMealDetail();
  }, [fetchMealDetail]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMealDetail();
  }, [fetchMealDetail]);

  // ── Normalized Items Array ──────────────────────────────────────────────
  const displayItems = useMemo<MealItem[]>(() => {
    if (!meal) return [];
    if (meal.items && meal.items.length > 0) return meal.items;
    return [
      {
        foodName: meal.name || `${meal.mealType} Meal`,
        quantity: 1,
        unit: 'serving',
        calories: meal.totalCalories,
        protein: meal.totalProtein,
        carbs: meal.totalCarbs,
        fat: meal.totalFat,
      },
    ];
  }, [meal]);

  // ── Helper to resolve image for a food item ─────────────────────────────
  const getItemImage = useCallback(
    (item: MealItem): string | undefined => {
      // 1. Explicit item imageUrl if directly provided
      if (item.imageUrl) return item.imageUrl;

      // 2. Only if the meal itself was a verified photo scan (AI_IMAGE) with a real user photo and this is the single item
      if (meal?.source === 'AI_IMAGE' && meal.imageUrl && displayItems.length === 1) {
        return meal.imageUrl;
      }

      // Never auto-assign images from catalog or fallback string dictionaries
      return undefined;
    },
    [meal?.imageUrl, meal?.source, displayItems.length]
  );

  // ── Macro Distribution & Percentages ────────────────────────────────────
  const macroStats = useMemo(() => {
    if (!meal) return { pCal: 0, cCal: 0, fCal: 0, totalCal: 0, pPct: 0, cPct: 0, fPct: 0 };
    const pCal = Math.max(0, meal.totalProtein * 4);
    const cCal = Math.max(0, meal.totalCarbs * 4);
    const fCal = Math.max(0, meal.totalFat * 9);
    const totalCal = pCal + cCal + fCal;
    if (totalCal <= 0) {
      return { pCal: 0, cCal: 0, fCal: 0, totalCal: 0, pPct: 0, cPct: 0, fPct: 0 };
    }
    const pPct = Math.round((pCal / totalCal) * 100);
    const cPct = Math.round((cCal / totalCal) * 100);
    const fPct = Math.max(0, 100 - pPct - cPct);
    return { pCal, cCal, fCal, totalCal, pPct, cPct, fPct };
  }, [meal]);

  // ── Date & Time Display ─────────────────────────────────────────────────
  const formattedDateTime = useMemo(() => {
    if (!meal) return '';
    try {
      const dateSource = meal.loggedAt || meal.loggedDate;
      const d = new Date(dateSource);
      if (isNaN(d.getTime())) return meal.loggedDate || '';

      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const dateStr = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      return `${dateStr} • ${timeStr}`;
    } catch {
      return meal.loggedDate || '';
    }
  }, [meal]);

  // ── Helper to detect if unit is grams/milliliters (not serving/portion) ─
  const isGramOrMlUnit = (unitStr: string): boolean => {
    const u = (unitStr || '').trim().toLowerCase();
    return (
      u === 'g' ||
      u === 'gram' ||
      u === 'grams' ||
      u === 'ml' ||
      u === 'milliliter' ||
      u === 'milliliters'
    );
  };

  // ── Parse number input supporting both dot and comma decimal separators ──
  const parseNumberInput = (val: string): number => {
    if (!val) return 0;
    const normalized = val.trim().replace(/,/g, '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  };

  // ── Open Edit Quantity Modal ────────────────────────────────────────────
  const openEditModal = (item: MealItem, index: number) => {
    setEditingItemIndex(index);
    setEditingItem(item);
    const initialQty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    setEditQuantity(String(initialQty));
    setEditUnit(item.unit || 'serving');
  };

  // Step adjustment in edit modal (+/- 0.5 for servings, +/- 25 for grams)
  const handleStepQuantity = (delta: number) => {
    const isGram = isGramOrMlUnit(editUnit);
    const step = isGram ? 25 : 0.5;
    const minVal = isGram ? 5 : 0.5;

    const currentVal = parseNumberInput(editQuantity);
    const base = currentVal > 0 ? currentVal : (isGram ? 25 : 1);
    const nextVal = Math.max(minVal, Math.round((base + delta * step) * 10) / 10);
    setEditQuantity(String(nextVal));
  };

  // Sanitized keyboard text input handler (supports dot and comma)
  const handleQuantityTextChange = (text: string) => {
    let sanitized = text.replace(/,/g, '.');
    sanitized = sanitized.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }
    setEditQuantity(sanitized);
  };

  const handleMultiplier = (multiplier: number) => {
    const base = editingItem?.quantity && editingItem.quantity > 0 ? editingItem.quantity : 1;
    const nextVal = Math.round(base * multiplier * 10) / 10;
    setEditQuantity(String(nextVal));
  };

  // Real-time calculated preview for item being edited
  const editPreview = useMemo(() => {
    if (!editingItem) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const originalQty = editingItem.quantity && editingItem.quantity > 0 ? editingItem.quantity : 1;
    const targetQty = parseNumberInput(editQuantity);

    if (targetQty <= 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    const ratio = originalQty > 0 ? targetQty / originalQty : 1;

    return {
      calories: Math.round(editingItem.calories * ratio),
      protein: Math.round(editingItem.protein * ratio * 10) / 10,
      carbs: Math.round(editingItem.carbs * ratio * 10) / 10,
      fat: Math.round(editingItem.fat * ratio * 10) / 10,
    };
  }, [editingItem, editQuantity]);

  // ── Save Edited Quantity ────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!meal || editingItemIndex === null || !editingItem) return;

    const newQty = parseNumberInput(editQuantity);
    if (newQty <= 0) {
      Alert.alert('Notice', 'Please enter a valid quantity greater than 0.');
      return;
    }

    const originalQty = editingItem.quantity && editingItem.quantity > 0 ? editingItem.quantity : 1;
    const ratio = originalQty > 0 ? newQty / originalQty : 1;

    const updatedItem: MealItem = {
      ...editingItem,
      quantity: newQty,
      unit: editUnit,
      portionDescription: `${newQty} ${editUnit}`,
      calories: Math.round(editingItem.calories * ratio),
      protein: Math.round(editingItem.protein * ratio * 10) / 10,
      carbs: Math.round(editingItem.carbs * ratio * 10) / 10,
      fat: Math.round(editingItem.fat * ratio * 10) / 10,
    };

    const newItems = [...displayItems];
    newItems[editingItemIndex] = updatedItem;

    const newTotalCalories = Math.round(newItems.reduce((acc, it) => acc + (it.calories || 0), 0));
    const newTotalProtein = Math.round(newItems.reduce((acc, it) => acc + (it.protein || 0), 0) * 10) / 10;
    const newTotalCarbs = Math.round(newItems.reduce((acc, it) => acc + (it.carbs || 0), 0) * 10) / 10;
    const newTotalFat = Math.round(newItems.reduce((acc, it) => acc + (it.fat || 0), 0) * 10) / 10;

    try {
      setSavingEdit(true);
      const res = await mealsApi.updateMeal(meal.id, {
        name: meal.name,
        mealType: meal.mealType,
        totalCalories: newTotalCalories,
        totalProtein: newTotalProtein,
        totalCarbs: newTotalCarbs,
        totalFat: newTotalFat,
        items: newItems,
      });

      setMeal(res);
      setEditingItemIndex(null);
      setEditingItem(null);
      showToast('Quantity updated successfully');
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to update quantity.');
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Delete Entire Meal ──────────────────────────────────────────────────
  const handleDeleteMeal = async () => {
    if (!meal) return;
    try {
      setDeleting(true);
      await mealsApi.deleteMeal(meal.id);
      setIsDeleteModalVisible(false);
      handleBack();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to delete meal.');
      setDeleting(false);
    }
  };

  // ── Loading Screen ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.saffron} />
        <Text style={styles.loadingText}>Loading meal details...</Text>
      </View>
    );
  }

  // ── Error / Not Found Screen ────────────────────────────────────────────
  if (!meal || errorMessage) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <AlertCircle size={48} color="#D32F2F" />
        <Text style={styles.emptyTitle}>Meal Not Found</Text>
        <Text style={styles.emptySubtitle}>
          {errorMessage || 'This meal entry could not be located or may have been deleted.'}
        </Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={handleBack}>
          <Text style={styles.backHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* ── Top Header Navigation ────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 4), backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.headerIconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityLabel="Back to meals log"
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Meal Details</Text>

        <TouchableOpacity
          style={[
            styles.headerIconButton,
            styles.headerDeleteBtn,
            {
              backgroundColor: isDark ? 'rgba(220,38,38,0.2)' : '#FEF2F2',
              borderColor: isDark ? 'rgba(220,38,38,0.4)' : '#FEE2E2',
            },
          ]}
          onPress={() => setIsDeleteModalVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel="Delete meal"
        >
          <Trash2 size={20} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Toast Notification ───────────────────────────────────────── */}
        {toastMessage && (
          <View style={styles.toastWrap}>
            <Check size={16} color="#FFFFFF" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        {/* ── Cloudinary Hero Image (Only rendered if image exists) ──── */}
        {meal.imageUrl ? (
          <View style={[styles.heroImageWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Image
              source={{ uri: meal.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {/* Top Badges Overlay */}
            <View style={styles.heroOverlayBadges}>
              <View style={[styles.heroBadgePill, { backgroundColor: isDark ? 'rgba(20,20,20,0.85)' : 'rgba(255, 255, 255, 0.94)' }]}>
                <MealSectionIcon type={meal.mealType} size={15} color={theme.colors.saffron} />
                <Text style={[styles.heroBadgeText, { color: colors.textPrimary }]}>{meal.mealType}</Text>
              </View>

              {meal.source === 'AI_IMAGE' && (
                <View style={[styles.heroBadgePill, styles.aiScanBadge, { backgroundColor: isDark ? 'rgba(124,58,237,0.25)' : 'rgba(245, 243, 255, 0.94)' }]}>
                  <Sparkles size={14} color="#7C3AED" />
                  <Text style={[styles.heroBadgeText, { color: '#7C3AED' }]}>AI Scan</Text>
                </View>
              )}
              {meal.source === 'AI_TEXT' && (
                <View style={[styles.heroBadgePill, styles.aiScanBadge, { backgroundColor: isDark ? 'rgba(124,58,237,0.25)' : 'rgba(245, 243, 255, 0.94)' }]}>
                  <Sparkles size={14} color="#7C3AED" />
                  <Text style={[styles.heroBadgeText, { color: '#7C3AED' }]}>AI Assistant</Text>
                </View>
              )}
            </View>
          </View>
        ) : null}

        {/* ── Primary Meal Info Card ───────────────────────────────────── */}
        <View style={[styles.primaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.mealTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {meal.name || `${meal.mealType} Meal`}
              </Text>
              <View style={styles.dateTimeRow}>
                <Clock size={14} color={colors.textSecondary} />
                <Text style={[styles.dateTimeText, { color: colors.textSecondary }]}>{formattedDateTime}</Text>
              </View>
            </View>

            {/* Total Calories Badge */}
            <View style={styles.calorieBadge}>
              <Flame size={20} color={theme.colors.saffron} />
              <Text style={styles.calorieNumber}>{Math.round(meal.totalCalories)}</Text>
              <Text style={styles.calorieUnit}>{energyUnit}</Text>
            </View>
          </View>
        </View>

        {/* ── Macro Distribution Section (Bar + 3 Cards) ───────────────── */}
        <View style={[styles.macroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.macroHeaderRow}>
            <Text style={[styles.sectionHeaderTitle, { color: colors.textPrimary }]}>Macro Distribution</Text>
            <Text style={[styles.macroSubText, { color: colors.textSecondary }]}>
              {Math.round(meal.totalProtein + meal.totalCarbs + meal.totalFat)}g total
            </Text>
          </View>

          {/* Segmented Ratio Bar */}
          <View style={[styles.segmentedBarTrack, { backgroundColor: colors.inputBg }]}>
            <View
              style={[
                styles.segmentedBarSegment,
                {
                  flex: Math.max(0.01, macroStats.pCal),
                  backgroundColor: theme.macros.protein,
                },
              ]}
            />
            <View
              style={[
                styles.segmentedBarSegment,
                {
                  flex: Math.max(0.01, macroStats.cCal),
                  backgroundColor: theme.macros.carbs,
                },
              ]}
            />
            <View
              style={[
                styles.segmentedBarSegment,
                {
                  flex: Math.max(0.01, macroStats.fCal),
                  backgroundColor: theme.macros.fat,
                },
              ]}
            />
          </View>

          {/* 3 Macro Stat Columns */}
          <View style={styles.macroGridRow}>
            {/* Protein */}
            <View style={[styles.macroStatCol, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <View style={styles.macroLabelRow}>
                <View style={[styles.macroDot, { backgroundColor: theme.macros.protein }]} />
                <Text style={[styles.macroNameLabel, { color: colors.textSecondary }]}>Protein</Text>
              </View>
              <Text style={[styles.macroGramsValue, { color: theme.macros.protein }]}>
                {formatFoodWeight(meal.totalProtein, foodUnit).full}
              </Text>
              <Text style={[styles.macroPctText, { color: colors.textSecondary }]}>
                {macroStats.pPct}% • {Math.round(macroStats.pCal)} kcal
              </Text>
            </View>

            {/* Carbs */}
            <View style={[styles.macroStatCol, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <View style={styles.macroLabelRow}>
                <View style={[styles.macroDot, { backgroundColor: theme.macros.carbs }]} />
                <Text style={[styles.macroNameLabel, { color: colors.textSecondary }]}>Carbs</Text>
              </View>
              <Text style={[styles.macroGramsValue, { color: theme.macros.carbs }]}>
                {formatFoodWeight(meal.totalCarbs, foodUnit).full}
              </Text>
              <Text style={[styles.macroPctText, { color: colors.textSecondary }]}>
                {macroStats.cPct}% • {Math.round(macroStats.cCal)} kcal
              </Text>
            </View>

            {/* Fat */}
            <View style={[styles.macroStatCol, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <View style={styles.macroLabelRow}>
                <View style={[styles.macroDot, { backgroundColor: theme.macros.fat }]} />
                <Text style={[styles.macroNameLabel, { color: colors.textSecondary }]}>Fat</Text>
              </View>
              <Text style={[styles.macroGramsValue, { color: theme.macros.fat }]}>
                {formatFoodWeight(meal.totalFat, foodUnit).full}
              </Text>
              <Text style={[styles.macroPctText, { color: colors.textSecondary }]}>
                {macroStats.fPct}% • {Math.round(macroStats.fCal)} kcal
              </Text>
            </View>
          </View>
        </View>

        {/* ── Food Items Section ───────────────────────────────────────── */}
        <View style={styles.itemsSection}>
          <View style={styles.itemsHeaderRow}>
            <Text style={[styles.sectionHeaderTitle, { color: colors.textPrimary }]}>
              Food Items ({displayItems.length})
            </Text>
            <Text style={[styles.itemsHelperText, { color: colors.textSecondary }]}>Tap Edit to change portion</Text>
          </View>

          {displayItems.map((item, index) => {
            const portionText =
              item.portionDescription ||
              (item.quantity ? `${item.quantity} ${item.unit || 'serving'}` : '1 serving');
            const itemImageUrl = getItemImage(item);

            return (
              <View key={item.id || `item-${index}`} style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.itemMainRow}>
                  {/* Food Thumbnail Image */}
                  {itemImageUrl ? (
                    <Image
                      source={{ uri: itemImageUrl }}
                      style={styles.itemThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.itemThumbFallback, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                      <Utensils size={18} color={colors.textSecondary} />
                    </View>
                  )}

                  <View style={styles.itemCenterCol}>
                    <Text style={[styles.itemFoodName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.foodName}
                    </Text>
                    <Text style={[styles.itemPortionText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {portionText}
                    </Text>
                  </View>

                  <View style={styles.itemRightWrap}>
                    <Text style={[styles.itemCalorieText, { color: colors.textPrimary }]}>
                      {Math.round(item.calories)} {energyUnit}
                    </Text>

                    {/* Neutral, non-orange Edit Button */}
                    <TouchableOpacity
                      style={[styles.itemEditBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                      activeOpacity={0.7}
                      onPress={() => openEditModal(item, index)}
                    >
                      <Edit3 size={12} color={colors.textSecondary} />
                      <Text style={[styles.itemEditBtnText, { color: colors.textSecondary }]}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Macro Mini Chips */}
                <View style={[styles.itemMacroChipsRow, { borderTopColor: colors.border }]}>
                  <View style={[styles.miniChip, { backgroundColor: 'rgba(93, 128, 230, 0.12)' }]}>
                    <Text style={[styles.miniChipText, { color: '#3A5ECC' }]}>
                      P {Math.round(item.protein * 10) / 10}g
                    </Text>
                  </View>

                  <View style={[styles.miniChip, { backgroundColor: 'rgba(123, 199, 84, 0.15)' }]}>
                    <Text style={[styles.miniChipText, { color: '#448C1C' }]}>
                      C {Math.round(item.carbs * 10) / 10}g
                    </Text>
                  </View>

                  <View style={[styles.miniChip, { backgroundColor: 'rgba(245, 166, 35, 0.16)' }]}>
                    <Text style={[styles.miniChipText, { color: '#BA7106' }]}>
                      F {Math.round(item.fat * 10) / 10}g
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Bottom Delete Meal Action ────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.bottomDeleteBtn, { backgroundColor: colors.surface, borderColor: isDark ? 'rgba(220,38,38,0.4)' : '#FCA5A5' }]}
          activeOpacity={0.8}
          onPress={() => setIsDeleteModalVisible(true)}
        >
          <Trash2 size={18} color="#D32F2F" />
          <Text style={styles.bottomDeleteText}>Delete Meal Entry</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Edit Quantity Modal (Synchronized style & colors with add.tsx) ── */}
      <Modal
        visible={editingItemIndex !== null}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!savingEdit) {
            setEditingItemIndex(null);
            setEditingItem(null);
          }
        }}
      >
        <View style={styles.portionModalOverlay}>
          <View style={[styles.portionModalSheet, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={[styles.portionModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.portionModalTitle, { color: colors.textPrimary }]}>Edit Quantity</Text>
              <TouchableOpacity
                onPress={() => {
                  if (!savingEdit) {
                    setEditingItemIndex(null);
                    setEditingItem(null);
                  }
                }}
                disabled={savingEdit}
                style={[styles.portionCloseBtn, { backgroundColor: colors.inputBg }]}
                accessibilityLabel="Close edit modal"
              >
                <X size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {editingItem && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                {/* Food summary card */}
                <View style={[styles.portionFoodCard, { backgroundColor: colors.inputBg }]}>
                  {getItemImage(editingItem) ? (
                    <Image
                      source={{ uri: getItemImage(editingItem) }}
                      style={styles.portionFoodThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.portionIconPlaceholder, { backgroundColor: colors.surface }]}>
                      <Utensils size={24} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.portionFoodInfo}>
                    <Text style={[styles.portionFoodName, { color: colors.textPrimary }]} numberOfLines={2}>
                      {editingItem.foodName}
                    </Text>
                    <Text style={[styles.portionFoodServing, { color: colors.textSecondary }]}>
                      Original: {editingItem.portionDescription || `${editingItem.quantity || 1} ${editingItem.unit || 'serving'}`}
                    </Text>
                  </View>
                </View>

                {/* Serving stepper / quantity control */}
                <View style={[styles.portionQuantityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.portionQuantityLabel, { color: colors.textPrimary }]}>
                    {isGramOrMlUnit(editUnit) ? `Weight (${editUnit})` : 'Number of Servings'}
                  </Text>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      style={[styles.stepperBtn, { backgroundColor: colors.inputBg }]}
                      activeOpacity={0.7}
                      disabled={savingEdit}
                      onPress={() => handleStepQuantity(-1)}
                    >
                      <Minus size={18} color={colors.textPrimary} />
                    </TouchableOpacity>

                    <TextInput
                      style={[styles.stepperInput, { color: colors.textPrimary, borderBottomColor: colors.primary }]}
                      keyboardType="decimal-pad"
                      value={editQuantity}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      onChangeText={handleQuantityTextChange}
                      selectTextOnFocus
                      editable={!savingEdit}
                      returnKeyType="done"
                    />

                    <TouchableOpacity
                      style={[styles.stepperBtn, { backgroundColor: colors.inputBg }]}
                      activeOpacity={0.7}
                      disabled={savingEdit}
                      onPress={() => handleStepQuantity(1)}
                    >
                      <Plus size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  {/* Quick quantity multiplier chips */}
                  <View style={styles.portionChipsRow}>
                    {[0.5, 1, 1.5, 2, 3].map((factor) => {
                      const baseQty = editingItem.quantity && editingItem.quantity > 0 ? editingItem.quantity : 1;
                      const targetVal = Math.round(baseQty * factor * 10) / 10;
                      const isCurrentActive = parseNumberInput(editQuantity) === targetVal;

                      return (
                        <TouchableOpacity
                          key={factor}
                          style={[
                            styles.portionChip,
                            { backgroundColor: isCurrentActive ? colors.primary : colors.inputBg },
                          ]}
                          activeOpacity={0.7}
                          disabled={savingEdit}
                          onPress={() => handleMultiplier(factor)}
                        >
                          <Text
                            style={[
                              styles.portionChipText,
                              { color: isCurrentActive ? '#FFFFFF' : colors.textSecondary },
                            ]}
                          >
                            {factor}x
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Nutrition summary for this quantity */}
                <View style={[styles.portionMacroCard, { backgroundColor: colors.inputBg }]}>
                  <Text style={[styles.portionMacroTitle, { color: colors.textSecondary }]}>Nutritional Content</Text>
                  <View style={styles.portionMacroGrid}>
                    <View style={styles.portionMacroCol}>
                      <Text style={[styles.portionMacroCalVal, { color: colors.textPrimary }]}>
                        {editPreview.calories}
                      </Text>
                      <Text style={[styles.portionMacroCalLabel, { color: colors.textSecondary }]}>{energyUnit}</Text>
                    </View>
                    <View style={[styles.portionMacroDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.portionMacroCol}>
                      <Text style={[styles.portionMacroVal, { color: theme.macros.protein }]}>
                        {editPreview.protein}g
                      </Text>
                      <Text style={[styles.portionMacroLabel, { color: colors.textSecondary }]}>Protein</Text>
                    </View>
                    <View style={[styles.portionMacroDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.portionMacroCol}>
                      <Text style={[styles.portionMacroVal, { color: theme.macros.carbs }]}>
                        {editPreview.carbs}g
                      </Text>
                      <Text style={[styles.portionMacroLabel, { color: colors.textSecondary }]}>Carbs</Text>
                    </View>
                    <View style={[styles.portionMacroDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.portionMacroCol}>
                      <Text style={[styles.portionMacroVal, { color: theme.macros.fat }]}>
                        {editPreview.fat}g
                      </Text>
                      <Text style={[styles.portionMacroLabel, { color: colors.textSecondary }]}>Fat</Text>
                    </View>
                  </View>
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  style={[styles.portionSubmitBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                  disabled={savingEdit}
                  onPress={handleSaveEdit}
                >
                  {savingEdit ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.portionSubmitText}>
                      Save Changes ({editPreview.calories} {energyUnit})
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Delete Confirmation Modal ─────────────────────────────────── */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) setIsDeleteModalVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.deleteModalCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.deleteIconCircle, { backgroundColor: isDark ? 'rgba(220,38,38,0.2)' : '#FEF2F2' }]}>
              <Trash2 size={24} color="#D32F2F" />
            </View>

            <Text style={[styles.deleteModalTitle, { color: colors.textPrimary }]}>Remove Meal Entry?</Text>
            <Text style={[styles.deleteModalSubtitle, { color: colors.textSecondary }]}>
              Are you sure you want to delete &ldquo;{meal.name || `${meal.mealType} Meal`}&rdquo; from your nutrition diary?
            </Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalSecondaryBtn, { backgroundColor: colors.inputBg }]}
                onPress={() => setIsDeleteModalVisible(false)}
                disabled={deleting}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalSecondaryBtnText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={handleDeleteMeal}
                disabled={deleting}
                activeOpacity={0.8}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteConfirmBtnText}>Delete Meal</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: theme.fonts.medium,
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: theme.colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  backHomeBtn: {
    marginTop: 12,
    backgroundColor: theme.colors.onyx,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  backHomeBtnText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  /* ── Header ─────────────────────────────────────────────────────────── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE1',
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE6DB',
  },
  headerDeleteBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },

  /* ── Toast ───────────────────────────────────────────────────────────── */
  toastWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  toastText: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: '#FFFFFF',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* ── Hero Image (Rendered only when imageUrl is present) ──────────────── */
  heroImageWrapper: {
    width: '100%',
    height: 230,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#EAE6DB',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDE9DE',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlayBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  heroBadgeText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
    color: theme.colors.textPrimary,
  },
  aiScanBadge: {
    backgroundColor: 'rgba(245, 243, 255, 0.94)',
  },

  /* ── Primary Card ────────────────────────────────────────────────────── */
  primaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFECE2',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 21,
    color: theme.colors.textPrimary,
    lineHeight: 27,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  dateTimeText: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  calorieBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(255, 145, 20, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  calorieNumber: {
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    color: theme.colors.saffron,
  },
  calorieUnit: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
    color: theme.colors.saffron,
  },

  /* ── Macro Card ──────────────────────────────────────────────────────── */
  macroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFECE2',
  },
  macroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  macroSubText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  segmentedBarTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: '#F3F0E6',
    marginBottom: 16,
  },
  segmentedBarSegment: {
    height: '100%',
  },
  macroGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  macroStatCol: {
    flex: 1,
    backgroundColor: '#F9F8F3',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFECE2',
  },
  macroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroNameLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  macroGramsValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 17,
  },
  macroPctText: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  /* ── Food Items Section ──────────────────────────────────────────────── */
  itemsSection: {
    marginBottom: 20,
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  itemsHelperText: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFECE2',
  },
  itemMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemThumb: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#F3F0E6',
  },
  itemThumbFallback: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#F4F2E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE6DB',
  },
  itemCenterCol: {
    flex: 1,
    paddingRight: 8,
  },
  itemFoodName: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  itemPortionText: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  itemRightWrap: {
    alignItems: 'flex-end',
    gap: 6,
  },
  itemCalorieText: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  itemEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0E6',
    borderWidth: 1,
    borderColor: '#EAE6DB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  itemEditBtnText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
    color: '#4A463B',
  },
  itemMacroChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F6F4ED',
  },
  miniChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  miniChipText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 11,
  },

  /* ── Bottom Delete Button ────────────────────────────────────────────── */
  bottomDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  bottomDeleteText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: '#D32F2F',
  },

  /* ── Modal Common Styles ─────────────────────────────────────────────── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 19, 19, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalSecondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3F0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  modalPrimaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },

  /* ── Portion Customizer Modal Styles (Matching add.tsx) ────────── */
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
    borderRadius: 14,
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
    marginBottom: 14,
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
  portionMacroCard: {
    backgroundColor: '#F8F7F2',
    borderRadius: 14,
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
    borderRadius: 14,
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

  /* ── Delete Confirmation Modal ───────────────────────────────────────── */
  deleteModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  deleteIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 19,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  deleteModalSubtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
