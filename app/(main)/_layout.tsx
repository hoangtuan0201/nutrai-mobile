import { Tabs, useRouter } from 'expo-router';
import { Platform, TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { Home, MessageSquare, TrendingUp, User, Plus } from 'lucide-react-native';
import theme from '../../src/constants/theme';

export default function MainLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: theme.colors.saffron,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.55)',
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

      {/* 2. Chat Tab (navigates to /ai) */}
      <Tabs.Screen
        name="chat"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/ai');
          },
        }}
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => (
            <MessageSquare size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />

      {/* 3. Center FAB — Log Meal (Plus button) */}
      <Tabs.Screen
        name="meals"
        options={{
          title: '',
          tabBarButton: () => (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.fabWrap}
              onPress={() => router.push('/(main)/meals/add')}
              accessibilityLabel="Log Meal"
            >
              <View style={styles.fab}>
                <Plus size={26} color="#FFFFFF" strokeWidth={2.6} />
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      {/* 4. Trends Tab */}
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Trends',
          tabBarIcon: ({ color }) => (
            <TrendingUp size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />

      {/* 5. Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <User size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />

      {/* ── Sub-screens hidden from bottom tabs ── */}
      <Tabs.Screen
        name="nutrition"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="water"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: theme.spacing.screenMargin,
    right: theme.spacing.screenMargin,
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: theme.radius.lg,
    height: 68,
    borderTopWidth: 0,
    paddingBottom: 8,
    paddingTop: 8,
    ...theme.shadows.elevation2,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  tabBarLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  fabWrap: {
    top: -22,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.saffron,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.elevation3,
  },
});
