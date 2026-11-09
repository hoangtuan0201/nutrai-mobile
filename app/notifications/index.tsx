import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSafeNavigate } from '../../src/utils/navigationGuard';
import {
  ChevronLeft,
  BellOff,
  CheckCheck,
  Settings,
} from 'lucide-react-native';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { FONTS } from '../../src/constants/theme';
import { useNotificationsList } from '../../src/features/notifications/hooks/useNotifications';
import { NotificationItemCard } from '../../src/features/notifications/components/NotificationItemCard';
import { AppNotification } from '../../src/features/notifications/api/notifications.api';

export default function NotificationsScreen() {
  const router = useSafeNavigate();
  const { colors } = useAppTheme();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    isRefetching,
    refetch,
    markAsRead,
    markAllAsRead,
    isMarkingAll,
  } = useNotificationsList(unreadOnly);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)');
    }
  };

  const handlePressNotification = async (item: AppNotification) => {
    if (!item.isRead) {
      try {
        await markAsRead(item.id);
      } catch {
        // Ignore network error on read state
      }
    }

    const route =
      item.data && typeof item.data === 'object' && typeof item.data.route === 'string'
        ? item.data.route
        : item.type === 'MEAL_REMINDER'
          ? '/(main)/meals'
          : item.type === 'GOAL_ALERT'
            ? '/(main)/progress/calorie'
            : item.type === 'AI_RECOMMENDATION'
              ? '/(main)/ai'
              : null;

    if (route) {
      router.push(route as any);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.iconBg }]}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.iconBg }]}
          onPress={() => router.push('/settings/notifications')}
          activeOpacity={0.7}
        >
          <Settings size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Filter & Actions Bar */}
      <View style={styles.filterBar}>
        <View style={[styles.tabsWrap, { backgroundColor: colors.surfaceMuted }]}>
          <TouchableOpacity
            style={[
              styles.tabPill,
              !unreadOnly && { backgroundColor: colors.surface },
            ]}
            onPress={() => setUnreadOnly(false)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                { color: !unreadOnly ? colors.textPrimary : colors.textSecondary },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabPill,
              unreadOnly && { backgroundColor: colors.surface },
            ]}
            onPress={() => setUnreadOnly(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                { color: unreadOnly ? colors.textPrimary : colors.textSecondary },
              ]}
            >
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={() => void markAllAsRead()}
            disabled={isMarkingAll}
            activeOpacity={0.7}
          >
            <CheckCheck size={16} color={colors.accent} />
            <Text style={[styles.markAllText, { color: colors.accent }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item }) => (
            <NotificationItemCard item={item} onPress={handlePressNotification} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface }]}>
                <BellOff size={32} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {unreadOnly ? 'All caught up!' : 'No notifications yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {unreadOnly
                  ? 'You have read all your notifications.'
                  : 'Meal reminders, calorie alerts, and AI nutrition insights will appear here.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  countBadge: {
    backgroundColor: '#FF9114',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tabsWrap: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 11,
  },
  tabText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
});

