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
import { ArrowLeft, Scale, Activity, Dumbbell, Zap, Check } from 'lucide-react-native';
import { theme } from '../../src/constants';
import { Button, Logo } from '../../src/components';

export default function ChooseGoalScreen() {
  const router = useRouter();

  const [selectedGoal, setSelectedGoal] = useState<string>('lose');

  const goalsList = [
    {
      id: 'lose',
      title: 'Lose weight',
      icon: (color: string) => <Scale size={20} color={color} strokeWidth={2.2} />,
    },
    {
      id: 'maintain',
      title: 'Stay in shape',
      icon: (color: string) => <Activity size={20} color={color} strokeWidth={2.2} />,
    },
    {
      id: 'muscle',
      title: 'Gain muscle',
      icon: (color: string) => <Dumbbell size={20} color={color} strokeWidth={2.2} />,
    },
    {
      id: 'performance',
      title: 'Boost endurance & stamina',
      icon: (color: string) => <Zap size={20} color={color} strokeWidth={2.2} />,
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
          <View style={[styles.progressFill, { width: '25%' }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Friendly AI Coach Speech Bubble */}
        <View style={styles.speechBubbleWrapper}>
          <View style={styles.speechBubble}>
            <Text style={styles.speechBubbleText}>What's your goal?</Text>
          </View>
        </View>

        {/* Minimalist Selection Cards */}
        <View style={styles.optionsList}>
          {goalsList.map((item) => {
            const isSelected = selectedGoal === item.id;
            const iconColor = isSelected ? theme.colors.saffron : theme.colors.textSecondary;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => setSelectedGoal(item.id)}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardActive,
                ]}
              >
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.iconWrap,
                      isSelected && styles.iconWrapActive,
                    ]}
                  >
                    {item.icon(iconColor)}
                  </View>
                  <Text
                    style={[
                      styles.optionTitle,
                      isSelected && styles.optionTitleActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>

                {isSelected && (
                  <View style={styles.checkCircle}>
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <Button
          title="Let's do this"
          size="lg"
          variant="primary"
          fullWidth
          onPress={() => router.push('/(auth)/user-metrics' as any)}
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
    marginBottom: 24,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 18,
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
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(19, 19, 19, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#FFE8D1',
  },
  optionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  optionTitleActive: {
    color: theme.colors.saffron,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: theme.colors.surfaceBase,
  },
});
