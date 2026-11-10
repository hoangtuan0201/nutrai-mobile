import { apiClient } from '../../../lib/api';
import type {
  BillingPeriod,
  CreateCheckoutResponse,
  MySubscriptionResponse,
  PaymentMethodType,
  PaymentStatusResponse,
  SubscriptionPlan,
  UserDailyAiQuota,
} from '../types';

export const subscriptionApi = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const { data } = await apiClient.get<SubscriptionPlan[]>('/payments/plans');
    return data;
  },

  getMySubscription: async (): Promise<MySubscriptionResponse> => {
    const { data } = await apiClient.get<MySubscriptionResponse>('/payments/subscription/me');
    return data;
  },

  getAiQuota: async (): Promise<UserDailyAiQuota> => {
    const { data } = await apiClient.get<UserDailyAiQuota>('/ai/quota');
    return data;
  },

  createCheckout: async (payload: {
    planId?: string;
    billingPeriod?: BillingPeriod;
    paymentMethod?: PaymentMethodType;
  }): Promise<CreateCheckoutResponse> => {
    const { data } = await apiClient.post<CreateCheckoutResponse>('/payments/checkout', payload);
    return data;
  },

  getPaymentStatus: async (paymentId: string): Promise<PaymentStatusResponse> => {
    const { data } = await apiClient.get<PaymentStatusResponse>(`/payments/${paymentId}/status`);
    return data;
  },

  verifyPayment: async (paymentId: string): Promise<PaymentStatusResponse> => {
    const { data } = await apiClient.post<PaymentStatusResponse>(`/payments/${paymentId}/verify`);
    return data;
  },

  cancelPayment: async (paymentId: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(`/payments/${paymentId}/cancel`);
    return data;
  },
};

