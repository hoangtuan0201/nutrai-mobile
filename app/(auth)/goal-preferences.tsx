import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Target, Calendar, Check } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, Input, Card, Logo } from '../../src/components';

export default function GoalPreferencesScreen() {
  const router = useRouter();

  const [targetWeight, setTargetWeight] = useState('63');
  const [selectedPace, setSelectedPace] = useState<'steady' | 'moderate' | 'aggressive'>('moderate');

  const paceOptions = [
    {
      id: 'steady' as const,
      title: 'Steady & Sustainable',
      rate: '~0.25 kg / week',
      desc: 'Gentle deficit, minimal hunger, easy long-term habit building',
      badge: 'Easy',
    },
    {
      id: 'moderate' as const,
      title: 'Optimal (Recommended)',
      rate: '~0.50 kg / week',
      desc: 'Clinically proven optimal rate for fat loss while preserving muscle',
      badge: 'Balanced',
    },
    {
      id: 'aggressive' as const,
      title: 'Aggressive & Focused',
      rate: '~0.75 kg / week',
      desc: 'Fast target attainment for upcoming milestones; requires strict discipline',
      badge: 'Challenging',
    },
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

        <Logo variant="full" size="sm" />

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '90%' }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Friendly AI Coach Speech Bubble */}
        <View style={styles.speechBubbleWrapper}>
          <View style={styles.speechBubble}>
            <Text style={styles.speechBubbleText}>Set your target</Text>
          </View>
        </View>

        {/* Target Weight Input */}
        <Input
          label="Target Weight (kg)"
          value={targetWeight}
          onChangeText={setTargetWeight}
          keyboardType="numeric"
          placeholder="e.g. 63"
          leftIcon={<Target size={18} color={theme.colors.saffron} />}
          helperText="The healthy target weight you aim to achieve"
        />

        {/* Pace Selection */}
        <Text style={styles.sectionTitle}>Preferred Pace of Change</Text>
        <View style={styles.paceList}>
          {paceOptions.map((item) => {
            const isSelected = selectedPace === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => setSelectedPace(item.id)}
                style={[
                  styles.paceCard,
                  isSelected && styles.paceCardActive,
                ]}
              >
                <View style={styles.paceHeader}>
                  <View style={styles.paceTitleGroup}>
                    <Text style={styles.paceTitle}>{item.title}</Text>
                    <Text style={styles.paceRate}>{item.rate}</Text>
                  </View>
                  <View style={styles.rightGroup}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.paceDesc}>{item.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Minimalist Projection Card */}
        <Card variant="default" padding="md" style={styles.projectionCard}>
          <View style={styles.projRow}>
            <Calendar size={20} color={theme.colors.saffron} />
            <View style={styles.projTextWrap}>
              <Text style={styles.projTitle}>Estimated Timeline: ~10 weeks</Text>
              <Text style={styles.projDesc}>
                Reach 63 kg steadily with high vitality and without metabolic burnout.
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <Button
          title="Calculate My Targets"
          size="lg"
          variant="primary"
          fullWidth
          rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
          onPress={() => router.push('/(auth)/plan-preview' as any)}
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
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: 12,
  },
  paceList: {
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  paceCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(19, 19, 19, 0.08)',
    ...theme.shadows.elevation1,
  },
  paceCardActive: {
    borderColor: theme.colors.saffron,
    borderWidth: 2,
    backgroundColor: '#FFF7ED',
  },
  paceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  paceTitleGroup: {
    flex: 1,
  },
  paceTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  paceRate: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.saffron,
    marginTop: 2,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paceDesc: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  projectionCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  projRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  projTextWrap: {
    flex: 1,
  },
  projTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  projDesc: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: theme.colors.surfaceBase,
  },
});
