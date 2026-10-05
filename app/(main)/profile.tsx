import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Mail,
  Shield,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react-native';
import theme from '../../src/constants/theme';
import { useRouter } from 'expo-router';
import { Logo, Card, Button } from '../../src/components';
import { useAuthStore } from '../../src/store/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await logout();
        router.replace('/(auth)/login');
      } catch (err) {
        console.error('Logout error:', err);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) {
        await doLogout();
      }
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: doLogout,
      },
    ]);
  };

  const menuSections = [
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          icon: <Bell size={18} color={theme.colors.textPrimary} />,
          label: 'Reminders & Notifications',
          value: 'Daily 8:00 AM',
        },
        {
          id: 'units',
          icon: <Flame size={18} color={theme.colors.saffron} />,
          label: 'Calorie & Macro Units',
          value: 'kcal / grams',
        },
      ],
    },
    {
      title: 'Account & Legal',
      items: [
        {
          id: 'privacy',
          icon: <Shield size={18} color={theme.colors.textPrimary} />,
          label: 'Privacy Policy',
          value: '',
        },
        {
          id: 'support',
          icon: <HelpCircle size={18} color={theme.colors.textPrimary} />,
          label: 'Help & Support',
          value: '',
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header with Brand */}
        <View style={styles.header}>
          <Logo variant="full" size="md" />
          <View style={styles.badgePro}>
            <Award size={13} color={theme.colors.saffron} />
            <Text style={styles.badgeProText}>Pro Plan</Text>
          </View>
        </View>

        {/* User Card */}
        <Card style={styles.userCard} padding="lg">
          <View style={styles.avatarWrap}>
            <View style={styles.avatarPlaceholder}>
              <User size={30} color={theme.colors.saffron} />
            </View>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Nutrai Member'}</Text>
            <View style={styles.emailRow}>
              <Mail size={13} color={theme.colors.textSecondary} />
              <Text style={styles.userEmail}>{user?.email || 'user@nutrai.health'}</Text>
            </View>
          </View>
        </Card>

        {/* Nutrition Goal Summary Card */}
        <Card style={styles.summaryCard} padding="md">
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Daily Target</Text>
            <Text style={styles.statValue}>2,400</Text>
            <Text style={styles.statUnit}>kcal</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={[styles.statValue, { color: theme.colors.saffron }]}>7</Text>
            <Text style={styles.statUnit}>days active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>AI Logging</Text>
            <Text style={styles.statValue}>98%</Text>
            <Text style={styles.statUnit}>accuracy</Text>
          </View>
        </Card>

        {/* Menu Sections */}
        {menuSections.map((sec) => (
          <View key={sec.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <Card style={styles.menuCard} padding="none">
              {sec.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  style={[
                    styles.menuRow,
                    idx !== sec.items.length - 1 && styles.menuRowBorder,
                  ]}
                >
                  <View style={styles.menuRowLeft}>
                    <View style={styles.menuIconWrap}>{item.icon}</View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.menuRowRight}>
                    {item.value ? (
                      <Text style={styles.menuValue}>{item.value}</Text>
                    ) : null}
                    <ChevronRight size={16} color={theme.colors.textMuted} />
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        {/* Logout Button */}
        <View style={styles.logoutWrapper}>
          <Button
            title="Sign Out"
            variant="outline"
            size="lg"
            fullWidth
            leftIcon={<LogOut size={18} color={theme.colors.scarlet} />}
            onPress={handleLogout}
            textStyle={{ color: theme.colors.scarlet }}
            style={styles.logoutBtn}
          />
        </View>

        <Text style={styles.versionNotice}>Nutrai Mobile • v1.0.0 (Build 1)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceBase,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screenMargin,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  badgePro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 145, 20, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeProText: {
    fontFamily: theme.fonts.bold,
    fontSize: 11,
    color: theme.colors.saffron,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    ...theme.shadows.elevation1,
  },
  avatarWrap: {
    marginRight: 14,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 145, 20, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginBottom: 3,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  userEmail: {
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
    ...theme.shadows.elevation1,
  },
  statCol: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: theme.colors.textPrimary,
  },
  statUnit: {
    fontFamily: theme.fonts.regular,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(19, 19, 19, 0.08)',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    overflow: 'hidden',
    ...theme.shadows.elevation1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(19, 19, 19, 0.05)',
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(19, 19, 19, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  menuRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuValue: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  logoutWrapper: {
    marginTop: 8,
    marginBottom: 20,
  },
  logoutBtn: {
    borderColor: 'rgba(240, 75, 55, 0.25)',
  },
  versionNotice: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
