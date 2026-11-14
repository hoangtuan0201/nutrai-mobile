import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';

const FREE_ITEMS = [
  'Daily nutrition tracking',
  'Food database',
  'Meal management',
  'Water & weight tracking',
  'Basic AI assistance (3 scans, 5 chats/day)',
  'Basic progress charts',
];

const PRO_ITEMS = [
  'Everything in Free',
  'Advanced AI Food Scan (20 scans/day)',
  'Personalized AI Coach (50 chats/day)',
  'Detailed nutrition insights',
  'Long-term analytics',
  'Weekly nutrition reports',
];

export function ProFeatureComparison() {
  const { colors, isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: isDark ? colors.border : '#E5E7EB',
        },
      ]}
    >
      <View style={styles.columnsRow}>
        {/* FREE Column */}
        <View style={styles.column}>
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>FREE</Text>
          </View>
          <Text style={[styles.colTitle, { color: colors.textPrimary }]}>
            Your Nutrition Tracker
          </Text>
          <Text style={styles.freePrice}>0đ</Text>
          <Text style={[styles.priceSub, { color: colors.textSecondary }]}>Free forever</Text>

          <View style={styles.list}>
            {FREE_ITEMS.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <Text style={[styles.dot, { color: colors.textPrimary }]}>•</Text>
                <Text style={[styles.itemText, { color: colors.textPrimary }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* PRO Column */}
        <View style={styles.column}>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
          <Text style={[styles.colTitle, { color: colors.textPrimary }]}>
            Your Personal Nutrition Coach
          </Text>
          <Text style={styles.proPrice}>PRO</Text>
          <Text style={[styles.priceSub, { color: colors.textSecondary }]}>Subscription</Text>

          <View style={styles.list}>
            {PRO_ITEMS.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <Text style={[styles.dot, { color: colors.textPrimary }]}>•</Text>
                <Text style={[styles.itemText, { color: colors.textPrimary }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Text style={[styles.principleHeading, { color: colors.textPrimary }]}>
        Product Principles
      </Text>
      <Text style={[styles.principleText, { color: colors.textPrimary }]}>
        Free = Track your nutrition.
      </Text>
      <Text style={[styles.principleText, { color: colors.textPrimary }]}>
        Pro = Understand, improve and optimize your nutrition.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  columnsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  column: {
    flex: 1,
  },
  freeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 8,
  },
  freeBadgeText: {
    fontSize: 10,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#15803D',
  },
  proBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FCE7D6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 8,
  },
  proBadgeText: {
    fontSize: 10,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#9A4A17',
  },
  colTitle: {
    fontSize: 13.5,
    fontFamily: 'Manrope_800ExtraBold',
    minHeight: 36,
    marginBottom: 4,
  },
  freePrice: {
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#15803D',
  },
  proPrice: {
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#D9822B',
  },
  priceSub: {
    fontSize: 11,
    fontFamily: 'Manrope_500Medium',
    marginBottom: 12,
  },
  list: {
    gap: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  dot: {
    fontSize: 13,
    fontFamily: 'Manrope_800ExtraBold',
    lineHeight: 18,
  },
  itemText: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    lineHeight: 17,
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  principleHeading: {
    fontSize: 14,
    fontFamily: 'Manrope_800ExtraBold',
    marginBottom: 6,
  },
  principleText: {
    fontSize: 12.5,
    fontFamily: 'Manrope_500Medium',
    lineHeight: 19,
  },
});

