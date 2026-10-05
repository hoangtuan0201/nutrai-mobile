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
  };
}

export interface ForgotPasswordResponse {
  message: string;
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

  /** POST /auth/refresh — exchange refresh token for new access token */
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const { data } = await apiClient.post<{ accessToken: string }>('/auth/refresh', {
      refreshToken,
    });
    return data;
  },

  /** POST /auth/forgot-password — initiate password reset */
  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    const { data } = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', {
      email,
    });
    return data;
  },
};
