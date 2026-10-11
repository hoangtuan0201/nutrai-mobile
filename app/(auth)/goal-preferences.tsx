/**
 * goal-preferences.tsx — CaloriQ-inspired "Lets set the goal you are going to crush!"
 * Target weight with a custom slider + pace selection cards.
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
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

// ─── Weight unit toggle ───────────────────────────────────────────────
type WeightUnit = 'KG' | 'LB';

// ─── Custom slider ────────────────────────────────────────────────────
const SLIDER_MIN = 30;
const SLIDER_MAX = 150;

function WeightSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackWidth = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        if (trackWidth.current === 0) return;
        const ratio = Math.max(0, Math.min(1, gs.moveX / trackWidth.current));
        const newVal = Math.round(SLIDER_MIN + ratio * (SLIDER_MAX - SLIDER_MIN));
        onChange(newVal);
      },
    })
  ).current;

  const onTrackLayout = (e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
  };

  const pct = ((value - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  return (
    <View style={sliderStyles.container} onLayout={onTrackLayout} {...panResponder.panHandlers}>
      {/* Track */}
      <View style={sliderStyles.track}>
        <View style={[sliderStyles.fill, { width: `${pct}%` }]} />
      </View>
      {/* Thumb */}
      <View
        style={[sliderStyles.thumb, { left: `${pct}%` }]}
        pointerEvents="none"
      />
      {/* Tick labels */}
      <View style={sliderStyles.labels}>
        {[30, 60, 80, 100, 130].map((tick) => (
          <Text key={tick} style={sliderStyles.label}>{tick}</Text>
        ))}
      </View>
    </View>
  );
}
const sliderStyles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 4,
  },
  track: {
    height: 6,
    backgroundColor: 'rgba(19,19,19,0.10)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: theme.colors.saffron,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    top: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.saffron,
    marginLeft: -12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: theme.colors.saffron,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
});

// ─── Pace options ────────────────────────────────────────────────────
const PACES = [
  { id: 'steady',     label: 'Steady & Sustainable',   rate: '~0.25 kg/week', badge: 'Easy' },
  { id: 'moderate',  label: 'Optimal',                  rate: '~0.50 kg/week', badge: 'Recommended' },
  { id: 'aggressive',label: 'Aggressive & Focused',     rate: '~0.75 kg/week', badge: 'Challenging' },
];

export default function GoalPreferencesScreen() {
  const router = useRouter();
  const [unit, setUnit] = useState<WeightUnit>('KG');
  const [weight, setWeight] = useState(70);
  const [pace, setPace] = useState<string>('moderate');

  const displayWeight = unit === 'LB' ? Math.round(weight * 2.205) : weight;

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
        <StepBar step={4} />
        <TouchableOpacity activeOpacity={0.6} onPress={() => router.push('/(auth)/plan-preview' as any)}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Let's set the goal{'\n'}you are going to crush!</Text>

        {/* Unit toggle KG / LB */}
        <View style={styles.unitToggle}>
          {(['KG', 'LB'] as WeightUnit[]).map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
              onPress={() => setUnit(u)}
              activeOpacity={0.8}
            >
              <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weight display + slider */}
        <View style={styles.weightCard}>
          <Text style={styles.weightCaption}>Your weight</Text>
          <Text style={styles.weightValue}>
            {displayWeight} <Text style={styles.weightUnit}>{unit.toLowerCase()}</Text>
          </Text>
          <WeightSlider
            value={weight}
            onChange={setWeight}
          />
        </View>

        {/* Pace selection */}
        <Text style={styles.sectionTitle}>Preferred pace</Text>
        <View style={styles.paceList}>
          {PACES.map((item) => {
            const isSelected = pace === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => setPace(item.id)}
                style={[styles.paceCard, isSelected && styles.paceCardActive]}
              >
                <View style={styles.paceLeft}>
                  <Text style={[styles.paceLabel, isSelected && styles.paceLabelActive]}>
                    {item.label}
                  </Text>
                  <Text style={styles.paceRate}>{item.rate}</Text>
                </View>
                <View style={styles.paceRight}>
                  <View style={[
                    styles.paceBadge,
                    item.id === 'moderate' && styles.paceBadgeHighlight,
                  ]}>
                    <Text style={[
                      styles.paceBadgeText,
                      item.id === 'moderate' && styles.paceBadgeTextHighlight,
                    ]}>
                      {item.badge}
                    </Text>
                  </View>
                  <View style={[styles.radio, isSelected && styles.radioActive]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Calculate My Targets"
          size="lg"
          variant="primary"
          fullWidth
          onPress={() => router.push('/(auth)/plan-preview' as any)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surfaceBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screenMargin,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(19,19,19,0.05)',
  },
  skipText: {
    fontFamily: theme.fonts.medium, fontSize: 14,
    color: theme.colors.textSecondary, marginLeft: 10,
  },
  scroll: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: 20, paddingBottom: 20,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 28, lineHeight: 36,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5, marginBottom: 24,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(19,19,19,0.07)',
    borderRadius: 14,
    padding: 4,
    alignSelf: 'center',
    marginBottom: 20,
  },
  unitBtn: {
    paddingHorizontal: 24, paddingVertical: 8,
    borderRadius: 10,
  },
  unitBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  unitText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14, color: theme.colors.textSecondary,
  },
  unitTextActive: {
    color: theme.colors.textPrimary,
  },
  weightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(19,19,19,0.07)',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  weightCaption: {
    fontFamily: theme.fonts.medium,
    fontSize: 13, color: theme.colors.textMuted,
    textAlign: 'center', marginBottom: 4,
  },
  weightValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 52, lineHeight: 62,
    color: theme.colors.textPrimary,
    textAlign: 'center', letterSpacing: -1,
  },
  weightUnit: {
    fontFamily: theme.fonts.regular,
    fontSize: 24, color: theme.colors.textSecondary,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 17, color: theme.colors.textPrimary,
    marginBottom: 14,
  },
  paceList: { gap: 12 },
  paceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18, paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(19,19,19,0.07)',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  paceCardActive: {
    borderColor: theme.colors.saffron,
    borderWidth: 2,
    backgroundColor: '#FFFBF5',
  },
  paceLeft: { flex: 1 },
  paceLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 15, color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  paceLabelActive: { color: theme.colors.textPrimary },
  paceRate: {
    fontFamily: theme.fonts.medium,
    fontSize: 13, color: theme.colors.saffron,
  },
  paceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paceBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(19,19,19,0.07)',
  },
  paceBadgeHighlight: {
    backgroundColor: 'rgba(255,145,20,0.15)',
  },
  paceBadgeText: {
    fontFamily: theme.fonts.medium,
    fontSize: 11, color: theme.colors.textSecondary,
  },
  paceBadgeTextHighlight: {
    color: theme.colors.saffron,
  },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(19,19,19,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: theme.colors.saffron },
  radioDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: theme.colors.saffron,
  },
  footer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingBottom: 32, paddingTop: 12,
  },
});
