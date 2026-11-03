import React, { useEffect } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Platform, TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { Home, MessageSquare, TrendingUp, User, Plus, Utensils, Compass } from 'lucide-react-native';
import theme from '../../src/constants/theme';
import { useOnboardingStore, mapGoalToBackend } from '../../src/store/onboardingStore';
import { profileApi } from '../../src/features/profile/api/profile.api';

export default function MainLayout() {
  const router = useRouter();
  const pathname = usePathname();

  // Background fallback sync for pending onboarding data
  useEffect(() => {
    const syncPending = async () => {
      const onboarding = useOnboardingStore.getState();
      if (!onboarding.isSynced) {
        try {
          await profileApi.updateProfile({
            gender: onboarding.gender,
            heightCm: onboarding.heightCm,
            weightKg: onboarding.weightKg,
            activityLevel: onboarding.activityLevel,
            fitnessGoal: mapGoalToBackend(onboarding.fitnessGoal),
            dateOfBirth: onboarding.dateOfBirth,
          });
          onboarding.markSynced();
        } catch (e) {
          // If network failed or already synced, ignore
        }
      }
    };
    syncPending();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#1B281B',
        tabBarInactiveTintColor: '#7E8379',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      {/* 1. Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Home size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />

      {/* 2. Log Tab */}
      <Tabs.Screen
        name="meals/index"
        options={{
          title: 'Log',
          tabBarIcon: ({ color }) => (
            <Utensils size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />

      {/* 3. Center FAB — Log Meal (Plus button) */}
      <Tabs.Screen
        name="meals/add"
        options={{
          title: '',
          tabBarButton: () => (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.fabWrap}
              onPress={() => {
                const fromScreen = pathname.includes('meals') ? 'log' : 'home';
                router.push({
                  pathname: '/(main)/meals/add',
                  params: { from: fromScreen },
                });
              }}
              accessibilityLabel="Log Meal"
            >
              <View style={styles.fab}>
                <Plus size={24} color="#FFFFFF" strokeWidth={2.6} />
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      {/* 4. Progress Tab */}
      <Tabs.Screen
        name="progress/index"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => (
            <TrendingUp size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />

      {/* 5. AI Tab (navigates to /ai) */}
      <Tabs.Screen
        name="ai/chat"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/(main)/ai/chat');
          },
        }}
        options={{
          title: 'AI',
          tabBarIcon: ({ color }) => (
            <Compass size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />

      {/* ── Sub-screens hidden from bottom tabs ── */}
      <Tabs.Screen
        name="progress/weight"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="progress/calorie"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="meals/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="meals/ai-breakdown"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="meals/camera"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#F6F5EE',
    borderTopWidth: 1,
    borderTopColor: '#ECE9DF',
    height: Platform.OS === 'ios' ? 92 : 78,
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
    paddingTop: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 2,
  },
  fabWrap: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E3120', // Signature deep forest green matching Image 2
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 5,
  },
});
