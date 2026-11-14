import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, Sparkles } from 'lucide-react-native';
import { useSubscriptionStore } from '../../../store/subscriptionStore';
import { useAppTheme } from '../../../hooks/useAppTheme';

export function PaymentSuccessModal() {
  const { colors, isDark } = useAppTheme();
  const {
    isSuccessModalVisible,
    closeSuccessModal,
    planName,
    subscription,
    isExtensionCheckout,
  } = useSubscriptionStore();

  const expiryDateStr = subscription?.expiresAt
    ? new Date(subscription.expiresAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Modal
      visible={isSuccessModalVisible}
      animationType="fade"
      transparent
      onRequestClose={closeSuccessModal}
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
          <View style={styles.iconBadge}>
            <Sparkles size={32} color="#D9822B" strokeWidth={2.2} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {isExtensionCheckout
              ? 'Pro Subscription Extended! 🎉'
              : 'Welcome to NutrAI Pro! ⭐'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isExtensionCheckout
              ? `Your ${planName || 'Pro'} subscription has been successfully extended${expiryDateStr ? ` until ${expiryDateStr}` : ''}.`
              : `Your ${planName || 'Pro'} subscription is now active${expiryDateStr ? ` until ${expiryDateStr}` : ''}.`}
          </Text>

          {/* Unlocked Perks Preview */}
          <View
            style={[
              styles.perksBox,
              {
                backgroundColor: isDark ? colors.background : '#F9FAFB',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.perkRow}>
              <View style={styles.checkCircle}>
                <Check size={11} color="#FFFFFF" strokeWidth={3} />
              </View>
              <Text style={[styles.perkText, { color: colors.textPrimary }]}>
                20 Advanced AI Food Scans per day
              </Text>
            </View>
            <View style={styles.perkRow}>
              <View style={styles.checkCircle}>
                <Check size={11} color="#FFFFFF" strokeWidth={3} />
              </View>
              <Text style={[styles.perkText, { color: colors.textPrimary }]}>
                50 Personalized AI Coach messages per day
              </Text>
            </View>
            <View style={styles.perkRow}>
              <View style={styles.checkCircle}>
                <Check size={11} color="#FFFFFF" strokeWidth={3} />
              </View>
              <Text style={[styles.perkText, { color: colors.textPrimary }]}>
                Full Long-Term Analytics & Weekly Reports
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.85}
            onPress={closeSuccessModal}
          >
            <Text style={styles.ctaButtonText}>
              {isExtensionCheckout ? 'Continue with Pro' : 'Start Exploring Pro'}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  perksBox: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 22,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#65B741',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkText: {
    fontSize: 13.5,
    fontFamily: 'Manrope_600SemiBold',
  },
  ctaButton: {
    width: '100%',
    backgroundColor: '#0B0D0B',
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
  },
});

