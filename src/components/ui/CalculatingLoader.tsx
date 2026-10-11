/**
 * CalculatingLoader — fullscreen animated "Calculating..." overlay
 * Used in plan-preview screen while computing BMR/TDEE/macros.
 *
 * Shows pulsing NutraAI brand animation + progress dots + tip text.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { theme } from '../../constants';
import { Logo } from './Logo';

const STEPS = [
  'Analysing your body metrics…',
  'Calculating your BMR…',
  'Applying activity multiplier…',
  'Determining macro split…',
  'Building your nutrition plan…',
];

export interface CalculatingLoaderProps {
  visible?: boolean;
}

export const CalculatingLoader: React.FC<CalculatingLoaderProps> = ({ visible = true }) => {
  const pulseAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const stepIndex = useRef(new Animated.Value(0)).current;
  const [currentStep, setCurrentStep] = React.useState(0);

  useEffect(() => {
    if (!visible) return;

    // Fade in
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Pulse loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Cycle through steps
    let i = 0;
    const stepTimer = setInterval(() => {
      i = (i + 1) % STEPS.length;
      setCurrentStep(i);
    }, 1100);

    return () => {
      pulseLoop.stop();
      clearInterval(stepTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
      <View style={styles.card}>
        {/* Pulsing Logo in Circle */}
        <Animated.View style={[styles.logoCircle, { transform: [{ scale: pulseAnim }] }]}>
          <Logo variant="full" size="md" />
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>Building your plan</Text>
        <Text style={styles.subtitle}>Personalizing every calorie for you</Text>

        {/* Animated step text */}
        <View style={styles.stepBox}>
          <Text style={styles.stepText}>{STEPS[currentStep]}</Text>
        </View>

        {/* Dot progress */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentStep && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: theme.colors.surfaceBase,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  card: {
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: theme.colors.saffron,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 26,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 36,
  },
  stepBox: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(19,19,19,0.07)',
    minWidth: 240,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  stepText: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(19,19,19,0.15)',
  },
  dotActive: {
    backgroundColor: theme.colors.saffron,
    width: 18,
  },
});
