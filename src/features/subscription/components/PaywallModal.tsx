import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Leaf, Sparkles, X } from 'lucide-react-native';
import { useSubscriptionStore } from '../../../store/subscriptionStore';
import { useAppTheme } from '../../../hooks/useAppTheme';

const PRO_FEATURES = [
  'Advanced AI Food Analysis',
  'Personalized AI Nutrition Coach',
  'Detailed Progress Analytics',
  'Weekly Nutrition Reports',
  'More AI scans and messages',
];

export function PaywallModal() {
  const { colors, isDark } = useAppTheme();
  const {
    isPaywallVisible,
    closePaywall,
    selectedBillingPeriod,
    setSelectedBillingPeriod,
    startCheckout,
    isCreatingCheckout,
    fetchSubscriptionStatus,
  } = useSubscriptionStore();

  const handleContinue = async () => {
    try {
      await startCheckout(selectedBillingPeriod);
    } catch (err: any) {
      Alert.alert(
        'Checkout Error',
        err?.response?.data?.message || 'Could not initialize payment. Please try again.',
      );
    }
  };


  return (
    <Modal
      visible={isPaywallVisible}
      animationType="slide"
      transparent
      onRequestClose={closePaywall}
    >
      <View style={styles.overlay}>
        <SafeAreaView
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E5E7EB',
            },
          ]}
          edges={['top', 'bottom']}
        >
          {/* Top Bar: Leaf icon left, Close X right */}
          <View style={styles.topBar}>
            <View>
            </View>
            <TouchableOpacity
              onPress={closePaywall}
              style={styles.closeBtn}
              activeOpacity={0.7}
              accessibilityLabel="Close paywall"
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Section */}
            <View style={styles.heroCenter}>
              <View style={styles.sparkleWrap}>
                <Sparkles size={30} color="#D9822B" strokeWidth={2} />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Unlock Your Full Potential
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Your personal AI nutrition coach starts here.
              </Text>
            </View>

            {/* 5 Feature Checkmarks */}
            <View style={styles.featuresList}>
              {PRO_FEATURES.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <View style={styles.checkCircle}>
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {/* Plan Option 1: Monthly */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedBillingPeriod('MONTHLY')}
              style={[
                styles.planCard,
                {
                  backgroundColor: isDark ? colors.background : '#FFFFFF',
                  borderColor:
                    selectedBillingPeriod === 'MONTHLY'
                      ? '#D9822B'
                      : isDark
                        ? colors.border
                        : '#E5E7EB',
                  borderWidth: selectedBillingPeriod === 'MONTHLY' ? 1.8 : 1,
                },
              ]}
            >
              <View style={styles.planTopRow}>
                <Text style={[styles.planTitle, { color: colors.textPrimary }]}>Monthly</Text>
                <View style={styles.flexibleBadge}>
                  <Text style={styles.flexibleBadgeText}>Flexible</Text>
                </View>
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.priceValue, { color: colors.textPrimary }]}>49,000đ</Text>
                <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}> / month</Text>
              </View>
            </TouchableOpacity>

            {/* Plan Option 2: Yearly */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedBillingPeriod('YEARLY')}
              style={[
                styles.planCard,
                {
                  backgroundColor: isDark ? colors.background : '#FFFFFF',
                  borderColor:
                    selectedBillingPeriod === 'YEARLY'
                      ? '#D9822B'
                      : isDark
                        ? colors.border
                        : '#E5E7EB',
                  borderWidth: selectedBillingPeriod === 'YEARLY' ? 1.8 : 1,
                },
              ]}
            >
              <View style={styles.planTopRow}>
                <Text style={[styles.planTitle, { color: colors.textPrimary }]}>Yearly</Text>
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueBadgeText}>Best value</Text>
                </View>
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.priceValue, { color: colors.textPrimary }]}>399,000đ</Text>
                <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}> / year</Text>
              </View>
              <Text style={[styles.equivalentText, { color: colors.textSecondary }]}>
                Equivalent to approximately 33,250đ/month.
              </Text>
            </TouchableOpacity>

            {/* Primary CTA Button */}
            <TouchableOpacity
              style={styles.ctaButton}
              activeOpacity={0.85}
              onPress={handleContinue}
              disabled={isCreatingCheckout}
            >
              {isCreatingCheckout ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.ctaButtonText}>Continue with Pro</Text>
              )}
            </TouchableOpacity>

            {/* Footer Links */}
            <View style={styles.footerRow}>

              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Terms of Use',
                    'Subscriptions automatically unlock Pro features for the selected billing cycle (30 days for Monthly, 365 days for Yearly).',
                  )
                }
                activeOpacity={0.7}
              >
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>Terms</Text>
              </TouchableOpacity>
              <Text style={[styles.footerDot, { color: colors.textSecondary }]}> · </Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Privacy Policy',
                    'Your nutrition and payment data are encrypted and never sold to third parties.',
                  )
                }
                activeOpacity={0.7}
              >
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>Privacy</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 20,
  },
  card: {
    flex: 1,
    maxHeight: '94%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },

  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  heroCenter: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 22,
  },
  sparkleWrap: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Manrope_800ExtraBold',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    textAlign: 'center',
  },
  featuresList: {
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#65B741',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 15,
    fontFamily: 'Manrope_500Medium',
  },
  planCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  planTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  planTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
  },
  flexibleBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  flexibleBadgeText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: '#1F2937',
  },
  bestValueBadge: {
    backgroundColor: '#FCE7D6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  bestValueBadgeText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: '#9A4A17',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: 24,
    fontFamily: 'Manrope_800ExtraBold',
    letterSpacing: -0.5,
  },
  pricePeriod: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
  },
  equivalentText: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    marginTop: 6,
  },
  ctaButton: {
    backgroundColor: '#0B0D0B',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
  },
  footerDot: {
    fontSize: 12,
  },
});

