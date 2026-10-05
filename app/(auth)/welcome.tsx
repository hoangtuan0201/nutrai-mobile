import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '../../src/constants';
import { Button, Logo } from '../../src/components';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require('../../assets/background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Top Header: Brand Logo & Step Indicator */}
          <View style={styles.topHeader}>
            <Logo variant="full" size="md" />
            <View style={styles.stepperRow}>
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={styles.stepDot} />
              <View style={styles.stepDot} />
            </View>
          </View>

          {/* Center Brand Typography */}
          <View style={styles.heroSection}>
            <View style={styles.textGroup}>
              <Text style={styles.headline}>
                Mindful Eating,{'\n'}Simplified.
              </Text>
              <Text style={styles.subtitle}>
                Snap your meal to log calories, balance macros, and unlock your personal AI nutritionist.
              </Text>
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={styles.footerSection}>
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
              <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
              <Text style={styles.legalLink}>Privacy Policy</Text>.
            </Text>
          </View>
        </View>
      </SafeAreaView>
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
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.screenMargin,
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 24,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(19, 19, 19, 0.15)',
  },
  stepDotActive: {
    width: 20,
    backgroundColor: theme.colors.saffron,
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  textGroup: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headline: {
    fontFamily: theme.fonts.bold,
    fontSize: 34,
    lineHeight: 42,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
  },
  footerSection: {
    gap: 12,
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
    paddingHorizontal: 16,
  },
  legalLink: {
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
