import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { useSubscriptionStore } from '../../../store/subscriptionStore';
import { PaywallModal } from './PaywallModal';
import { VietQrPaymentModal } from './VietQrPaymentModal';
import { PaymentSuccessModal } from './PaymentSuccessModal';
import { AiScanQuotaModal } from './AiScanQuotaModal';
import { PendingPaymentBar } from './PendingPaymentBar';

export function SubscriptionModalsHost() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const fetchSubscriptionStatus = useSubscriptionStore((s) => s.fetchSubscriptionStatus);
  const checkPendingPayment = useSubscriptionStore((s) => s.checkPendingPayment);

  useEffect(() => {
    if (!accessToken) return;

    // Silently sync current subscription status on mount (never shows success modal)
    void fetchSubscriptionStatus();

    // Check pending payment if user initiated a checkout (both initial upgrade and extension)
    void checkPendingPayment();

    // Background interval: only poll every 4 seconds when user has an active checkout pending
    const intervalId = setInterval(() => {
      const state = useSubscriptionStore.getState();
      if (Boolean(state.activeCheckout)) {
        void checkPendingPayment();
      }
    }, 4000);

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && accessToken) {
        const state = useSubscriptionStore.getState();
        if (Boolean(state.activeCheckout)) {
          void checkPendingPayment();
        } else {
          void fetchSubscriptionStatus();
        }
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [accessToken, fetchSubscriptionStatus, checkPendingPayment]);

  return (
    <>
      <PaywallModal />
      <VietQrPaymentModal />
      <PaymentSuccessModal />
      <AiScanQuotaModal />
      <PendingPaymentBar />
    </>
  );
}

