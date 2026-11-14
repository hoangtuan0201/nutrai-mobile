import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppNotification, NotificationType } from '../api/notifications.api';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { FONTS } from '../../../constants/theme';

interface NotificationItemCardProps {
  item: AppNotification;
  onPress: (item: AppNotification) => void;
}

function getTypeMeta(
  type: NotificationType,
  data?: Record<string, unknown> | null,
) {
  const tag = typeof data?.tag === 'string' ? data.tag : '';

  if (tag.startsWith('STREAK')) {
    return {
      tagColor: '#EF4444',
      label: 'Streak Rescue',
    };
  }

  if (tag.startsWith('WEEKLY_WEIGH')) {
    return {
      tagColor: '#0EA5E9',
      label: 'Weekly Weigh-In',
    };
  }

  switch (type) {
    case 'MEAL_REMINDER':
      return {
        tagColor: '#FF9114',
        label: 'Meal Reminder',
      };
    case 'GOAL_ALERT':
      return {
        tagColor: '#10B981',
        label: 'Goal Alert',
      };
    case 'AI_RECOMMENDATION':
      return {
        tagColor: '#8B5CF6',
        label: 'AI Coach',
      };
    case 'SUBSCRIPTION':
      return {
        tagColor: '#F59E0B',
        label: 'Pro Plan',
      };
    default:
      return {
        tagColor: '#64748B',
        label: 'System',
      };
  }
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NotificationItemCard({ item, onPress }: NotificationItemCardProps) {
  const { colors, isDark } = useAppTheme();
  const { tagColor, label } = getTypeMeta(item.type, item.data);

  const unreadBg = isDark ? '#1C251F' : '#FFFFFF';
  const cardBg = item.isRead ? colors.surface : unreadBg;
  const borderCol = item.isRead
    ? colors.border
    : isDark
      ? 'rgba(255, 145, 20, 0.4)'
      : 'rgba(255, 145, 20, 0.35)';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: borderCol,
        },
      ]}
      activeOpacity={0.75}
      onPress={() => onPress(item)}
    >
      {/* Header meta row */}
      <View style={styles.headerRow}>
        <View style={styles.tagGroup}>
          <View style={[styles.tagDot, { backgroundColor: tagColor }]} />
          <Text style={[styles.tagLabel, { color: tagColor }]}>{label}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>
            {formatRelativeTime(item.createdAt)}
          </Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
      </View>

      {/* Title */}
      <Text
        style={[
          styles.title,
          {
            color: colors.textPrimary,
            fontFamily: item.isRead ? FONTS.semiBold : FONTS.bold,
          },
        ]}
        numberOfLines={2}
      >
        {item.title}
      </Text>

      {/* Message Body */}
      <Text
        style={[styles.message, { color: colors.textSecondary }]}
        numberOfLines={3}
      >
        {item.body}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF9114',
  },
  title: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 19,
  },
});

