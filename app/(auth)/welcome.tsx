/**
 * welcome.tsx — CaloriQ-inspired hero onboarding screen
 * Clean fullscreen hero with big illustration area, bold headline, and CTA.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Flame, Zap, Apple, Dumbbell, Salad, ChartPie } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, Logo } from '../../src/components';

const FLOATING_ICONS = [
  { icon: Flame, color: '#FF9114', size: 22, x: 0.15, y: 0.18, delay: 0 },
  { icon: Apple, color: '#8EDC5E', size: 20, x: 0.72, y: 0.12, delay: 400 },
  { icon: Dumbbell, color: '#88A8F7', size: 20, x: 0.82, y: 0.38, delay: 800 },
  { icon: Salad, color: '#FF9114', size: 22, x: 0.08, y: 0.40, delay: 600 },
  { icon: Zap, color: '#FDD922', size: 18, x: 0.80, y: 0.62, delay: 200 },
  { icon: ChartPie, color: '#F04B37', size: 20, x: 0.12, y: 0.65, delay: 1000 },
];

function FloatingIcon({
  Icon, color, size, x, y, delay,
}: {
  Icon: React.ElementType;
  color: string;
  size: number;
  x: number;
  y: number;
  delay: number;
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, {
              toValue: -8,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${x * 100}%` as any,
        top: `${y * 100}%` as any,
        opacity: opacityAnim,
        transform: [{ translateY: floatAnim }],
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 10,
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <Icon size={size} color={color} strokeWidth={2} />
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <ImageBackground
      source={require('../../assets/background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Hero Area with floating icons */}
        <View style={styles.heroArea}>
          {FLOATING_ICONS.map(({ icon: Icon, color, size, x, y, delay }, i) => (
            <FloatingIcon
              key={i}
              Icon={Icon}
              color={color}
              size={size}
              x={x}
              y={y}
              delay={delay}
            />
          ))}

          {/* Center brand logo */}
          <View style={styles.centerLogo}>
            <View style={styles.logoCircle}>
              <Logo variant="full" size="lg" />
            </View>
          </View>
        </View>

        {/* Bottom content - full bleed to bottom edge, no border radius */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              paddingBottom: Math.max(insets.bottom, 20) + 12,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.headline}>
            Monitor your daily{'\n'}
            <Text style={styles.headlineAccent}>calorie intake</Text> easily.
          </Text>
          <Text style={styles.subtitle}>
            Snap your meal, track macros, and unlock your personal AI nutritionist.
          </Text>

          <Button
            title="Get Started"
            size="lg"
            variant="primary"
            fullWidth
            onPress={() => router.push('/(auth)/goals' as any)}
          />

          <View style={styles.signInRow}>
            <Text style={styles.signInPrompt}>Already have an account? </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legalNotice}>
            By continuing, you agree to our{' '}
            <Text style={styles.legalLink}>Terms</Text> and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
          </Text>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  heroArea: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLogo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9114',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 14,
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 10,
  },
  headline: {
    fontFamily: theme.fonts.bold,
    fontSize: 30,
    lineHeight: 38,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 2,
  },
  headlineAccent: {
    color: theme.colors.saffron,
    fontFamily: theme.fonts.extraBold,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInPrompt: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  signInLink: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.saffron,
  },
  legalNotice: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLink: {
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
