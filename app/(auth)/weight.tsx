/**
 * weight.tsx — Onboarding Step 5: "What's your current weight?"
 * Clean, simple numeric form input with kg/lbs toggle and live BMI assessment card.
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Minus, Plus, Info } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, OnboardingHeader } from '../../src/components';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import {
  kgToLb,
  lbToKg,
  calculateBMI,
} from '../../src/utils/nutritionCalculator';

type WeightUnit = 'kg' | 'lbs';

export default function WeightScreen() {
  const router = useRouter();
  const setWeightKg = useOnboardingStore((s) => s.setWeightKg);
  const storedWeight = useOnboardingStore((s) => s.weightKg) || 70;
  const storedHeight = useOnboardingStore((s) => s.heightCm) || 170;

  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [valString, setValString] = useState<string>(storedWeight.toFixed(1));

  const currentKg = useMemo(() => {
    const parsed = parseFloat(valString) || 70;
    return unit === 'kg' ? parsed : lbToKg(parsed);
  }, [valString, unit]);

  const handleUnitToggle = (newUnit: WeightUnit) => {
    if (newUnit === unit) return;
    const current = parseFloat(valString) || 70;
    if (newUnit === 'lbs') {
      setValString(kgToLb(current).toFixed(1));
    } else {
      setValString(lbToKg(current).toFixed(1));
    }
    setUnit(newUnit);
  };

  const adjustValue = (delta: number) => {
    const current = parseFloat(valString) || 70;
    const next = Math.max(20, Math.min(300, current + delta));
    setValString(next.toFixed(1));
  };

  // Live BMI feedback
  const bmiInfo = useMemo(() => {
    return calculateBMI(currentKg, storedHeight);
  }, [currentKg, storedHeight]);

  const handleNext = () => {
    const clampedKg = Math.max(30, Math.min(250, currentKg));
    setWeightKg(Math.round(clampedKg * 10) / 10);
    router.push('/(auth)/goal-preferences' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <OnboardingHeader step={5} totalSteps={7} />

            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header Row: Title & Unit Toggle */}
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.title}>What's your{'\n'}current weight?</Text>
                  <Text style={styles.subtitle}>
                    Used to calculate your daily energy balance and macros.
                  </Text>
                </View>

                <View style={styles.unitToggle}>
                  <TouchableOpacity
                    style={[styles.unitBtn, unit === 'kg' && styles.unitBtnActive]}
                    onPress={() => handleUnitToggle('kg')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.unitText,
                        unit === 'kg' && styles.unitTextActive,
                      ]}
                    >
                      kg
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unitBtn, unit === 'lbs' && styles.unitBtnActive]}
                    onPress={() => handleUnitToggle('lbs')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.unitText,
                        unit === 'lbs' && styles.unitTextActive,
                      ]}
                    >
                      lbs
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form Input Card */}
              <View style={styles.card}>
                <View style={styles.inputRow}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => adjustValue(-0.5)}
                    activeOpacity={0.7}
                  >
                    <Minus size={22} color={theme.colors.textPrimary} />
                  </TouchableOpacity>

                  <View style={styles.numericWrap}>
                    <TextInput
                      style={styles.numericInput}
                      value={valString}
                      onChangeText={setValString}
                      keyboardType="decimal-pad"
                      maxLength={5}
                      selectTextOnFocus
                    />
                    <Text style={styles.unitLabel}>{unit}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => adjustValue(0.5)}
                    activeOpacity={0.7}
                  >
                    <Plus size={22} color={theme.colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dynamic BMI Feedback Card */}
              <View style={styles.bmiCard}>
                <View style={styles.bmiHeaderRow}>
                  <Text style={styles.bmiTitle}>
                    Your BMI: <Text style={styles.bmiValueText}>{bmiInfo.bmi}</Text>
                  </Text>
                  <View
                    style={[
                      styles.bmiBadge,
                      { backgroundColor: bmiInfo.categoryBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.bmiBadgeText,
                        { color: bmiInfo.categoryColor },
                      ]}
                    >
                      {bmiInfo.categoryLabel}
                    </Text>
                  </View>
                </View>

                <Text style={styles.bmiMessage}>{bmiInfo.message}</Text>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Button
                title="Continue"
                size="lg"
                variant="primary"
                fullWidth
                onPress={handleNext}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceBase,
  },
  inner: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 30,
    lineHeight: 38,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
    maxWidth: 220,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(19, 19, 19, 0.07)',
    borderRadius: 14,
    padding: 3,
    marginTop: 4,
  },
  unitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 11,
  },
  unitBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  unitText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  unitTextActive: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(19, 19, 19, 0.07)',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(19, 19, 19, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numericWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  numericInput: {
    fontFamily: theme.fonts.extraBold,
    fontSize: 54,
    color: theme.colors.textPrimary,
    letterSpacing: -1,
    minWidth: 120,
    textAlign: 'center',
    paddingVertical: 0,
  },
  unitLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 22,
    color: theme.colors.textSecondary,
  },
  bmiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(19, 19, 19, 0.07)',
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    gap: 8,
  },
  bmiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bmiTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  bmiValueText: {
    fontFamily: theme.fonts.extraBold,
    color: theme.colors.textPrimary,
  },
  bmiBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  bmiBadgeText: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
  },
  bmiMessage: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },
  footer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingBottom: 32,
    paddingTop: 12,
  },
});
