import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// Extend AxiosRequestConfig to include custom requiresAuth flag
declare module 'axios' {
  interface AxiosRequestConfig {
    requiresAuth?: boolean;
  }
}

export interface FieldError {
  field: string;
  message: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

// Common status-code fallbacks so users get a clear message for 401/403/etc even
// when the backend does not include a message body.
const STATUS_MESSAGES: Record<number, string> = {
  400: 'Bad request',
  401: 'Unauthorized. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'Resource not found',
  409: 'Conflict with existing data',
  422: 'Invalid data',
  500: 'Internal server error',
};

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // The backend authenticates via an httpOnly cookie (JWT) set on login.
    // withCredentials: true is enough; no manual token needed.
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
    const status = error.response?.status;
    const config = error.config as { requiresAuth?: boolean } | undefined;
    const data = error.response?.data ?? {};

    // Normalize backend error body so every page can rely on a consistent shape:
    //   {
    //     fieldErrors: FieldError[]   -> per-field validation errors
    //     message: string             -> human readable summary (login/401/403/...)
    //   }
    const fieldErrors: FieldError[] = [];

    // 1) Validation errors from our error factory -> data.errors or data.message as array
    const rawErrors =
      (Array.isArray(data?.errors) && data.errors) ||
      (Array.isArray(data?.message) &&
        data.message.every((m: unknown) => typeof m === 'object')) &&
      data.message;

    if (Array.isArray(rawErrors)) {
      rawErrors.forEach((raw: { field?: string; message?: string; property?: string }) => {
        fieldErrors.push({
          field: raw.field ?? raw.property ?? '',
          message:
            raw.message ??
            (typeof (raw as any)?.constraints === 'object'
              ? (Object.values((raw as any).constraints)[0] as string)
              : undefined) ??
            'Invalid value',
        });
      });
    }

    // 2) Legacy plain string validation message (array of strings) -> best-effort field mapping
    if (fieldErrors.length === 0 && Array.isArray(data?.message)) {
      data.message.forEach((msg: string) => {
        const field = ['email', 'password', 'name', 'phone', 'title'].find((f) =>
          msg.toLowerCase().includes(f)
        );
        fieldErrors.push({ field: field ?? '', message: msg });
      });
    }

    // Build a single readable message.
    let message: string;
    if (fieldErrors.length > 0) {
      message = fieldErrors.map((fe) => fe.message).join(' • ');
    } else if (typeof data.message === 'string') {
      message = data.message;
    } else if (status && STATUS_MESSAGES[status]) {
      message = STATUS_MESSAGES[status];
    } else {
      message = 'Something went wrong';
    }

    error.message = message;
    error.fieldErrors = fieldErrors;
    if (error.response) {
      error.response.data = { ...data, message, fieldErrors };
    }

    // Redirect to login on session-expiry 401, but NOT for public calls
    // (e.g. the login request itself, which passes requiresAuth: false).
    if (status === 401 && config?.requiresAuth !== false) {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;