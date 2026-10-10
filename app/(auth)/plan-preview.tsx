import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Flame,
  Info,
  BicepsFlexed,
  Wheat,
  Droplet,
  ChevronRight,
  Leaf,
} from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, Logo } from '../../src/components';
import { useAuthStore } from '../../src/store/authStore';

export default function PlanPreviewScreen() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const isLoggedIn = Boolean(user || accessToken);
  const params = useLocalSearchParams<{
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
  }>();

  // Target values from params or reference defaults (2,350 kcal / 120g / 290g / 70g)
  const calories = params.calories || '2,350';
  const protein = params.protein || '120';
  const carbs = params.carbs || '290';
  const fat = params.fat || '70';

  const handleContinue = () => {
    if (isLoggedIn) {
      router.replace('/(main)');
    } else {
      router.push('/(auth)/register');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header with Back + Brand + Progress Bar (100% completed) */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <Logo variant="full" size="sm" />

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Badge: Your starting targets */}
          <View style={styles.badgeRow}>
            <View style={styles.startingBadge}>
              <Text style={styles.startingBadgeText}>Your starting targets</Text>
            </View>
          </View>

          {/* Heading Section */}
          <View style={styles.headingSection}>
            <Text style={styles.title}>
              Your daily{'\n'}nutrition <Text style={styles.titleHighlight}>plan</Text>
            </Text>
            <Text style={styles.subtitle}>
              Here is your estimated daily nutrition plan. You can adjust it later in settings.
            </Text>
          </View>

          {/* Daily Calorie Estimate Hero Card (Forest Green #1E2F25) */}
          <View style={styles.calorieCard}>
            <View style={styles.calorieHeader}>
              <View style={styles.calorieTitleRow}>
                <Flame size={18} color={theme.colors.saffron} />
                <Text style={styles.calorieCardTitle}>Daily calorie estimate</Text>
              </View>
              <View style={styles.estimateBadge}>
                <Text style={styles.estimateBadgeText}>Estimate</Text>
              </View>
            </View>

            <Text style={styles.calorieNumber}>{calories} kcal</Text>

            <View style={styles.calorieInfoRow}>
              <Info size={14} color="rgba(255, 255, 255, 0.65)" />
              <Text style={styles.calorieInfoText}>
                Illustrative value — calculate from the user's submitted profile.
              </Text>
            </View>

            {/* Subtle background decorative leaf */}
            <View style={styles.watermarkLeaf}>
              <Leaf size={110} color="rgba(255, 255, 255, 0.05)" />
            </View>
          </View>

          {/* Suggested Macro Targets */}
          <View style={styles.macroSection}>
            <Text style={styles.macroSectionTitle}>Suggested macro targets</Text>

            <View style={styles.macroGrid}>
              {/* Protein Card */}
              <View style={styles.macroCard}>
                <View
                  style={[
                    styles.macroIconWrap,
                    { backgroundColor: 'rgba(136, 168, 247, 0.22)' },
                  ]}
                >
                  <BicepsFlexed size={20} color={theme.colors.blue} />
                </View>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>{protein} g</Text>
              </View>

              {/* Carbs Card */}
              <View style={styles.macroCard}>
                <View
                  style={[
                    styles.macroIconWrap,
                    { backgroundColor: 'rgba(142, 220, 94, 0.22)' },
                  ]}
                >
                  <Wheat size={20} color={theme.colors.green} />
                </View>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>{carbs} g</Text>
              </View>

              {/* Fat Card */}
              <View style={styles.macroCard}>
                <View
                  style={[
                    styles.macroIconWrap,
                    { backgroundColor: 'rgba(253, 217, 34, 0.25)' },
                  ]}
                >
                  <Droplet size={20} color={theme.colors.yellow} />
                </View>
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroValue}>{fat} g</Text>
              </View>
            </View>
          </View>

          {/* Info Callout Box */}
          <View style={styles.calloutCard}>
            <Info
              size={16}
              color={theme.colors.textSecondary}
              style={styles.calloutIcon}
            />
            <Text style={styles.calloutText}>
              These numbers are estimates based on your profile and goal. You can edit them anytime in Settings.
            </Text>
            <ChevronRight size={16} color={theme.colors.textSecondary} />
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Button
            title="Continue"
            size="lg"
            variant="primary"
            fullWidth
            onPress={handleContinue}
          />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backLink}
          >
            <Text style={styles.backLinkText}>Back</Text>
          </TouchableOpacity>
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
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19, 19, 19, 0.04)',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(19, 19, 19, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginLeft: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.saffron,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: 8,
    paddingBottom: 24,
  },
  badgeRow: {
    marginTop: 4,
    marginBottom: 10,
  },
  startingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(200, 194, 155, 0.35)',
  },
  startingBadgeText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#3F3C31',
  },
  headingSection: {
    marginBottom: 20,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 34,
    lineHeight: 40,
    color: theme.colors.textPrimary,
    letterSpacing: -0.6,
  },
  titleHighlight: {
    fontFamily: theme.fonts.extraBold,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  calorieCard: {
    backgroundColor: '#1E2F25',
    borderRadius: 24,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.elevation2,
  },
  calorieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calorieTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calorieCardTitle: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: '#FFFFFF',
  },
  estimateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  estimateBadgeText: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  calorieNumber: {
    fontFamily: theme.fonts.bold,
    fontSize: 38,
    lineHeight: 46,
    color: '#FFFFFF',
    marginVertical: 14,
    letterSpacing: -0.5,
  },
  calorieInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calorieInfoText: {
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.72)',
  },
  watermarkLeaf: {
    position: 'absolute',
    right: -14,
    bottom: -16,
    transform: [{ rotate: '-15deg' }],
    pointerEvents: 'none',
  },
  macroSection: {
    marginTop: 22,
  },
  macroSectionTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 17,
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(19, 19, 19, 0.05)',
    ...theme.shadows.elevation1,
  },
  macroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  macroLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  macroValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 19,
    color: theme.colors.textPrimary,
    marginTop: 4,
  },
  calloutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 194, 155, 0.22)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 18,
  },
  calloutIcon: {
    marginRight: 10,
  },
  calloutText: {
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: '#4A483E',
    marginRight: 6,
  },
  footer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 8,
    backgroundColor: 'transparent',
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backLinkText: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});

