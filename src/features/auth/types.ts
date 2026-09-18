/**
 * auth feature types — matching NutraAI backend Prisma schema
 */

export type UserRole = 'USER' | 'ADMIN';
export type SubscriptionPlan = 'FREE' | 'PRO';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}
