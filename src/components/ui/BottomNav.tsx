import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Home, MessageSquare, TrendingUp, User, Plus } from 'lucide-react-native';
import { theme } from '../../constants';

export type NavTabKey = 'home' | 'chat' | 'trends' | 'profile';

export interface NavTabItem {
  key: NavTabKey;
  label: string;
  icon: (props: { size: number; color: string }) => React.ReactNode;
}

export interface BottomNavProps {
  activeTab?: NavTabKey;
  onTabPress?: (tab: NavTabKey) => void;
  onFabPress?: () => void;
  fabAccessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const DEFAULT_NAV_TABS: NavTabItem[] = [
  {
    key: 'home',
    label: 'Home',
    icon: ({ size, color }) => <Home size={size} color={color} strokeWidth={2.2} />,
  },
  {
    key: 'chat',
    label: 'Chat',
    icon: ({ size, color }) => <MessageSquare size={size} color={color} strokeWidth={2.2} />,
  },
  {
    key: 'trends',
    label: 'Trends',
    icon: ({ size, color }) => <TrendingUp size={size} color={color} strokeWidth={2.2} />,
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: ({ size, color }) => <User size={size} color={color} strokeWidth={2.2} />,
  },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab = 'home',
  onTabPress,
  onFabPress,
  fabAccessibilityLabel = 'Log Meal',
  style,
}) => {
  const leftTabs = DEFAULT_NAV_TABS.slice(0, 2);
  const rightTabs = DEFAULT_NAV_TABS.slice(2, 4);

  const renderTab = (tab: NavTabItem) => {
    const isActive = activeTab === tab.key;
    const color = isActive ? theme.colors.saffron : 'rgba(255, 255, 255, 0.55)';

    return (
      <TouchableOpacity
        key={tab.key}
        activeOpacity={0.7}
        onPress={() => onTabPress?.(tab.key)}
        style={styles.tabItem}
      >
        {tab.icon({ size: 22, color })}
        <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.bar}>
        {/* Left Tabs (Home, Chat) */}
        <View style={styles.tabsGroup}>{leftTabs.map(renderTab)}</View>

        {/* Center Space placeholder for elevated FAB */}
        <View style={styles.fabSpacer} />

        {/* Right Tabs (Trends, Profile) */}
        <View style={styles.tabsGroup}>{rightTabs.map(renderTab)}</View>
      </View>

      {/* Floating Center FAB Button */}
      <View style={styles.fabWrapper} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onFabPress}
          style={styles.fab}
          accessibilityLabel={fabAccessibilityLabel}
        >
          <Plus size={26} color="#FFFFFF" strokeWidth={2.6} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: theme.spacing.screenMargin,
    right: theme.spacing.screenMargin,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 68,
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.elevation2,
  },
  tabsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    minWidth: 54,
  },
  tabLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 4,
  },
  fabSpacer: {
    width: 64,
  },
  fabWrapper: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.elevation3,
  },
});
