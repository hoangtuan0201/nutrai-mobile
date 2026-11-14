import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Plus,
  Utensils,
} from 'lucide-react-native';
import { theme } from '../../../src/constants';
import { mealsApi } from '../../../src/features/meals/api/meals.api';
import { MealItem } from '../../../src/features/meals/types';
import { useUnitStore } from '../../../src/store/unitStore';
import { useAiScanStore } from '../../../src/store/aiScanStore';
import { useAppTheme } from '../../../src/hooks/useAppTheme';

interface EditableFoodItem {
  id: string;
  name: string;
  caloriesPer100g: number;
  grams: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export default function AIScanConfirmationScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { energyUnit } = useUnitStore();
  const { imageUri, imageBase64, scanResult, mealType } = useAiScanStore();

  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<EditableFoodItem[]>([]);
  const [successModal, setSuccessModal] = useState<{
    visible: boolean;
    calories: number;
    mealName: string;
  } | null>(null);

  // Initialize editable items from AI scan result
  useEffect(() => {
    if (scanResult?.items && scanResult.items.length > 0) {
      setItems(
        scanResult.items.map((item, idx) => {
          const grams = item.estimatedGrams > 0 ? item.estimatedGrams : 100;
          const cPer100 = item.caloriesPer100g > 0 ? item.caloriesPer100g : Math.round((item.calories / grams) * 100) || 120;
          return {
            id: `item-${idx}-${item.name}`,
            name: item.name,
            caloriesPer100g: cPer100,
            grams,
            proteinPer100g: Math.round(((item.protein || 0) / grams) * 100 * 10) / 10,
            carbsPer100g: Math.round(((item.carbs || 0) / grams) * 100 * 10) / 10,
            fatPer100g: Math.round(((item.fat || 0) / grams) * 100 * 10) / 10,
          };
        }),
      );
    } else {
      setItems([]);
    }
  }, [scanResult]);

  // Handle gram adjustment
  const handleGramChange = (id: string, text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const val = cleaned === '' ? 0 : parseInt(cleaned, 10);
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, grams: val } : it)),
    );
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      Alert.alert('Notice', 'A meal requires at least one food item.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Real-time calculations
  const totalCalories = Math.round(
    items.reduce((sum, it) => sum + (it.caloriesPer100g * it.grams) / 100, 0),
  );
  const totalProtein =
    Math.round(
      items.reduce((sum, it) => sum + (it.proteinPer100g * it.grams) / 100, 0) * 10,
    ) / 10;
  const totalCarbs =
    Math.round(
      items.reduce((sum, it) => sum + (it.carbsPer100g * it.grams) / 100, 0) * 10,
    ) / 10;
  const totalFat =
    Math.round(
      items.reduce((sum, it) => sum + (it.fatPer100g * it.grams) / 100, 0) * 10,
    ) / 10;

  const handleConfirmAndSave = async () => {
    if (items.length === 0) {
      Alert.alert('Notice', 'Please keep at least one food item.');
      return;
    }

    setSubmitting(true);
    try {
      const mealItems: MealItem[] = items.map((it) => {
        const itemCal = Math.round((it.caloriesPer100g * it.grams) / 100);
        return {
          foodName: it.name,
          portionDescription: `${it.grams}g`,
          quantity: it.grams,
          unit: 'g',
          calories: itemCal,
          protein: Math.round(((it.proteinPer100g * it.grams) / 100) * 10) / 10,
          carbs: Math.round(((it.carbsPer100g * it.grams) / 100) * 10) / 10,
          fat: Math.round(((it.fatPer100g * it.grams) / 100) * 10) / 10,
        };
      });

      const todayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

      const computedMealName =
        scanResult?.mealName || items.map((i) => i.name).slice(0, 2).join(' & ');

      // Use base64 data URI if available so backend uploads it to Cloudinary
      const capturedImageUrl = imageBase64
        ? `data:image/jpeg;base64,${imageBase64}`
        : imageUri || undefined;

      await mealsApi.createMeal({
        mealType: mealType || 'LUNCH',
        name: computedMealName,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        imageUrl: capturedImageUrl,
        source: 'AI_IMAGE',
        loggedDate: todayStr,
        items: mealItems,
      });

      setSuccessModal({
        visible: true,
        calories: totalCalories,
        mealName: computedMealName,
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Could not save meal. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle hardware back button on Android
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(main)/meals/camera');
        }
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [router])
  );

  const hasPreviewImage = Boolean(imageUri);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.navigate('/(main)/meals/camera');
            }
          }}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
          <Text style={[styles.backText, { color: colors.textPrimary }]}>Back</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Review AI Scan</Text>

        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Indicator Header (Step 4: User reviews before saving) */}
        <View style={styles.stepHeader}>
          <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Review & Confirm Portion</Text>
          <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
            Adjust portion weights (grams) below if needed before saving.
          </Text>
        </View>

        {/* AI Scan Result Card (Matching Reference Design) */}
        <View style={[styles.scanCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Top Row: Thumbnail + Summary */}
          <View style={styles.cardTopRow}>
            {hasPreviewImage ? (
              <Image source={{ uri: imageUri! }} style={styles.thumbnailImage} />
            ) : (
              <View style={[styles.thumbnailImage, styles.thumbnailPlaceholder, { backgroundColor: colors.inputBg }]}>
                <Utensils size={28} color={colors.textSecondary} />
              </View>
            )}

            <View style={styles.cardTopDetails}>
              <View style={styles.aiBadgeRow}>
                <Sparkles size={14} color="#7CB342" />
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  {scanResult?.mealName || 'AI Scan Result'}
                </Text>
              </View>

              <Text style={[styles.mealTypeSubtitle, { color: colors.textSecondary }]}>
                {mealType === 'BREAKFAST'
                  ? 'Breakfast'
                  : mealType === 'DINNER'
                  ? 'Dinner'
                  : mealType === 'SNACK'
                  ? 'Snack'
                  : 'Lunch'}{' '}
                • Visual Estimate
              </Text>

              {useAiScanStore.getState().foodHint ? (
                <View style={styles.hintBadge}>
                  <Text style={styles.hintBadgeText} numberOfLines={1}>
                    Hint: {useAiScanStore.getState().foodHint}
                  </Text>
                </View>
              ) : null}

              <Text style={[styles.calorieHighlight, { color: colors.textPrimary }]}>
                ~ {totalCalories} {energyUnit}
              </Text>

              <Text style={[styles.disclaimerNote, { color: colors.textSecondary }]}>
                {scanResult?.advice || 'Estimated visually. You can adjust grams for exact accuracy.'}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Section: Detected Foods */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Detected Foods</Text>
            <Text style={[styles.sectionGramsHint, { color: colors.textSecondary }]}>Portion (g)</Text>
          </View>

          {/* Food List */}
          <View style={styles.foodList}>
            {items.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24, gap: 6 }}>
                <Text style={{ fontFamily: theme.fonts.bold, fontSize: 16, color: '#D32F2F' }}>
                  No Food Items Detected
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.medium,
                    fontSize: 13,
                    color: colors.textSecondary,
                    textAlign: 'center',
                    maxWidth: 260,
                    lineHeight: 18,
                  }}
                >
                  AI could not identify food in this photo. Please retake the photo clearly or enter your meal manually.
                </Text>
              </View>
            ) : (
              items.map((item) => (
                <View key={item.id} style={styles.foodRow}>
                  <View style={styles.foodInfo}>
                    <Text style={[styles.foodName, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.foodUnitCal, { color: colors.textSecondary }]}>
                      {item.caloriesPer100g} {energyUnit} / 100 g
                    </Text>
                  </View>

                  {/* Gram Input Pill */}
                  <View style={[styles.gramInputWrap, { backgroundColor: isDark ? colors.background : '#F7F7F7', borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.gramInput, { color: colors.textPrimary }]}
                      value={item.grams === 0 ? '' : item.grams.toString()}
                      onChangeText={(text) => handleGramChange(item.id, text)}
                      keyboardType="numeric"
                      maxLength={4}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <Text style={[styles.gramUnitLabel, { color: colors.textSecondary }]}>g</Text>
                  </View>

                  {/* Remove item button */}
                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    style={styles.deleteBtn}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color="#E53935" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {items.length > 0 ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Bottom Total Calorie Summary */}
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total Estimated Calories</Text>
                <Text style={styles.totalValue}>
                  {totalCalories} {energyUnit}
                </Text>
              </View>

              <Text style={[styles.macroSubtext, { color: colors.textSecondary }]}>
                Protein: {totalProtein}g • Carbs: {totalCarbs}g • Fat: {totalFat}g
              </Text>

              <Text style={[styles.liveCalculationNote, { color: colors.textSecondary }]}>
                Calculated with standard nutritional values. Changing grams will instantly update totals.
              </Text>
            </>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsWrap}>
          {items.length === 0 ? (
            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: '#F1F5F9',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.navigate('/(main)/meals/camera');
                  }
                }}
                activeOpacity={0.8}
              >
                <RotateCcw size={16} color="#475569" />
                <Text style={{ fontFamily: theme.fonts.bold, fontSize: 14, color: '#475569' }}>
                  Retake Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1.2,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: '#2E7D32',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
                onPress={() => router.replace('/(main)/meals/add')}
                activeOpacity={0.85}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={{ fontFamily: theme.fonts.bold, fontSize: 14, color: '#FFFFFF' }}>
                  Add Manually
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.saveBtn, submitting && styles.btnDisabled]}
              onPress={handleConfirmAndSave}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>
                  Confirm & Save Meal ({totalCalories} {energyUnit})
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={!!successModal?.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalIconWrap}>
              <CheckCircle2 size={36} color="#2E7D32" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Meal Logged Successfully!</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                {successModal?.mealName}
              </Text>{' '}
              ({successModal?.calories} {energyUnit}) has been recorded to your nutrition diary.
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setSuccessModal(null);
                router.replace('/(main)/meals');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalPrimaryText}>View Meal Diary</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 60,
  },
  backText: {
    fontFamily: theme.fonts.medium,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  headerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 16,
    paddingBottom: 40,
  },
  stepHeader: {
    marginBottom: 16,
  },
  stepTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  stepSubtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  scanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  thumbnailImage: {
    width: 95,
    height: 95,
    borderRadius: 16,
    backgroundColor: '#EEE',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTopDetails: {
    flex: 1,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  mealTypeSubtitle: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  hintBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  hintBadgeText: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: '#2E7D32',
  },
  calorieHighlight: {
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    color: theme.colors.textPrimary,
    marginTop: 4,
  },
  disclaimerNote: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 3,
    lineHeight: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  sectionGramsHint: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginRight: 32,
  },
  foodList: {
    gap: 10,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  foodUnitCal: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  gramInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 80,
    justifyContent: 'center',
  },
  gramInput: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    minWidth: 38,
    paddingVertical: 2,
  },
  gramUnitLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 2,
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 4,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  totalValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#2E7D32', // Clean nature green
  },
  macroSubtext: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  liveCalculationNote: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },
  actionButtonsWrap: {
    gap: 12,
  },
  saveBtn: {
    backgroundColor: '#2E7D32', // Clean nature green matching the design
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    width: 60,
    height: 60,
    borderRadius: 30,
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
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: '#656A60',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  modalPrimaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalPrimaryText: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
