import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sparkles, Check, Plus, Minus } from 'lucide-react-native';
import { theme } from '../../../src/constants';
import { Button, Card, Pill } from '../../../src/components';

export default function AIRecognitionBreakdownScreen() {
  const router = useRouter();

  const [items, setItems] = useState([
    { id: 1, name: 'Atlantic Salmon (Grilled)', grams: 180, cal: 360, p: 34, c: 0, f: 22 },
    { id: 2, name: 'Quinoa & Brown Rice', grams: 120, cal: 150, p: 4, c: 28, f: 2 },
    { id: 3, name: 'Avocado & Mixed Greens', grams: 80, cal: 140, p: 2, c: 6, f: 12 },
  ]);

  const totalCalories = items.reduce((acc, curr) => acc + curr.cal, 0);
  const totalProtein = items.reduce((acc, curr) => acc + curr.p, 0);
  const totalCarbs = items.reduce((acc, curr) => acc + curr.c, 0);
  const totalFat = items.reduce((acc, curr) => acc + curr.f, 0);

  const adjustGrams = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newGrams = Math.max(item.grams + delta, 10);
          const ratio = newGrams / item.grams;
          return {
            ...item,
            grams: newGrams,
            cal: Math.round(item.cal * ratio),
            p: Math.round(item.p * ratio),
            c: Math.round(item.c * ratio),
            f: Math.round(item.f * ratio),
          };
        }
        return item;
      })
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Recognition</Text>
        <Pill label="98% Match" variant="green" size="sm" />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Scanned Image Preview */}
        <View style={styles.imagePreviewWrap}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
            }}
            style={styles.scannedImage}
          />
          <View style={styles.floatingBadge}>
            <Sparkles size={16} color={theme.colors.saffron} />
            <Text style={styles.floatingBadgeText}>Grilled Salmon Salad</Text>
          </View>
        </View>

        {/* Total Summary Card */}
        <Card style={styles.summaryCard} padding="lg">
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.totalCalNumber}>{totalCalories}</Text>
              <Text style={styles.totalCalLabel}>TOTAL KCAL</Text>
            </View>

            <View style={styles.macrosWrap}>
              <View style={styles.macroPill}>
                <Text style={styles.macroVal}>{totalCarbs}g</Text>
                <Text style={styles.macroType}>Carbs</Text>
              </View>
              <View style={styles.macroPill}>
                <Text style={styles.macroVal}>{totalProtein}g</Text>
                <Text style={styles.macroType}>Protein</Text>
              </View>
              <View style={styles.macroPill}>
                <Text style={styles.macroVal}>{totalFat}g</Text>
                <Text style={styles.macroType}>Fat</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Identified Ingredients */}
        <Text style={styles.sectionTitle}>Identified Ingredients</Text>
        <View style={styles.itemsList}>
          {items.map((item) => (
            <Card key={item.id} variant="default" padding="md" style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemHeaderLeft}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMacros}>
                    {item.cal} kcal • P: {item.p}g • C: {item.c}g • F: {item.f}g
                  </Text>
                </View>
                <Text style={styles.itemGramsText}>{item.grams}g</Text>
              </View>

              {/* Portion Control */}
              <View style={styles.portionRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => adjustGrams(item.id, -20)}
                  style={styles.adjustBtn}
                >
                  <Minus size={16} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.portionLabel}>Adjust portion</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => adjustGrams(item.id, 20)}
                  style={styles.adjustBtn}
                >
                  <Plus size={16} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* Footer Save */}
      <View style={styles.footer}>
        <Button
          title="Save Meal to Log"
          size="lg"
          variant="primary"
          fullWidth
          rightIcon={<Check size={18} color="#FFFFFF" />}
          onPress={() => router.push('/(main)')}
        />
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenMargin,
    paddingVertical: theme.spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(19, 19, 19, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: theme.spacing.sm,
    paddingBottom: 40,
  },
  imagePreviewWrap: {
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  scannedImage: {
    width: '100%',
    height: '100%',
  },
  floatingBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(19, 19, 19, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  floatingBadgeText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  summaryCard: {
    borderRadius: 20,
    marginBottom: theme.spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalCalNumber: {
    fontFamily: theme.fonts.bold,
    fontSize: 32,
    color: theme.colors.textPrimary,
  },
  totalCalLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 11,
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  macrosWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  macroPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(19, 19, 19, 0.04)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  macroVal: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  macroType: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  itemsList: {
    gap: 10,
  },
  itemCard: {
    borderRadius: 18,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  itemMacros: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  itemGramsText: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.saffron,
  },
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(19, 19, 19, 0.05)',
  },
  adjustBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(19, 19, 19, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  footer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: theme.colors.surfaceBase,
  },
});
