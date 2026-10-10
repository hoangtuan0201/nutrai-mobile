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
import { ArrowLeft, ArrowRight, Armchair, Footprints, Flame, Zap, Check } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, Logo } from '../../src/components';

export default function ActivityLevelScreen() {
  const router = useRouter();

  const [selectedActivity, setSelectedActivity] = useState<string>('moderate');

  const activityOptions = [
    {
      id: 'sedentary',
      title: 'Sedentary',
      desc: 'Desk job, mostly sitting, minimal daily movement',
      icon: (color: string) => <Armchair size={20} color={color} strokeWidth={2.2} />,
      badge: '1.2x PAL',
    },
    {
      id: 'light',
      title: 'Lightly Active',
      desc: 'Regular daily walking or 1–3 light workouts per week',
      icon: (color: string) => <Footprints size={20} color={color} strokeWidth={2.2} />,
      badge: '1.37x PAL',
    },
    {
      id: 'moderate',
      title: 'Moderately Active',
      desc: 'Gym training, running, or sports 3–5 days per week',
      icon: (color: string) => <Flame size={20} color={color} strokeWidth={2.2} />,
      badge: '1.55x (Recommended)',
    },
    {
      id: 'heavy',
      title: 'Very Active',
      desc: 'Heavy physical work or intense training 6–7 days/week',
      icon: (color: string) => <Zap size={20} color={color} strokeWidth={2.2} />,
      badge: '1.72x PAL',
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
          <View style={[styles.progressFill, { width: '75%' }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Friendly AI Coach Speech Bubble */}
        <View style={styles.speechBubbleWrapper}>
          <View style={styles.speechBubble}>
            <Text style={styles.speechBubbleText}>How active are you?</Text>
          </View>
        </View>

        {/* Minimalist Selection Cards */}
        <View style={styles.optionsList}>
          {activityOptions.map((item) => {
            const isSelected = selectedActivity === item.id;
            const iconColor = isSelected ? theme.colors.saffron : theme.colors.textSecondary;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => setSelectedActivity(item.id)}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardActive,
                ]}
              >
                <View style={styles.optionHeader}>
                  <View
                    style={[
                      styles.iconWrap,
                      isSelected && styles.iconWrapActive,
                    ]}
                  >
                    {item.icon(iconColor)}
                  </View>
                  <View style={styles.optionTitleWrap}>
                    <View style={styles.titleAndBadgeRow}>
                      <Text
                        style={[
                          styles.optionTitle,
                          isSelected && styles.optionTitleActive,
                        ]}
                      >
                        {item.title}
                      </Text>
                      <View style={styles.badgePill}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    </View>
                  </View>
                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </View>
                <Text style={styles.optionDesc}>{item.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <Button
          title="Continue"
          size="lg"
          variant="primary"
          fullWidth
          rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
          onPress={() => router.push('/(auth)/goal-preferences' as any)}
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
  optionsList: {
    gap: 12,
  },
  optionCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(19, 19, 19, 0.08)',
    ...theme.shadows.elevation1,
  },
  optionCardActive: {
    borderColor: theme.colors.saffron,
    borderWidth: 2,
    backgroundColor: '#FFF7ED',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(19, 19, 19, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapActive: {
    backgroundColor: '#FFE8D1',
  },
  optionTitleWrap: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  titleAndBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  optionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  optionTitleActive: {
    color: theme.colors.saffron,
  },
  badgePill: {
    backgroundColor: 'rgba(19, 19, 19, 0.05)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionDesc: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    paddingLeft: 50,
  },
  footer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: theme.colors.surfaceBase,
  },
});
