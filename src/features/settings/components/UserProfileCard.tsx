import React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Camera, ChevronRight, Sparkles, User as UserIcon } from 'lucide-react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { useSubscriptionStore } from '../../../store/subscriptionStore';

interface Props {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  isUploading: boolean;
  onPressCard: () => void;
  onPressAvatar: () => void;
  onPressPlan?: () => void;
}

export function UserProfileCard({
  name,
  email,
  avatarUrl,
  isUploading,
  onPressCard,
  onPressAvatar,
  onPressPlan,
}: Props) {
  const { colors } = useAppTheme();
  const { isPro, planName, openPaywall } = useSubscriptionStore();

  const handlePlanPress = () => {
    if (onPressPlan) {
      onPressPlan();
    } else if (!isPro) {
      openPaywall('settings');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.8}
      onPress={onPressCard}
    >
      <TouchableOpacity onPress={onPressAvatar} activeOpacity={0.8} style={styles.avatarWrap} accessibilityLabel="Change avatar">
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={[styles.avatar, { backgroundColor: colors.surfaceMuted }]} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.surfaceMuted }]}>
            <UserIcon size={28} color={colors.textMuted} />
          </View>
        )}
        {isUploading && (
          <View style={[styles.avatar, styles.loading]}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        )}
        <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
          <Camera size={11} color={colors.onPrimary} />
        </View>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {name || 'NutraAI User'}
        </Text>
        <Text style={[styles.email, { color: colors.textSecondary }]} numberOfLines={1}>
          {email}
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePlanPress}
          style={[
            styles.plan,
            isPro
              ? { backgroundColor: '#FCE7D6' }
              : { backgroundColor: colors.surfaceMuted },
          ]}
        >
          {isPro && <Sparkles size={11} color="#9A4A17" />}
          <Text
            style={[
              styles.planText,
              { color: isPro ? '#9A4A17' : colors.textSecondary },
            ]}
          >
            {isPro ? planName || 'NutraAI Pro' : 'Free Plan · Upgrade'}
          </Text>
        </TouchableOpacity>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1 },
  avatarWrap: { marginRight: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  loading: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  info: { flex: 1 },
  name: { fontSize: 17, fontFamily: 'Manrope_700Bold', marginBottom: 4 },
  email: { fontSize: 13, marginBottom: 8 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  planText: { fontSize: 11, fontFamily: 'Manrope_700Bold' },
});

