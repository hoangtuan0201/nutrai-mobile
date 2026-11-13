import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Sparkles, X } from 'lucide-react-native';
import { useSubscriptionStore } from '../../../store/subscriptionStore';
import { useAppTheme } from '../../../hooks/useAppTheme';

export function AiScanQuotaModal() {
  const { colors, isDark } = useAppTheme();
  const {
    isQuotaModalVisible,
    quotaModalType,
    closeQuotaModal,
    openPaywall,
    onQuotaFallbackAction,
  } = useSubscriptionStore();

  const isScan = quotaModalType === 'SCAN';

  const handleExplorePro = () => {
    openPaywall(isScan ? 'ai_quota' : 'ai_chat');
  };

  const handleFallback = () => {
    const fn = onQuotaFallbackAction;
    closeQuotaModal();
    if (fn) fn();
  };

  return (
    <Modal
      visible={isQuotaModalVisible}
      animationType="fade"
      transparent
      onRequestClose={closeQuotaModal}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E5E7EB',
            },
          ]}
        >
          {/* Top Row: Badge + Close */}
          <View style={styles.topRow}>
            <View style={styles.limitBadge}>
              <Text style={styles.limitBadgeText}>Daily limit reached</Text>
            </View>
            <TouchableOpacity onPress={closeQuotaModal} style={styles.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Main Heading */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {isScan
              ? "You've used all your free AI scans today."
              : "You've used all your free AI messages today."}
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isScan
              ? 'You have used all 3 free AI Scans today. Upgrade to Pro for 20 scans/day.'
              : 'You have used all 5 free AI Coach messages today. Upgrade to Pro for 50 messages/day.'}
          </Text>

          {/* Unlock NutraAI Pro Inner Box */}
          <View
            style={[
              styles.unlockBox,
              {
                backgroundColor: isDark ? colors.background : '#FAFAFA',
                borderColor: isDark ? colors.border : '#F3F4F6',
              },
            ]}
          >
            <View style={styles.unlockHeader}>
              <Sparkles size={18} color="#D9822B" strokeWidth={2.2} />
              <Text style={[styles.unlockTitle, { color: colors.textPrimary }]}>
                Unlock NutrAI Pro
              </Text>
            </View>

            <View style={styles.bulletList}>
              <View style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: colors.textPrimary }]}>•</Text>
                <Text style={[styles.bulletText, { color: colors.textPrimary }]}>
                  More AI food scans (20 scans/day).
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: colors.textPrimary }]}>•</Text>
                <Text style={[styles.bulletText, { color: colors.textPrimary }]}>
                  Detailed nutrition analysis.
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: colors.textPrimary }]}>•</Text>
                <Text style={[styles.bulletText, { color: colors.textPrimary }]}>
                  Personalized food recommendations.
                </Text>
              </View>
            </View>
          </View>

          {/* Primary CTA: Explore Pro UI */}
          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.85}
            onPress={handleExplorePro}
          >
            <Text style={styles.ctaButtonText}>Explore Pro UI</Text>
          </TouchableOpacity>

          {/* Secondary Fallback Action */}
          <TouchableOpacity onPress={handleFallback} activeOpacity={0.7}>
            <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>
              {isScan
                ? 'Or continue logging meals using the Food Database.'
                : 'Or continue tracking your meals and macros.'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  limitBadge: {
    backgroundColor: '#FCE7D6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  limitBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A4A17',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    lineHeight: 19,
    marginBottom: 16,
  },
  unlockBox: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  unlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  unlockTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  bulletList: {
    gap: 6,
    paddingLeft: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  bulletText: {
    fontSize: 13.5,
    fontWeight: '500',
    lineHeight: 20,
    flex: 1,
  },
  ctaButton: {
    backgroundColor: '#0B0D0B',
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  fallbackText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

