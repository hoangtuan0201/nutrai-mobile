import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MessageSquarePlus, X } from 'lucide-react-native';
import { FONTS, PALETTE, RADIUS } from '../../../constants/theme';
import { ConversationSummary } from '../types';
import { useAppTheme } from '../../../hooks/useAppTheme';

const DRAWER_WIDTH = Math.min(340, Dimensions.get('window').width * 0.82);

interface ChatHistoryDrawerProps {
  visible: boolean;
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  isLoading: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
}

type HistoryGroupKey = 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'Earlier';
const GROUP_ORDER: HistoryGroupKey[] = ['Today', 'Yesterday', 'This Week', 'This Month', 'Earlier'];

function resolveGroup(isoDate: string): HistoryGroupKey {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const ts = new Date(isoDate).getTime();
  const dayMs = 24 * 3600 * 1000;

  if (ts >= startOfToday) return 'Today';
  if (ts >= startOfToday - dayMs) return 'Yesterday';
  if (ts >= startOfToday - 6 * dayMs) return 'This Week';
  const d = new Date(ts);
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) return 'This Month';
  return 'Earlier';
}

export function ChatHistoryDrawer({
  visible,
  conversations,
  activeConversationId,
  isLoading,
  onClose,
  onNewChat,
  onSelectConversation,
}: ChatHistoryDrawerProps) {
  const { colors, isDark } = useAppTheme();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [isMounted, setIsMounted] = useState(visible);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else if (isMounted) {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -DRAWER_WIDTH, duration: 180, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        setIsMounted(false);
        setQuery('');
      });
    }
  }, [visible]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? conversations.filter((c) => c.title.toLowerCase().includes(q))
      : conversations;

    const map = new Map<HistoryGroupKey, ConversationSummary[]>();
    for (const conv of filtered) {
      const key = resolveGroup(conv.lastMessageAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(conv);
    }
    return GROUP_ORDER.filter((k) => map.has(k)).map((k) => ({ key: k, items: map.get(k)! }));
  }, [conversations, query]);

  if (!isMounted) return null;

  return (
    <Modal transparent visible={isMounted} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.drawer, { transform: [{ translateX }], backgroundColor: colors.background }]}>
          <SafeAreaView style={styles.drawerInner} edges={['top', 'bottom']}>
            {/* Search */}
            <View style={styles.searchRow}>
              <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Search size={18} color={colors.textSecondary} strokeWidth={2.2} />
                <TextInput
                  style={[styles.searchInput, { color: colors.textPrimary }]}
                  placeholder="Search"
                  placeholderTextColor={colors.textSecondary}
                  value={query}
                  onChangeText={setQuery}
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                    <X size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* New Chat */}
            <TouchableOpacity style={styles.newChatRow} activeOpacity={0.7} onPress={onNewChat}>
              <View style={styles.newChatIcon}>
                <MessageSquarePlus size={18} color={PALETTE.saffron} strokeWidth={2.2} />
              </View>
              <Text style={[styles.newChatText, { color: colors.textPrimary }]}>New Chat</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Text style={[styles.historyHeading, { color: colors.textSecondary }]}>History</Text>

            <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
              {isLoading && (
                <View style={styles.emptyWrap}>
                  <ActivityIndicator size="small" color={PALETTE.saffron} />
                </View>
              )}

              {!isLoading && grouped.length === 0 && (
                <View style={styles.emptyWrap}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {query ? 'No chats match your search.' : 'No conversations yet.'}
                  </Text>
                </View>
              )}

              {!isLoading &&
                grouped.map((group) => (
                  <View key={group.key} style={styles.groupBlock}>
                    <View style={styles.groupLabelRow}>
                      <View style={styles.groupDot} />
                      <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>{group.key}</Text>
                    </View>
                    {group.items.map((conv) => {
                      const isActive = conv.id === activeConversationId;
                      return (
                        <TouchableOpacity
                          key={conv.id}
                          style={[
                            styles.historyItem,
                            isActive && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.surface },
                          ]}
                          activeOpacity={0.7}
                          onPress={() => onSelectConversation(conv.id)}
                        >
                          <Text
                            style={[
                              styles.historyItemText,
                              { color: colors.textPrimary },
                              isActive && styles.historyItemTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {conv.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(19, 19, 19, 0.35)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: PALETTE.ivory,
    borderTopRightRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    shadowColor: PALETTE.onyx,
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  drawerInner: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: PALETTE.surfaceWhite,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    height: 46,
    borderWidth: 1,
    borderColor: PALETTE.borderLight,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: PALETTE.textPrimary,
    paddingVertical: 0,
  },
  newChatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  newChatIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 145, 20, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: PALETTE.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.borderLight,
    marginHorizontal: 20,
    marginVertical: 6,
  },
  historyHeading: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: PALETTE.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  historyList: {
    flex: 1,
  },
  groupBlock: {
    paddingTop: 10,
  },
  groupLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  groupDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: PALETTE.khaki,
  },
  groupLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: PALETTE.textMuted,
  },
  historyItem: {
    marginHorizontal: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: RADIUS.sm,
  },
  historyItemActive: {
    backgroundColor: PALETTE.surfaceWhite,
  },
  historyItemText: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: PALETTE.textPrimary,
  },
  historyItemTextActive: {
    fontFamily: FONTS.bold,
  },
  emptyWrap: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: PALETTE.textMuted,
  },
});

export default ChatHistoryDrawer;
