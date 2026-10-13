import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Search,
  Check,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react-native';
import { theme } from '../../../src/constants';
import { mealsApi } from '../../../src/features/meals/api/meals.api';
import { MealType, MealItem } from '../../../src/features/meals/types';

interface DetectedFoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingCount: number;
  servingUnitText: string;
  imageUrl: string;
}

export default function ConfirmMealScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState<{
    visible: boolean;
    calories: number;
    mealName: string;
  } | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Initial recognized items from AI vision
  const [items, setItems] = useState<DetectedFoodItem[]>([
    {
      id: 'item-1',
      name: 'Hamburger',
      calories: 295,
      protein: 17,
      carbs: 30,
      fat: 12,
      servingCount: 1,
      servingUnitText: 'serving',
      imageUrl:
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80',
    },
    {
      id: 'item-2',
      name: 'Fries',
      calories: 312,
      protein: 4,
      carbs: 41,
      fat: 15,
      servingCount: 1,
      servingUnitText: 'serving',
      imageUrl:
        'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&auto=format&fit=crop&q=80',
    },
    {
      id: 'item-3',
      name: 'Water',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      servingCount: 1,
      servingUnitText: 'bottle',
      imageUrl:
        'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80',
    },
  ]);

  const updateServing = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newCount = Math.max(item.servingCount + delta, 0.5);
          return {
            ...item,
            servingCount: Math.round(newCount * 10) / 10,
          };
        }
        return item;
      }),
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Calculate totals
  const totalCalories = Math.round(
    items.reduce((sum, it) => sum + it.calories * it.servingCount, 0),
  );
  const totalProtein =
    Math.round(
      items.reduce((sum, it) => sum + it.protein * it.servingCount, 0) * 10,
    ) / 10;
  const totalCarbs =
    Math.round(
      items.reduce((sum, it) => sum + it.carbs * it.servingCount, 0) * 10,
    ) / 10;
  const totalFat =
    Math.round(
      items.reduce((sum, it) => sum + it.fat * it.servingCount, 0) * 10,
    ) / 10;

  const handleConfirm = async () => {
    if (items.length === 0) {
      setErrorNotice('Please keep at least one food item.');
      return;
    }

    setSubmitting(true);
    setErrorNotice(null);
    try {
      const mealItems: MealItem[] = items.map((it) => ({
        foodName: it.name,
        portionDescription: `${it.servingCount} ${it.servingUnitText}`,
        quantity: it.servingCount * 100,
        unit: it.servingUnitText,
        calories: Math.round(it.calories * it.servingCount),
        protein: Math.round(it.protein * it.servingCount * 10) / 10,
        carbs: Math.round(it.carbs * it.servingCount * 10) / 10,
        fat: Math.round(it.fat * it.servingCount * 10) / 10,
      }));

      const todayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

      const computedMealName = items.map((i) => i.name).slice(0, 2).join(' & ');

      await mealsApi.createMeal({
        mealType: 'LUNCH',
        name: computedMealName,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
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
      setErrorNotice(error?.message || 'Could not save meal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Camera Snapshot */}
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&auto=format&fit=crop&q=80',
        }}
        style={styles.backgroundImage}
      />

      <SafeAreaView style={styles.overlay} edges={['bottom']}>
        {/* Bottom Sheet Modal */}
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Confirm Your Meal</Text>
              <Text style={styles.sheetSubtitle}>
                You can add missing meals manually.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <X size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Items List */}
          <ScrollView
            style={styles.itemsScroll}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                {/* Thumbnail */}
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />

                {/* Details */}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCalories}>
                    {Math.round(item.calories * item.servingCount)} kcal
                  </Text>
                  <Text style={styles.itemServingDesc}>
                    {item.servingCount} {item.servingUnitText}
                  </Text>

                  {/* Quantity Counter */}
                  <View style={styles.counterRow}>
                    <TouchableOpacity
                      onPress={() => updateServing(item.id, -0.5)}
                      style={styles.counterBtn}
                      activeOpacity={0.7}
                    >
                      <Minus size={14} color="#555" />
                    </TouchableOpacity>
                    <Text style={styles.counterText}>{item.servingCount}</Text>
                    <TouchableOpacity
                      onPress={() => updateServing(item.id, 0.5)}
                      style={styles.counterBtn}
                      activeOpacity={0.7}
                    >
                      <Plus size={14} color="#555" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Actions (Edit / Delete) */}
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/(main)/meals/add',
                        params: { mealType: 'LUNCH', from: 'log' },
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <Edit2 size={16} color="#777777" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => removeItem(item.id)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color="#F04B37" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.sheetFooter}>
            <TouchableOpacity
              style={styles.addManuallyBtn}
              onPress={() =>
                router.push({
                  pathname: '/(main)/meals/add',
                  params: { from: 'log' },
                })
              }
              activeOpacity={0.8}
            >
              <Search size={16} color={theme.colors.textPrimary} />
              <Text style={styles.addManuallyText}>Add Manually</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, submitting && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm ({totalCalories} kcal)</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Sleek Confirmation Modal */}
      <Modal
        visible={!!successModal?.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <CheckCircle2 size={32} color="#2E7D32" />
            </View>
            <Text style={styles.modalTitle}>Meal Logged!</Text>
            <Text style={styles.modalSubtitle}>
              <Text style={{ fontWeight: '700', color: '#1B281B' }}>
                {successModal?.mealName}
              </Text>{' '}
              ({successModal?.calories} kcal) added to your nutrition diary.
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setSuccessModal(null);
                router.replace('/(main)/meals');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalPrimaryText}>View Diary</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'cover',
    opacity: 0.85,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: theme.colors.textPrimary,
  },
  sheetSubtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(19, 19, 19, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsScroll: {
    maxHeight: 280,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(19, 19, 19, 0.06)',
  },
  itemImage: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#F0EFEA',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 14,
  },
  itemName: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  itemCalories: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  itemServingDesc: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F0',
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  counterBtn: {
    padding: 4,
  },
  counterText: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: theme.colors.textPrimary,
    minWidth: 22,
    textAlign: 'center',
  },
  itemActions: {
    alignItems: 'center',
    gap: 12,
    paddingLeft: 10,
  },
  actionIconBtn: {
    padding: 4,
  },
  sheetFooter: {
    marginTop: 16,
    gap: 10,
  },
  addManuallyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(19, 19, 19, 0.15)',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  addManuallyText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  confirmBtn: {
    backgroundColor: '#7CB342', // Clean nature green as shown in the reference image
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
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
    width: 58,
    height: 58,
    borderRadius: 29,
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
