import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import theme from '../../../constants/theme';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface ProgressSummaryCardsProps {
  currentStreakDays: number;
  onPressGoals?: () => void;
  onPressStreak?: () => void;
}

export const ProgressSummaryCards: React.FC<ProgressSummaryCardsProps> = ({
  currentStreakDays,
  onPressGoals,
  onPressStreak,
}) => {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={styles.container}>
      {/* Goals Card */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        activeOpacity={0.8}
        onPress={onPressGoals}
      >
        <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(255,145,20,0.15)' : '#FFF4E6' }]}>
          <Image
            source={require('../../../../assets/icons/goalicon.png')}
            style={styles.iconImage}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Goals</Text>
        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Edit</Text>
      </TouchableOpacity>

      {/* Streak Card */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        activeOpacity={0.8}
        onPress={onPressStreak}
      >
        <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(220,38,38,0.2)' : '#FEE2E2' }]}>
          <Image
            source={require('../../../../assets/icons/streakicon.png')}
            style={styles.iconImage}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Streak</Text>
        <Text style={[styles.cardSub, styles.streakHighlight]}>
          {currentStreakDays} {currentStreakDays === 1 ? 'Day' : 'Days'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAE1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  cardTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#131313',
    marginBottom: 2,
  },
  cardSub: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#8E9388',
  },
  streakHighlight: {
    color: theme.colors.scarlet,
    fontFamily: theme.fonts.bold,
  },
});
