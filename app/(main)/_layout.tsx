import { Tabs } from 'expo-router';
import { Platform, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Home, TrendingUp, Plus, Bot, User } from 'lucide-react-native';
import theme from '../../src/constants/theme';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: theme.colors.saffron,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />,
        }}
      />

      {/* Center FAB — opens meals */}
      <Tabs.Screen
        name="meals"
        options={{
          title: 'Meals',
          tabBarButton: () => (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.fabWrap}
              onPress={() => {}}
            >
              <View style={styles.fab}>
                <Plus size={26} color="#fff" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => <Bot size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: theme.radius.lg,
    height: 68,
    borderTopWidth: 0,
    elevation: 4,
  },
  fabWrap: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: theme.colors.saffron,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.elevation3,
  },
});
