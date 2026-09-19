import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sparkles, ArrowRight, UserPlus } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, Card, ProgressRing } from '../../src/components';

export default function PlanPreviewScreen() {
  const router = useRouter();

  // Multi-segment targets: 1,900 kcal
  // Carbs: 215g, Protein: 140g, Fat: 53g with original macro colors
  const previewSegments = [
    { color: theme.colors.green, calories: 860, value: 215, label: 'Carbs' },
    { color: theme.colors.blue, calories: 560, value: 140, label: 'Protein' },
    { color: theme.colors.yellow, calories: 480, value: 53, label: 'Fat' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header with Back + Brand + Segmented Progress Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>NutraAI</Text>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Friendly AI Coach Speech Bubble */}
        <View style={styles.speechBubbleWrapper}>
          <View style={styles.speechBubble}>
            <Text style={styles.speechBubbleText}>Your daily targets 🎉</Text>
          </View>
        </View>

        {/* Calculated Calories Hero Ring Card */}
        <Card style={styles.ringCard} padding="lg">
          <ProgressRing
            size={190}
            strokeWidth={15}
            segments={previewSegments}
            totalTarget={1900}
            centerValue="1,900"
            centerLabel="DAILY TARGET"
            centerSublabel="KCAL / DAY"
          />

          {/* Energy Breakdown Grid */}
          <View style={styles.energyStatsRow}>
            <View style={styles.eStatCol}>
              <Text style={styles.eStatLabel}>Basal Burn</Text>
              <Text style={styles.eStatVal}>1,550 kcal</Text>
              <Text style={styles.eStatSub}>BMR</Text>
            </View>

            <View style={styles.eDivider} />

            <View style={styles.eStatCol}>
              <Text style={styles.eStatLabel}>Total Expenditure</Text>
              <Text style={styles.eStatVal}>2,400 kcal</Text>
              <Text style={styles.eStatSub}>TDEE</Text>
            </View>

            <View style={styles.eDivider} />

            <View style={styles.eStatCol}>
              <Text style={styles.eStatLabel}>Safe Deficit</Text>
              <Text style={[styles.eStatVal, { color: theme.colors.scarlet }]}>-500 kcal</Text>
              <Text style={styles.eStatSub}>Deficit</Text>
            </View>
          </View>
        </Card>

        {/* Macro Distribution Card */}
        <Card style={styles.macrosCard} padding="lg">
          <Text style={styles.sectionTitle}>Macronutrient Distribution</Text>

          {/* Carbs */}
          <View style={styles.macroRow}>
            <View style={styles.macroLeft}>
              <View style={[styles.macroDot, { backgroundColor: theme.colors.green }]} />
              <View>
                <Text style={styles.macroName}>Carbohydrates</Text>
                <Text style={styles.macroSub}>Clean fuel for brain and daily activities</Text>
              </View>
            </View>
            <View style={styles.macroRight}>
              <Text style={styles.macroGrams}>215g</Text>
              <Text style={styles.macroPercent}>45%</Text>
            </View>
          </View>

          {/* Protein */}
          <View style={styles.macroRow}>
            <View style={styles.macroLeft}>
              <View style={[styles.macroDot, { backgroundColor: theme.colors.blue }]} />
              <View>
                <Text style={styles.macroName}>Protein</Text>
                <Text style={styles.macroSub}>Preserves lean muscle and maximizes satiety</Text>
              </View>
            </View>
            <View style={styles.macroRight}>
              <Text style={styles.macroGrams}>140g</Text>
              <Text style={styles.macroPercent}>30%</Text>
            </View>
          </View>

          {/* Fat */}
          <View style={styles.macroRow}>
            <View style={styles.macroLeft}>
              <View style={[styles.macroDot, { backgroundColor: theme.colors.yellow }]} />
              <View>
                <Text style={styles.macroName}>Dietary Fat</Text>
                <Text style={styles.macroSub}>Supports healthy hormones and nutrient absorption</Text>
              </View>
            </View>
            <View style={styles.macroRight}>
              <Text style={styles.macroGrams}>53g</Text>
              <Text style={styles.macroPercent}>25%</Text>
            </View>
          </View>
        </Card>

        {/* Minimalist Note Banner */}
        <Card variant="default" padding="md" style={styles.aiTipCard}>
          <View style={styles.aiTipRow}>
            <Sparkles size={20} color={theme.colors.saffron} />
            <Text style={styles.aiTipText}>
              This target plan is fully adaptive. NutraAI will refine your targets as you log meals.
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <Button
          title="Start Tracking"
          size="lg"
          variant="primary"
          fullWidth
          rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
          onPress={() => router.replace('/(main)')}
        />

        <Button
          title="Create Account to Save Plan"
          variant="ghost"
          fullWidth
          leftIcon={<UserPlus size={16} color={theme.colors.saffron} />}
          onPress={() => router.push('/(auth)/register')}
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
  brandTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  speechBubbleWrapper: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(19, 19, 19, 0.06)',
    ...theme.shadows.elevation1,
  },
  speechBubbleText: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  ringCard: {
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: theme.spacing.md,
  },
  energyStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(19, 19, 19, 0.06)',
  },
  eStatCol: {
    alignItems: 'center',
    flex: 1,
  },
  eDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(19, 19, 19, 0.08)',
  },
  eStatLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  eStatVal: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  eStatSub: {
    fontFamily: theme.fonts.bold,
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  macrosCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginBottom: 14,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(19, 19, 19, 0.04)',
  },
  macroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  macroDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  macroName: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  macroSub: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  macroRight: {
    alignItems: 'flex-end',
  },
  macroGrams: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  macroPercent: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  aiTipCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  aiTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiTipText: {
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingBottom: 28,
    paddingTop: 8,
    gap: 4,
    backgroundColor: theme.colors.surfaceBase,
  },
});
