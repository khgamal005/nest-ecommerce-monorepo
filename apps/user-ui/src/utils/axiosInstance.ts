import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// Extend AxiosRequestConfig to include custom requiresAuth flag
declare module 'axios' {
  interface AxiosRequestConfig {
    requiresAuth?: boolean;
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if required and available
    if (config.requiresAuth !== false) {
      // Check for token in localStorage or cookies
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors (token expired)
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        // Optionally redirect to login
        // window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

const ACCESS_TOKEN_KEY = 'accessToken';
const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes before expiry

export function isAccessTokenStale(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return true;

  // Try to decode a JWT `exp` claim if present.
  try {
    const payload = token.split('.')[1];
    if (payload) {
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      const expMs = typeof decoded?.exp === 'number' ? decoded.exp * 1000 : NaN;
      if (Number.isFinite(expMs)) {
        return expMs - Date.now() < STALE_THRESHOLD_MS;
      }
    }
  } catch {
    // Not a JWT — fall through to token-presence heuristic below.
  }

  return false;
}

export async function refreshSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const response = await axiosInstance.post(
      '/api/auth/refresh',
      {},
      { requiresAuth: false },
    );
    const newToken = response?.data?.accessToken;
    if (newToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
      return true;
    }
    return false;
  } catch {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return false;
  }
}
