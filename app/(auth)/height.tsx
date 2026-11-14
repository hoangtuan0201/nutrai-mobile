/**
 * height.tsx — Onboarding Step 4: "What's your height?"
 * Clean, simple, and intuitive numeric form input with cm/ft unit toggle.
 */
import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Minus, Plus } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, OnboardingHeader } from '../../src/components';
import { useOnboardingStore } from '../../src/store/onboardingStore';

type HeightUnit = 'cm' | 'ft';

export default function HeightScreen() {
  const router = useRouter();
  const setHeightCm = useOnboardingStore((s) => s.setHeightCm);
  const storedHeight = useOnboardingStore((s) => s.heightCm);
  const initialCm = storedHeight && storedHeight >= 80 ? storedHeight : 170;

  const [unit, setUnit] = useState<HeightUnit>('cm');
  const [cmValue, setCmValue] = useState<string>(initialCm.toString());

  // Feet and inches initial state (default 170 cm -> 67 in -> 5 ft 7 in)
  const initialTotalInches = Math.round(initialCm / 2.54);
  const [feetValue, setFeetValue] = useState<string>(
    Math.floor(initialTotalInches / 12).toString(),
  );
  const [inchValue, setInchValue] = useState<string>(
    (initialTotalInches % 12).toString(),
  );

  const handleUnitToggle = (newUnit: HeightUnit) => {
    if (newUnit === unit) return;

    if (newUnit === 'ft') {
      const parsedCm = parseInt(cmValue, 10) || 170;
      const clampedCm = Math.max(80, Math.min(250, parsedCm));
      const totalInches = Math.round(clampedCm / 2.54);
      setFeetValue(Math.floor(totalInches / 12).toString());
      setInchValue((totalInches % 12).toString());
    } else {
      const ft = parseInt(feetValue, 10) || 0;
      const inch = parseInt(inchValue, 10) || 0;
      const totalInches = ft * 12 + inch;
      const totalCm = Math.round(totalInches * 2.54);
      const validCm = Math.max(80, Math.min(250, totalCm || 170));
      setCmValue(validCm.toString());
    }
    setUnit(newUnit);
  };

  const adjustCm = (delta: number) => {
    const current = parseInt(cmValue, 10) || 170;
    const next = Math.max(80, Math.min(250, current + delta));
    setCmValue(next.toString());
    const totalInches = Math.round(next / 2.54);
    setFeetValue(Math.floor(totalInches / 12).toString());
    setInchValue((totalInches % 12).toString());
  };

  const adjustFtIn = (deltaInches: number) => {
    let currentFt = parseInt(feetValue, 10);
    let currentIn = parseInt(inchValue, 10);
    if (isNaN(currentFt) || isNaN(currentIn)) {
      currentFt = 5;
      currentIn = 7;
    }
    const currentTotalInches = currentFt * 12 + currentIn;
    // Bounds: 80cm (~31 in: 2ft 7in) to 250cm (~98 in: 8ft 2in)
    const nextTotalInches = Math.max(31, Math.min(98, currentTotalInches + deltaInches));
    const nextFt = Math.floor(nextTotalInches / 12);
    const nextIn = nextTotalInches % 12;

    setFeetValue(nextFt.toString());
    setInchValue(nextIn.toString());
    const nextCm = Math.round(nextTotalInches * 2.54);
    setCmValue(nextCm.toString());
  };

  const handleCmChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    setCmValue(clean);
    const parsed = parseInt(clean, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const totalInches = Math.round(parsed / 2.54);
      setFeetValue(Math.floor(totalInches / 12).toString());
      setInchValue((totalInches % 12).toString());
    }
  };

  const handleFeetChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    setFeetValue(clean);
    const ft = parseInt(clean, 10) || 0;
    const inch = parseInt(inchValue, 10) || 0;
    const totalCm = Math.round((ft * 12 + inch) * 2.54);
    if (totalCm > 0) {
      setCmValue(totalCm.toString());
    }
  };

  const handleInchChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    setInchValue(clean);
    const ft = parseInt(feetValue, 10) || 0;
    const inch = parseInt(clean, 10) || 0;
    const totalCm = Math.round((ft * 12 + inch) * 2.54);
    if (totalCm > 0) {
      setCmValue(totalCm.toString());
    }
  };

  const handleNext = () => {
    let finalCm: number;
    if (unit === 'cm') {
      finalCm = parseInt(cmValue, 10) || 170;
    } else {
      const ft = parseFloat(feetValue) || 0;
      const inch = parseFloat(inchValue) || 0;
      finalCm = Math.round((ft * 12 + inch) * 2.54);
    }

    const clampedCm = Math.max(80, Math.min(250, finalCm || 170));
    setHeightCm(clampedCm);
    router.push('/(auth)/weight' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <OnboardingHeader step={4} totalSteps={7} />

            <View style={styles.body}>
              {/* Title & Unit Toggle Row */}
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.title}>What's your{'\n'}height?</Text>
                  <Text style={styles.subtitle}>
                    Used to calculate your BMI and basal energy needs.
                  </Text>
                </View>

                <View style={styles.unitToggle}>
                  <TouchableOpacity
                    style={[styles.unitBtn, unit === 'cm' && styles.unitBtnActive]}
                    onPress={() => handleUnitToggle('cm')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.unitText,
                        unit === 'cm' && styles.unitTextActive,
                      ]}
                    >
                      cm
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unitBtn, unit === 'ft' && styles.unitBtnActive]}
                    onPress={() => handleUnitToggle('ft')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.unitText,
                        unit === 'ft' && styles.unitTextActive,
                      ]}
                    >
                      ft
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form Input Card */}
              <View style={styles.card}>
                {unit === 'cm' ? (
                  <View style={styles.inputRow}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => adjustCm(-1)}
                      activeOpacity={0.7}
                    >
                      <Minus size={22} color={theme.colors.textPrimary} />
                    </TouchableOpacity>

                    <View style={styles.numericWrap}>
                      <TextInput
                        style={styles.numericInput}
                        value={cmValue}
                        onChangeText={handleCmChange}
                        keyboardType="number-pad"
                        maxLength={3}
                        selectTextOnFocus
                      />
                      <Text style={styles.unitLabel}>cm</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => adjustCm(1)}
                      activeOpacity={0.7}
                    >
                      <Plus size={22} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.inputRow}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => adjustFtIn(-1)}
                      activeOpacity={0.7}
                    >
                      <Minus size={22} color={theme.colors.textPrimary} />
                    </TouchableOpacity>

                    <View style={styles.ftRow}>
                      <View style={styles.ftField}>
                        <TextInput
                          style={styles.ftInput}
                          value={feetValue}
                          onChangeText={handleFeetChange}
                          keyboardType="number-pad"
                          maxLength={1}
                          selectTextOnFocus
                        />
                        <Text style={styles.ftLabel}>ft</Text>
                      </View>

                      <View style={styles.ftDivider} />

                      <View style={styles.ftField}>
                        <TextInput
                          style={styles.ftInput}
                          value={inchValue}
                          onChangeText={handleInchChange}
                          keyboardType="number-pad"
                          maxLength={2}
                          selectTextOnFocus
                        />
                        <Text style={styles.ftLabel}>in</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => adjustFtIn(1)}
                      activeOpacity={0.7}
                    >
                      <Plus size={22} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

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
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: 16,
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
    fontSize: 56,
    color: theme.colors.textPrimary,
    letterSpacing: -1,
    minWidth: 100,
    textAlign: 'center',
    paddingVertical: 0,
  },
  unitLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 22,
    color: theme.colors.textSecondary,
  },
  ftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  ftField: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  ftInput: {
    fontFamily: theme.fonts.extraBold,
    fontSize: 50,
    color: theme.colors.textPrimary,
    minWidth: 42,
    textAlign: 'center',
    paddingVertical: 0,
  },
  ftLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  ftDivider: {
    width: 1.5,
    height: 44,
    backgroundColor: 'rgba(19, 19, 19, 0.10)',
  },
  footer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingBottom: 32,
    paddingTop: 12,
  },
});
