import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles, Camera, Zap, ShieldCheck } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, Logo } from '../../src/components';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
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

        {/* Center Hero Section */}
        <View style={styles.heroSection}>
          {/* Minimalist Preview Card */}
          <View style={styles.heroCard}>
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
                }}
                style={styles.foodImage}
                resizeMode="cover"
              />
              {/* Floating Macro Badges on Image */}
              <View style={styles.macroBadge}>
                <View style={styles.macroDotGreen} />
                <Text style={styles.macroText}>34g Protein • 520 kcal</Text>
              </View>
            </View>

            {/* AI Nutrition Pill Under Image */}
            <View style={styles.nutritionMeta}>
              <View style={styles.metaItem}>
                <Logo variant="mark" size="sm" />
                <Text style={styles.metaLabel}>AI Precision 98%</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Zap size={14} color={theme.colors.saffron} />
                <Text style={styles.metaLabel}>Instant Scan</Text>
              </View>
            </View>
          </View>

          {/* Minimalist Brand Typography */}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    ...theme.shadows.elevation2,
  },
  imageContainer: {
    width: '100%',
    height: 190,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  macroBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(19, 19, 19, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8EDC5E',
  },
  macroText: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  nutritionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 4,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(19, 19, 19, 0.1)',
  },
  textGroup: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  headline: {
    fontFamily: theme.fonts.bold,
    fontSize: 30,
    lineHeight: 36,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(19, 19, 19, 0.06)',
  },
  featureChipText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 11,
    color: theme.colors.textPrimary,
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
