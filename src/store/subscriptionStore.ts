import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscriptionApi } from '../features/subscription/api/subscription.api';
import type {
  BillingPeriod,
  CreateCheckoutResponse,
  PaymentRecord,
  SubscriptionPlan,
  SubscriptionPlanFeatures,
  UserDailyAiQuota,
  UserSubscriptionInfo,
} from '../features/subscription/types';

export type PaywallSource = 'home_banner' | 'ai_quota' | 'settings' | 'ai_chat' | 'header_crown' | 'progress_banner' | 'general';
export type QuotaLimitType = 'SCAN' | 'CHAT';

interface SubscriptionState {
  isPro: boolean;
  planName: string;
  subscription: UserSubscriptionInfo | null;
  features: SubscriptionPlanFeatures;
  aiQuota: UserDailyAiQuota | null;
  plans: SubscriptionPlan[];
  recentPayments: PaymentRecord[];
  isLoading: boolean;
  isCreatingCheckout: boolean;

  // Global modal states
  isPaywallVisible: boolean;
  paywallSource: PaywallSource;
  selectedBillingPeriod: BillingPeriod;

  activeCheckout: CreateCheckoutResponse | null;
  isQrModalVisible: boolean;
  isSuccessModalVisible: boolean;
  isExtensionCheckout: boolean;

  isQuotaModalVisible: boolean;
  quotaModalType: QuotaLimitType;
  onQuotaFallbackAction: (() => void) | null;
}

interface SubscriptionActions {
  fetchSubscriptionStatus: () => Promise<void>;
  fetchPlans: () => Promise<void>;
  setSelectedBillingPeriod: (period: BillingPeriod) => void;

  openPaywall: (source?: PaywallSource) => void;
  closePaywall: () => void;

  startCheckout: (period?: BillingPeriod) => Promise<CreateCheckoutResponse | null>;
  closeQrModal: () => void;
  resumeQrModal: () => void;
  cancelCheckout: () => Promise<void>;

  handlePaymentCompleted: () => Promise<void>;
  closeSuccessModal: () => void;

  openQuotaModal: (type?: QuotaLimitType, fallbackAction?: () => void) => void;
  closeQuotaModal: () => void;
  checkPendingPayment: () => Promise<boolean>;
}

const DEFAULT_FEATURES: SubscriptionPlanFeatures = {
  maxMealsPerDay: 5,
  aiAnalysisPerDay: 3,
  aiChatPerDay: 5,
  exportReports: false,
  advancedInsights: false,
};

export const useSubscriptionStore = create<SubscriptionState & SubscriptionActions>((set, get) => ({
  isPro: false,
  planName: 'Free Plan',
  subscription: null,
  features: DEFAULT_FEATURES,
  aiQuota: null,
  plans: [],
  recentPayments: [],
  isLoading: false,
  isCreatingCheckout: false,

  isPaywallVisible: false,
  paywallSource: 'general',
  selectedBillingPeriod: 'YEARLY',

  activeCheckout: null,
  isQrModalVisible: false,
  isSuccessModalVisible: false,
  isExtensionCheckout: false,

  isQuotaModalVisible: false,
  quotaModalType: 'SCAN',
  onQuotaFallbackAction: null,

  fetchSubscriptionStatus: async () => {
    set({ isLoading: true });
    try {
      const data = await subscriptionApi.getMySubscription();
      set({
        isPro: data.isPro,
        planName: data.planName,
        subscription: data.subscription,
        features: data.features || DEFAULT_FEATURES,
        aiQuota: data.aiQuota || null,
        recentPayments: data.recentPayments || [],
      });
    } catch (err) {
      // Keep existing state on transient offline errors
      console.warn('[SubscriptionStore] Could not fetch subscription status:', (err as Error)?.message);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPlans: async () => {
    try {
      const plans = await subscriptionApi.getPlans();
      set({ plans });
    } catch (err) {
      console.warn('[SubscriptionStore] Could not fetch plans:', (err as Error)?.message);
    }
  },

  setSelectedBillingPeriod: (period) => set({ selectedBillingPeriod: period }),

  openPaywall: (source = 'general') => {
    set({
      isQuotaModalVisible: false,
      isPaywallVisible: true,
      paywallSource: source,
    });
    if (get().plans.length === 0) {
      get().fetchPlans();
    }
  },

  closePaywall: () => set({ isPaywallVisible: false }),

  startCheckout: async (period) => {
    const billingPeriod = period || get().selectedBillingPeriod;
    const wasPro = get().isPro;
    set({ isCreatingCheckout: true, isExtensionCheckout: wasPro });
    try {
      const checkout = await subscriptionApi.createCheckout({
        billingPeriod,
        paymentMethod: 'SEPAY',
      });
      await AsyncStorage.setItem('nutraai_pending_checkout_id', checkout.paymentId).catch(() => {});
      set({
        activeCheckout: checkout,
        isPaywallVisible: false,
        isQrModalVisible: true,
      });
      return checkout;
    } catch (err) {
      console.error('[SubscriptionStore] Checkout creation failed:', err);
      throw err;
    } finally {
      set({ isCreatingCheckout: false });
    }
  },

  closeQrModal: () => {
    // Keep active checkout and storage key so floating pending widget can display and resume
    set({ isQrModalVisible: false });
  },

  resumeQrModal: () => {
    if (get().activeCheckout) {
      set({ isQrModalVisible: true });
    }
  },

  cancelCheckout: async () => {
    const paymentId = get().activeCheckout?.paymentId || (await AsyncStorage.getItem('nutraai_pending_checkout_id'));
    if (paymentId) {
      try {
        await subscriptionApi.cancelPayment(paymentId);
      } catch {}
    }
    await AsyncStorage.removeItem('nutraai_pending_checkout_id').catch(() => {});
    set({
      activeCheckout: null,
      isQrModalVisible: false,
    });
  },

  handlePaymentCompleted: async () => {
    await AsyncStorage.removeItem('nutraai_pending_checkout_id').catch(() => {});
    set({
      isQrModalVisible: false,
      isPaywallVisible: false,
      isSuccessModalVisible: true,
      isPro: true,
    });
    await get().fetchSubscriptionStatus();
  },

  closeSuccessModal: () => {
    AsyncStorage.removeItem('nutraai_pending_checkout_id').catch(() => {});
    set({ isSuccessModalVisible: false, activeCheckout: null, isExtensionCheckout: false });
  },

  checkPendingPayment: async () => {
    try {
      const pendingPaymentId = await AsyncStorage.getItem('nutraai_pending_checkout_id');
      const currentPaymentId = get().activeCheckout?.paymentId || pendingPaymentId;

      // Only check and celebrate if user actively initiated a pending checkout session
      if (!currentPaymentId) {
        return false;
      }

      const res = await subscriptionApi.getPaymentStatus(currentPaymentId);
      if (res.status === 'COMPLETED') {
        await AsyncStorage.removeItem('nutraai_pending_checkout_id').catch(() => {});
        await get().handlePaymentCompleted();
        return true;
      } else if (res.status === 'EXPIRED' || res.status === 'FAILED') {
        await AsyncStorage.removeItem('nutraai_pending_checkout_id').catch(() => {});
        set({ activeCheckout: null });
        return false;
      } else if (res.status === 'PENDING' && !get().activeCheckout && res.sepay && res.plan) {
        set({
          activeCheckout: {
            paymentId: res.paymentId,
            paymentCode: res.paymentCode,
            status: res.status,
            paymentMethod: res.paymentMethod as any,
            amount: res.amount,
            currency: res.currency,
            expiresAt: res.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            plan: res.plan,
            sepay: res.sepay,
          },
        });
      }
    } catch (err) {
      // Ignore transient network errors
    }
    return false;
  },

  openQuotaModal: (type = 'SCAN', fallbackAction) => {
    set({
      isQuotaModalVisible: true,
      quotaModalType: type,
      onQuotaFallbackAction: fallbackAction || null,
    });
    get().fetchSubscriptionStatus();
  },

  closeQuotaModal: () => set({ isQuotaModalVisible: false, onQuotaFallbackAction: null }),
}));

