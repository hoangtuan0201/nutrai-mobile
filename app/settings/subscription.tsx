import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, CheckCircle2, Clock } from 'lucide-react-native';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { SettingsTopBar } from '../../src/features/settings/components/SettingsTopBar';
import { SectionLabel } from '../../src/features/settings/components/SettingsGroup';
import { useSubscriptionStore } from '../../src/store/subscriptionStore';
import { ProFeatureComparison } from '../../src/features/subscription/components/ProFeatureComparison';

export default function SubscriptionSettingsScreen() {
  const { colors, isDark } = useAppTheme();
  const {
    isPro,
    planName,
    subscription,
    aiQuota,
    recentPayments,
    isLoading,
    fetchSubscriptionStatus,
    openPaywall,
  } = useSubscriptionStore();

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  const expiresDate = subscription?.expiresAt
    ? new Date(subscription.expiresAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <SettingsTopBar title="Subscription" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>NutrAI Pro</Text>
        <Text style={[styles.subheading, { color: colors.textSecondary }]}>
          Understand, improve and optimize your nutrition with AI.
        </Text>

        {/* Current Plan & Quota Card */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: colors.surface,
              borderColor: isPro ? '#D9822B' : colors.border,
            },
          ]}
        >
          <View style={styles.statusHeader}>
            <View>
              <View style={styles.badgeRow}>
                <View style={isPro ? styles.proBadge : styles.freeBadge}>
                  <Text style={isPro ? styles.proBadgeText : styles.freeBadgeText}>
                    {isPro ? 'PRO ACTIVE' : 'FREE PLAN'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.planTitle, { color: colors.textPrimary }]}>
                {isPro ? planName : 'Free Nutrition Tracker'}
              </Text>
              {isPro && expiresDate ? (
                <Text style={[styles.expiryText, { color: colors.textSecondary }]}>
                  Valid until {expiresDate}
                </Text>
              ) : (
                <Text style={[styles.expiryText, { color: colors.textSecondary }]}>
                  3 AI food scans & 5 AI Coach chats per day
                </Text>
              )}
            </View>
            {isLoading && <ActivityIndicator size="small" color="#D9822B" />}
          </View>

          {/* Daily AI Quota Usage */}
          {aiQuota && (
            <View
              style={[
                styles.quotaBox,
                {
                  backgroundColor: isDark ? colors.background : '#F9FAFB',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.quotaItem}>
                <Text style={[styles.quotaLabel, { color: colors.textSecondary }]}>
                  Today's AI Scans
                </Text>
                <Text style={[styles.quotaVal, { color: colors.textPrimary }]}>
                  {aiQuota.scans.used} / {aiQuota.scans.limit} used
                </Text>
              </View>
              <View style={[styles.quotaDivider, { backgroundColor: colors.border }]} />
              <View style={styles.quotaItem}>
                <Text style={[styles.quotaLabel, { color: colors.textSecondary }]}>
                  Today's AI Chats
                </Text>
                <Text style={[styles.quotaVal, { color: colors.textPrimary }]}>
                  {aiQuota.chats.used} / {aiQuota.chats.limit} used
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.upgradeBtn}
            activeOpacity={0.85}
            onPress={() => openPaywall('settings')}
          >
            <Sparkles size={16} color="#FFFFFF" />
            <Text style={styles.upgradeBtnText}>
              {isPro ? 'Extend Pro Subscription' : 'Upgrade to NutrAI Pro'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Free vs Pro Comparison (Image 2) */}
        <SectionLabel>Plan Comparison</SectionLabel>
        <ProFeatureComparison />

        {/* Recent Payments */}
        {recentPayments.length > 0 && (
          <>
            <SectionLabel>Recent Payments</SectionLabel>
            <View
              style={[
                styles.paymentsCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {recentPayments.map((payment, idx) => (
                <View key={payment.id}>
                  {idx > 0 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                  <View style={styles.paymentRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.paymentTitle, { color: colors.textPrimary }]}>
                        {payment.plan?.name || 'NutrAI Pro'} (
                        {payment.paymentCode || payment.transactionId})
                      </Text>
                      <Text style={[styles.paymentDate, { color: colors.textSecondary }]}>
                        {new Date(payment.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <View style={styles.paymentRight}>
                      <Text style={[styles.paymentAmount, { color: colors.textPrimary }]}>
                        {payment.amount.toLocaleString('vi-VN')}đ
                      </Text>
                      <View style={styles.paymentStatusRow}>
                        {payment.status === 'COMPLETED' ? (
                          <CheckCircle2 size={12} color="#16A34A" />
                        ) : (
                          <Clock size={12} color="#D9822B" />
                        )}
                        <Text
                          style={[
                            styles.paymentStatusText,
                            {
                              color:
                                payment.status === 'COMPLETED' ? '#16A34A' : '#D9822B',
                            },
                          ]}
                        >
                          {payment.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  heading: { fontSize: 28, fontFamily: 'Manrope_800ExtraBold', letterSpacing: -0.5, paddingHorizontal: 4 },
  subheading: { fontSize: 14, marginTop: 4, marginBottom: 20, paddingHorizontal: 4 },
  statusCard: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.2,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  proBadge: {
    backgroundColor: '#FCE7D6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  proBadgeText: {
    fontSize: 10,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#9A4A17',
  },
  freeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  freeBadgeText: {
    fontSize: 10,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#15803D',
  },
  planTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_800ExtraBold',
    marginBottom: 2,
  },
  expiryText: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
  },
  quotaBox: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  quotaItem: {
    flex: 1,
    alignItems: 'center',
  },
  quotaDivider: {
    width: 1,
    marginHorizontal: 8,
  },
  quotaLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    marginBottom: 4,
  },
  quotaVal: {
    fontSize: 14,
    fontFamily: 'Manrope_800ExtraBold',
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0B0D0B',
    borderRadius: 999,
    paddingVertical: 14,
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontFamily: 'Manrope_700Bold',
  },
  paymentsCard: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  paymentTitle: {
    fontSize: 13.5,
    fontFamily: 'Manrope_700Bold',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 14,
    fontFamily: 'Manrope_800ExtraBold',
    marginBottom: 2,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentStatusText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
  },
  divider: {
    height: 1,
  },
});

