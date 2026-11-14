/**
 * gender.tsx — Onboarding Step 2: "What's your gender?"
 * Clean cards for Male, Female, and Non-binary with distinct SVG biological sex symbols
 * matching image.png with NutraAI styling.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { theme } from '../../src/constants';
import { Button, OnboardingHeader } from '../../src/components';
import { useOnboardingStore, GenderType } from '../../src/store/onboardingStore';

function MarsIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={9.5} cy={14.5} r={5.5} />
      <Line x1={13.5} y1={10.5} x2={20} y2={4} />
      <Polyline points="15 4 20 4 20 9" />
    </Svg>
  );
}

function VenusIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={12} cy={9} r={5.5} />
      <Line x1={12} y1={14.5} x2={12} y2={21} />
      <Line x1={8.5} y1={18} x2={15.5} y2={18} />
    </Svg>
  );
}

const GENDER_OPTIONS: {
  id: GenderType;
  label: string;
  icon: (props: { color: string }) => React.JSX.Element;
}[] = [
  { id: 'MALE', label: 'Male', icon: MarsIcon },
  { id: 'FEMALE', label: 'Female', icon: VenusIcon },
];

export default function GenderScreen() {
  const router = useRouter();
  const storedGender = useOnboardingStore((s) => s.gender);
  const setGender = useOnboardingStore((s) => s.setGender);

  const [selectedGender, setSelectedGender] = useState<GenderType>(
    storedGender === 'FEMALE' ? 'FEMALE' : 'MALE',
  );

  const handleNext = () => {
    setGender(selectedGender);
    router.push('/(auth)/birth-year' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <OnboardingHeader step={2} totalSteps={7} />

      <View style={styles.body}>
        <Text style={styles.title}>What's your{'\n'}gender?</Text>
        <Text style={styles.subtitle}>
          We use biological sex to calculate baseline metabolic rate accurately.
        </Text>

        <View style={styles.optionsList}>
          {GENDER_OPTIONS.map((item) => {
            const isSelected = selectedGender === item.id;
            const IconComponent = item.icon;
            const iconColor = isSelected
              ? theme.colors.saffron
              : theme.colors.textSecondary;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => setSelectedGender(item.id)}
                style={[styles.card, isSelected && styles.cardActive]}
              >
                <View
                  style={[
                    styles.iconBubble,
                    isSelected && styles.iconBubbleActive,
                  ]}
                >
                  <IconComponent color={iconColor} />
                </View>

                <Text
                  style={[
                    styles.cardLabel,
                    isSelected && styles.cardLabelActive,
                  ]}
                >
                  {item.label}
                </Text>

                <View style={[styles.radio, isSelected && styles.radioActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceBase,
  },
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: 24,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 30,
    lineHeight: 38,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    marginBottom: 28,
  },
  optionsList: {
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(19, 19, 19, 0.07)',
    gap: 16,
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
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(19, 19, 19, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleActive: {
    backgroundColor: 'rgba(255, 145, 20, 0.12)',
  },
  cardLabel: {
    flex: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  cardLabelActive: {
    color: theme.colors.textPrimary,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(19, 19, 19, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: theme.colors.saffron,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.saffron,
  },
  footer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingBottom: 32,
    paddingTop: 12,
  },
});
