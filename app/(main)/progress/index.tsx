import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, RotateCcw, Plus } from 'lucide-react-native';
import { theme } from '../../../src/constants';
import { useAuthStore } from '../../../src/store/authStore';
import { progressApi } from '../../../src/features/progress/api/progress.api';
import { PROFILE_QUERY_KEY } from '../../../src/features/profile/hooks/useProfile';
import { ProgressOverviewResponse } from '../../../src/features/progress/types';
import {
  BmiGaugeCard,
  ProgressSummaryCards,
  WeightProgressCard,
  CalorieIntakeCard,
  LogWeightModal,
} from '../../../src/features/progress/components';
import { CalorieTimeframe } from '../../../src/features/progress/components/CalorieIntakeCard';
import { EditGoalsModal } from '../../../src/features/profile/components/EditGoalsModal';

type TabType = 'All' | 'Weight' | 'Calorie Intake';

export default function ProgressScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [overview, setOverview] = useState<ProgressOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<TabType>('All');
  const [isLogWeightVisible, setIsLogWeightVisible] = useState<boolean>(false);
  const [isEditGoalsVisible, setIsEditGoalsVisible] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [calorieTimeframe, setCalorieTimeframe] = useState<CalorieTimeframe>('Daily');

  const fetchOverview = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setErrorMessage(null);
        // Always query 30 days so Calorie & Weight charts have complete history for Daily, Weekly, and Monthly views
        const data = await progressApi.getOverview(30);
        setOverview(data);
      } catch (err: any) {
        setErrorMessage(
          err?.response?.data?.message || 'Failed to load progress data. Please try again.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  const handleCalorieTimeframeChange = (tf: CalorieTimeframe) => {
    setCalorieTimeframe(tf);
  };

  // Fetch when tab is mounted or gains focus (e.g. returning from /progress/weight)
  useFocusEffect(
    useCallback(() => {
      fetchOverview(true);
    }, [fetchOverview]),
  );

  const handleLogWeightSubmit = async (weightKg: number, note?: string, loggedDate?: string) => {
    await progressApi.logWeight({ weightKg, note, loggedDate });
    await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    await fetchOverview(true);
  };

  const tabs: TabType[] = ['All', 'Weight', 'Calorie Intake'];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F2E7" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || user?.email || 'N').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.greeting}>Progress & Analytics</Text>
            <Text style={styles.userName}>{user?.name || 'Health Tracker'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerAction}
          onPress={() => fetchOverview(true)}
          activeOpacity={0.7}
        >
          <RotateCcw size={18} color="#131313" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.saffron} />
          <Text style={styles.loadingText}>Calculating metrics...</Text>
        </View>
      ) : errorMessage && !overview ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchOverview(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchOverview(true)}
              tintColor={theme.colors.saffron}
              colors={[theme.colors.saffron]}
            />
          }
        >
    

          {/* BMI Gauge Card */}
          {overview?.bmi && <BmiGaugeCard bmi={overview.bmi} />}

          {/* 2-Card Summary Row (Goals & Streak) */}
          <ProgressSummaryCards
            currentStreakDays={overview?.streak.currentStreakDays ?? 0}
            onPressGoals={() => setIsEditGoalsVisible(true)}
            onPressStreak={() => {}}
          />

          {/* Horizontal Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}
          >
            {tabs.map((tab) => {
              const isActive = selectedTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabChip, isActive && styles.tabChipActive]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedTab(tab)}
                >
                  <Text
                    style={[
                      styles.tabChipText,
                      isActive && styles.tabChipTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Weight Card: Clicking opens dedicated /progress/weight page */}
          {(selectedTab === 'All' || selectedTab === 'Weight') && overview?.weight && (
            <WeightProgressCard
              weight={overview.weight}
              onGoalPress={() => router.push('/(main)/progress/weight')}
              onPressCard={() => router.push('/(main)/progress/weight')}
            />
          )}

          {/* Calorie Intake Card: Clicking navigates to dedicated /progress/calorie page */}
          {(selectedTab === 'All' || selectedTab === 'Calorie Intake') &&
            overview?.calorieIntake && (
              <CalorieIntakeCard
                calorieIntake={overview.calorieIntake}
                timeframe={calorieTimeframe}
                onTimeframeChange={handleCalorieTimeframeChange}
                onPressCard={() => router.push('/(main)/progress/calorie')}
                onGoalPress={() => router.push('/(main)/progress/calorie')}
              />
            )}

          {/* Bottom spacing for smooth tab navigation */}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Log Weight Modal */}
      <LogWeightModal
        visible={isLogWeightVisible}
        initialWeight={overview?.weight.currentKg || 60}
        onClose={() => setIsLogWeightVisible(false)}
        onSubmit={handleLogWeightSubmit}
      />

      {/* Edit Goals & Activity Modal */}
      <EditGoalsModal
        visible={isEditGoalsVisible}
        onClose={() => setIsEditGoalsVisible(false)}
        onSaved={() => fetchOverview(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F2E7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  greeting: {
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    color: '#8E9388',
  },
  userName: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#131313',
  },
  headerAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEAE1',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: '#8E9388',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorText: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.scarlet,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: theme.colors.saffron,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E3120',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  insightLeft: {
    flex: 1,
    paddingRight: 10,
  },
  insightTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  insightSub: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: '#A3B899',
    lineHeight: 15,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.saffron,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
  },
  scanBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAE1',
  },
  tabChipActive: {
    backgroundColor: '#131313',
    borderColor: '#131313',
  },
  tabChipText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
    color: '#6B675A',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bold,
  },
});
