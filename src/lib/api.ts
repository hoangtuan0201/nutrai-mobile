import axios from 'axios';
import { ENV } from '../config/env';

export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: ENV.API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT from storage
apiClient.interceptors.request.use(
  async (config) => {
    // TODO: const token = await storage.getToken(); config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401 / refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // TODO: handle token refresh on 401
    return Promise.reject(error);
  },
);
