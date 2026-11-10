import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Clock, QrCode, X } from 'lucide-react-native';
import { useSubscriptionStore } from '../../../store/subscriptionStore';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { CancelPaymentModal } from './CancelPaymentModal';

export function PendingPaymentBar() {
  const { colors, isDark } = useAppTheme();
  const {
    isPro,
    activeCheckout,
    isQrModalVisible,
    isPaywallVisible,
    isSuccessModalVisible,
    resumeQrModal,
    cancelCheckout,
  } = useSubscriptionStore();

  const [secondsLeft, setSecondsLeft] = useState<number>(15 * 60);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const shouldShow =
    Boolean(activeCheckout) &&
    !isQrModalVisible &&
    !isPaywallVisible &&
    !isSuccessModalVisible;

  // Real-time countdown calculation
  useEffect(() => {
    if (!shouldShow || !activeCheckout) return;

    const expiryTime = activeCheckout.expiresAt
      ? new Date(activeCheckout.expiresAt).getTime()
      : Date.now() + 15 * 60 * 1000;

    const checkTimer = () => {
      const diff = Math.floor((expiryTime - Date.now()) / 1000);
      if (diff <= 0) {
        setSecondsLeft(0);
        void cancelCheckout();
      } else {
        setSecondsLeft(diff);
      }
    };

    checkTimer();
    const timerId = setInterval(checkTimer, 1000);
    return () => clearInterval(timerId);
  }, [shouldShow, activeCheckout, cancelCheckout]);

  const countdownStr = useMemo(() => {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [secondsLeft]);

  const formattedAmount = useMemo(() => {
    if (!activeCheckout) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: activeCheckout.currency || 'VND',
      maximumFractionDigits: 0,
    }).format(activeCheckout.amount);
  }, [activeCheckout]);

  if (!shouldShow || !activeCheckout) {
    return null;
  }

  return (
    <>
      {/* ── Floating Shopee Food Style Pending Bar ─────────────────── */}
      <View style={styles.floatingContainer} pointerEvents="box-none">
        <View
          style={[
            styles.barCard,
            {
              backgroundColor: isDark ? '#1E293B' : '#0F172A',
              borderColor: isDark ? '#334155' : '#1E293B',
            },
          ]}
        >
          {/* Left: QR Icon + Title + Countdown Timer */}
          <TouchableOpacity
            style={styles.infoCol}
            activeOpacity={0.8}
            onPress={resumeQrModal}
          >
            <View style={styles.iconCircle}>
              <QrCode size={18} color="#D9822B" strokeWidth={2.4} />
            </View>
            <View style={styles.textWrap}>
              <View style={styles.titleRow}>
                <Text style={styles.titleText}>
                  {isPro ? 'Extend Pro Pending' : 'Pending Payment'}
                </Text>
                <View style={styles.timerBadge}>
                  <Clock size={10} color="#F59E0B" strokeWidth={2.5} />
                  <Text style={styles.timerText}>{countdownStr}</Text>
                </View>
              </View>
              <Text style={styles.subtitleText} numberOfLines={1}>
                {isPro ? `Extend ${activeCheckout.plan.name}` : activeCheckout.plan.name} • {formattedAmount}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Right: Actions (View QR + Cancel) */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.payBtn}
              activeOpacity={0.85}
              onPress={resumeQrModal}
            >
              <Text style={styles.payBtnText}>View QR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.7}
              onPress={() => setShowConfirmModal(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Cancel Payment"
            >
              <X size={15} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── NutraAI Custom Confirmation Modal (Replaces Android Alert) ── */}
      <CancelPaymentModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirmCancel={() => {
          setShowConfirmModal(false);
          void cancelCheckout();
        }}
        isPro={isPro}
      />
    </>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: Platform.OS === 'ios' ? 84 : 76,
    zIndex: 9999,
  },
  barCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  infoCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(217, 130, 43, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
  subtitleText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payBtn: {
    backgroundColor: '#D9822B',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  payBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Custom Confirmation Modal Styles ───────────────────────── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  confirmIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(217, 130, 43, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  confirmBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtnDestructive: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDestructiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
