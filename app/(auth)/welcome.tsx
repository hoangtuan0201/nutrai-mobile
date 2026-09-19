import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Scan } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button } from '../../src/components';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Top Stepper Indicator (1 - 2 - 3) */}
        <View style={styles.stepperRow}>
          <View style={[styles.stepCircle, styles.stepActive]}>
            <Text style={styles.stepActiveText}>1</Text>
          </View>
          <View style={styles.stepConnector} />
          <View style={styles.stepCircle}>
            <Text style={styles.stepText}>2</Text>
          </View>
          <View style={styles.stepConnector} />
          <View style={styles.stepCircle}>
            <Text style={styles.stepText}>3</Text>
          </View>
        </View>

        {/* Center Hero Card with Food Scan Preview */}
        <View style={styles.heroSection}>
          <View style={styles.heroCard}>
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
                }}
                style={styles.foodImage}
              />
              {/* Scan Laser Line Overlay in Saffron */}
              <View style={styles.scanLaser} />
              <View style={styles.scanCorners} />
            </View>
            <View style={styles.analyzingBadge}>
              <Sparkles size={14} color={theme.colors.saffron} />
              <Text style={styles.analyzingText}>NutraAI is analyzing</Text>
            </View>
          </View>

          {/* Logo Mark & Minimalist Headline */}
          <View style={styles.brandGroup}>
            <View style={styles.logoBadge}>
              <Scan size={22} color={theme.colors.saffron} strokeWidth={2.4} />
            </View>
            <Text style={styles.headline}>
              Precise AI{'\n'}Easy Logging
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceBase,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.screenMargin,
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 28,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(19, 19, 19, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: {
    backgroundColor: theme.colors.saffron,
  },
  stepActiveText: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  stepText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  stepConnector: {
    width: 36,
    height: 2,
    backgroundColor: 'rgba(19, 19, 19, 0.1)',
    marginHorizontal: 8,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    width: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    alignItems: 'center',
    ...theme.shadows.elevation2,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  scanLaser: {
    position: 'absolute',
    top: '48%',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.colors.saffron,
    shadowColor: theme.colors.saffron,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  scanCorners: {
    ...StyleSheet.absoluteFill,
    borderWidth: 2,
    borderColor: 'rgba(255, 145, 20, 0.4)',
    borderRadius: 18,
  },
  analyzingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  analyzingText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  brandGroup: {
    alignItems: 'center',
    marginTop: 26,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 145, 20, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headline: {
    fontFamily: theme.fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
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
