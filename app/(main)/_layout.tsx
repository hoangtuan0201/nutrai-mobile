import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { Home, TrendingUp, Sparkles, Utensils, Settings } from 'lucide-react-native';
import theme from '../../src/constants/theme';
import { useAppTheme } from '../../src/hooks/useAppTheme';

export default function MainLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: [
          styles.tabBar,
          { backgroundColor: colors.tabBarBg, borderTopColor: colors.tabBarBorder },
        ],
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
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

      {/* 3. Progress Tab */}
      <Tabs.Screen
        name="progress/index"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => (
            <TrendingUp size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />

      {/* 4. AI Coach Tab */}
      <Tabs.Screen
        name="ai/chat"
        options={{
          title: 'AI Coach',
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color }) => (
            <Sparkles size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />

      {/* 5. Settings Tab (Far right) */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Settings size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />

      {/* ── Sub-screens hidden from bottom tabs ── */}
      <Tabs.Screen
        name="meals/add"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="ai/index"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
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
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="meals/ai-breakdown"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="meals/camera"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
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
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingTop: 8,
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
});
