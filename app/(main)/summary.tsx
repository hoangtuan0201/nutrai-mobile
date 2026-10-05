import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Flame, Award, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, Card, Pill, ProgressRing } from '../../src/components';

export default function DailySummaryScreen() {
  const router = useRouter();

  const weekStreak = [
    { day: 'M', completed: true },
    { day: 'T', completed: true },
    { day: 'W', completed: true },
    { day: 'T', completed: true },
    { day: 'F', completed: true },
    { day: 'S', completed: true },
    { day: 'S', completed: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Summary</Text>
        <Pill label="Day 7 🔥" variant="scarlet" size="sm" />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak Banner Card */}
        <Card style={styles.streakCard} padding="lg">
          <View style={styles.streakIconCircle}>
            <Flame size={40} color={theme.colors.scarlet} />
          </View>
          <Text style={styles.streakNumber}>7 Days</Text>
          <Text style={styles.streakTitle}>Logging Streak Active!</Text>
          <Text style={styles.streakDesc}>
            You've hit your nutrition and tracking targets 7 days in a row. Keep up the momentum!
          </Text>

          {/* Week Dots */}
          <View style={styles.weekDotsRow}>
            {weekStreak.map((item, index) => (
              <View key={index} style={styles.dotCol}>
                <View
                  style={[
                    styles.streakDot,
                    item.completed && styles.streakDotActive,
                  ]}
                >
                  {item.completed && <CheckCircle2 size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.dotDayLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Nutritional Quality Grade */}
        <Card style={styles.qualityCard} padding="lg">
          <View style={styles.qualityHeader}>
            <View>
              <Text style={styles.qualityTitle}>Nutrition Quality</Text>
              <Text style={styles.qualitySubtitle}>Macro balance & micronutrients</Text>
            </View>
            <View style={styles.gradeBadge}>
              <Text style={styles.gradeText}>A-</Text>
            </View>
          </View>

          <View style={styles.qualityStats}>
            <View style={styles.qStat}>
              <Text style={styles.qStatVal}>88%</Text>
              <Text style={styles.qStatLab}>Whole Foods</Text>
            </View>
            <View style={styles.qDivider} />
            <View style={styles.qStat}>
              <Text style={styles.qStatVal}>32g</Text>
              <Text style={styles.qStatLab}>Fiber Target</Text>
            </View>
            <View style={styles.qDivider} />
            <View style={styles.qStat}>
              <Text style={styles.qStatVal}>Optimal</Text>
              <Text style={styles.qStatLab}>Sodium</Text>
            </View>
          </View>
        </Card>

        {/* AI Insight */}
        <Card variant="flat" padding="md" style={styles.aiInsightCard}>
          <View style={styles.aiInsightRow}>
            <Sparkles size={22} color={theme.colors.saffron} />
            <View style={styles.aiInsightTextWrap}>
              <Text style={styles.aiInsightTitle}>AI Coach Observation</Text>
              <Text style={styles.aiInsightDesc}>
                Your protein intake was highest around lunch, supporting steady energy levels and muscle recovery throughout your afternoon workout.
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screenMargin,
    paddingVertical: theme.spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(19, 19, 19, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: theme.spacing.sm,
    paddingBottom: 40,
  },
  streakCard: {
    alignItems: 'center',
    borderRadius: 24,
    marginBottom: theme.spacing.lg,
  },
  streakIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(240, 75, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  streakNumber: {
    fontFamily: theme.fonts.bold,
    fontSize: 34,
    color: theme.colors.scarlet,
  },
  streakTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginTop: 2,
    marginBottom: 6,
  },
  streakDesc: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  weekDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(19, 19, 19, 0.06)',
  },
  dotCol: {
    alignItems: 'center',
  },
  streakDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(19, 19, 19, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  streakDotActive: {
    backgroundColor: theme.colors.scarlet,
  },
  dotDayLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  qualityCard: {
    borderRadius: 20,
    marginBottom: theme.spacing.lg,
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  qualityTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  qualitySubtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  gradeBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(142, 220, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#2E7D32',
  },
  qualityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.sm,
  },
  qStat: {
    alignItems: 'center',
  },
  qStatVal: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  qStatLab: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  qDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(19, 19, 19, 0.08)',
  },
  aiInsightCard: {
    backgroundColor: 'rgba(255, 145, 20, 0.08)',
    borderRadius: 18,
  },
  aiInsightRow: {
    flexDirection: 'row',
    gap: 12,
  },
  aiInsightTextWrap: {
    flex: 1,
  },
  aiInsightTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  aiInsightDesc: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
