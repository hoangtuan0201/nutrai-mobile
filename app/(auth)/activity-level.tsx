/**
 * activity-level.tsx — CaloriQ-inspired activity selection
 * Simple white cards, large title, radio selection pattern.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Armchair, Footprints, Flame, Zap, BicepsFlexed } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button } from '../../src/components';

// ─── Segmented progress bar ─────────────────────────────────────────
const TOTAL_STEPS = 4;
function StepBar({ step }: { step: number }) {
  return (
    <View style={barStyles.row}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[barStyles.segment, i < step && barStyles.segmentActive]}
        />
      ))}
    </View>
  );
}
const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, flex: 1, marginHorizontal: 10 },
  segment: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(19,19,19,0.10)',
  },
  segmentActive: { backgroundColor: theme.colors.saffron },
});

// ─── Options ──────────────────────────────────────────────────────────
const OPTIONS = [
  {
    id: 'sedentary',
    icon: Armchair,
    iconColor: '#88A8F7',
    iconBg: 'rgba(136,168,247,0.15)',
    label: 'Sedentary',
    desc: 'Desk job, little or no exercise',
    multiplier: '×1.2',
  },
  {
    id: 'light',
    icon: Footprints,
    iconColor: '#8EDC5E',
    iconBg: 'rgba(142,220,94,0.15)',
    label: 'Lightly Active',
    desc: 'Light exercise 1–3 days/week',
    multiplier: '×1.375',
  },
  {
    id: 'moderate',
    icon: Flame,
    iconColor: '#FF9114',
    iconBg: 'rgba(255,145,20,0.12)',
    label: 'Moderately Active',
    desc: 'Moderate exercise 3–5 days/week',
    multiplier: '×1.55',
    recommended: true,
  },
  {
    id: 'very',
    icon: Zap,
    iconColor: '#FDD922',
    iconBg: 'rgba(253,217,34,0.18)',
    label: 'Very Active',
    desc: 'Hard training 6–7 days/week',
    multiplier: '×1.725',
  },
  {
    id: 'extra',
    icon: BicepsFlexed,
    iconColor: '#F04B37',
    iconBg: 'rgba(240,75,55,0.12)',
    label: 'Extra Active',
    desc: 'Very hard training + physical job',
    multiplier: '×1.9',
  },
];

export default function ActivityLevelScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState('moderate');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <StepBar step={3} />
        <TouchableOpacity activeOpacity={0.6} onPress={() => router.push('/(auth)/goal-preferences' as any)}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>How active{'\n'}are you?</Text>

        <View style={styles.optionsList}>
          {OPTIONS.map((item) => {
            const isSelected = selected === item.id;
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => setSelected(item.id)}
                style={[styles.card, isSelected && styles.cardActive]}
              >
                {/* Left: icon */}
                <View style={[styles.iconBubble, { backgroundColor: item.iconBg }]}>
                  <Icon size={20} color={item.iconColor} strokeWidth={2.2} />
                </View>

                {/* Middle: label + desc */}
                <View style={styles.cardContent}>
                  <View style={styles.cardTitleRow}>
                    <Text style={[styles.cardLabel, isSelected && styles.cardLabelActive]}>
                      {item.label}
                    </Text>
                    {item.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>Recommended</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardDesc}>{item.desc}</Text>
                </View>

                {/* Right: radio */}
                <View style={[styles.radio, isSelected && styles.radioActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Next"
          size="lg"
          variant="primary"
          fullWidth
          onPress={() => router.push('/(auth)/goal-preferences' as any)}
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
    paddingHorizontal: theme.spacing.screenMargin,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19, 19, 19, 0.05)',
  },
  skipText: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 10,
  },
  scroll: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 30,
    lineHeight: 38,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 28,
  },
  optionsList: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(19,19,19,0.07)',
    gap: 12,
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardActive: {
    borderColor: theme.colors.saffron,
    borderWidth: 2,
    backgroundColor: '#FFFBF5',
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  cardLabelActive: {
    color: theme.colors.textPrimary,
  },
  recommendedBadge: {
    backgroundColor: 'rgba(255,145,20,0.15)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  recommendedText: {
    fontFamily: theme.fonts.medium,
    fontSize: 10,
    color: theme.colors.saffron,
  },
  cardDesc: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 17,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(19,19,19,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: theme.colors.saffron,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.saffron,
  },
  footer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingBottom: 32,
    paddingTop: 12,
  },
});
