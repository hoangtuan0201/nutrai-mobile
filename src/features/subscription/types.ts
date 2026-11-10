export type BillingPeriod = 'MONTHLY' | 'YEARLY';
export type PaymentMethodType = 'SEPAY' | 'STRIPE';
export type PaymentStatusType = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'EXPIRED';

export interface SubscriptionPlanFeatures {
  maxMealsPerDay: number;
  aiAnalysisPerDay: number;
  aiChatPerDay: number;
  exportReports: boolean;
  advancedInsights: boolean;
  prioritySupport?: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  billingPeriod: BillingPeriod;
  features: SubscriptionPlanFeatures;
  isActive: boolean;
  sortOrder: number;
}

export interface UserSubscriptionInfo {
  id: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  startsAt: string;
  expiresAt: string;
  plan: SubscriptionPlan;
}

export interface AiQuotaBucket {
  used: number;
  limit: number;
  remaining: number;
}

export interface UserDailyAiQuota {
  isPro: boolean;
  planName: string;
  scans: AiQuotaBucket;
  chats: AiQuotaBucket;
  resetAt: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: PaymentStatusType;
  transactionId: string;
  paymentCode?: string | null;
  paidAt?: string | null;
  createdAt: string;
  plan?: SubscriptionPlan | null;
}

export interface MySubscriptionResponse {
  isPro: boolean;
  planName: string;
  subscription: UserSubscriptionInfo | null;
  features: SubscriptionPlanFeatures;
  aiQuota?: UserDailyAiQuota;
  recentPayments: PaymentRecord[];
}

export interface SePayQrDetails {
  qrUrl: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  amount: number;
  currency: string;
  paymentCode: string;
  transferContent: string;
}

export interface CreateCheckoutResponse {
  paymentId: string;
  paymentCode: string;
  status: PaymentStatusType;
  paymentMethod: PaymentMethodType;
  amount: number;
  currency: string;
  expiresAt: string;
  plan: SubscriptionPlan;
  sepay?: SePayQrDetails;
  stripe?: {
    sessionId: string;
    checkoutUrl: string;
    paymentCode: string;
    amount: number;
    currency: string;
  };
}

export interface PaymentStatusResponse {
  paymentId: string;
  paymentCode: string;
  status: PaymentStatusType;
  paymentMethod: string;
  amount: number;
  currency: string;
  paidAt?: string | null;
  expiresAt?: string | null;
  plan?: SubscriptionPlan | null;
  subscription?: UserSubscriptionInfo | null;
  sepay?: SePayQrDetails;
}

