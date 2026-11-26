import { apiClient } from '../../../lib/api';
import type { AuthTokens, LoginPayload, RegisterPayload } from '../types';

export interface AuthResponse {
  tokens: AuthTokens;
  isNewUser: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    emailVerified?: boolean;
  };
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface VerifyEmailResponse {
  message: string;
  emailVerified: boolean;
}

/**
 * Auth API — calls NestJS backend endpoints.
 * All routes are @Public() on the server (no JWT required).
 */
export const authApi = {
  /** POST /auth/register — email + password registration */
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  /** POST /auth/login — email + password login */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  /** POST /auth/google — Firebase ID Token exchange */
  loginWithGoogle: async (idToken: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/google', { idToken });
    return data;
  },

  /** POST /auth/forgot-password — initiate password reset (6-digit OTP) */
  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    const { data } = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', {
      email,
    });
    return data;
  },

  /** POST /auth/verify-reset-code — verify 6-digit reset OTP before setting new password */
  verifyResetCode: async (payload: {
    email: string;
    code: string;
  }): Promise<{ valid: boolean; message: string }> => {
    const { data } = await apiClient.post<{ valid: boolean; message: string }>(
      '/auth/verify-reset-code',
      payload,
    );
    return data;
  },

  /** POST /auth/reset-password — confirm OTP & set new password */
  resetPassword: async (payload: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<ForgotPasswordResponse> => {
    const { data } = await apiClient.post<ForgotPasswordResponse>('/auth/reset-password', payload);
    return data;
  },

  /** POST /auth/verify-email — verify email with 6-digit OTP */
  verifyEmail: async (payload: { email: string; code: string }): Promise<VerifyEmailResponse> => {
    const { data } = await apiClient.post<VerifyEmailResponse>('/auth/verify-email', payload);
    return data;
  },

  /** POST /auth/resend-verification — resend 6-digit verification OTP */
  resendVerification: async (email: string): Promise<ForgotPasswordResponse> => {
    const { data } = await apiClient.post<ForgotPasswordResponse>('/auth/resend-verification', {
      email,
    });
    return data;
  },
};
