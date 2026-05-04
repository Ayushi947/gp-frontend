import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL } from '@/api/client';
import { toast } from './toast';
import { ROUTES } from '@/config/routes';

/** 
 * API Error response structure from backend
 */
export interface ApiErrorResponse {
  message: string;
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp?: string;
  path?: string;
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly errors: ApiErrorResponse['errors'];

  constructor(
    message: string,
    status: number,
    code: string = 'UNKNOWN_ERROR',
    errors?: ApiErrorResponse['errors']
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

/**
 * API client configuration
 *
 * IMPORTANT:
 * Do NOT redefine the base URL here. We import `API_BASE_URL` from `@/api/client`
 * so that both the Orval-generated clients (which use `customInstance`) and this
 * generic client use the exact same base URL and environment-variable logic.
 */
const API_TIMEOUT = 30000; // 30 seconds

/**
 * Create configured axios instance
 */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    withCredentials: true, // Send httpOnly cookies
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Add CSRF token for state-changing requests
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() ?? '')) {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
          config.headers['X-XSRF-TOKEN'] = csrfToken;
        }
      }

      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError<ApiErrorResponse>) => {
      return handleApiError(error);
    }
  );

  return client;
}

/**
 * Handle API errors with proper error messages
 */
async function handleApiError(error: AxiosError<ApiErrorResponse>): Promise<never> {
  // Network error - no response
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      throw new ApiError(
        'Request timed out. Please try again.',
        0,
        'TIMEOUT'
      );
    }

    throw new ApiError(
      'Unable to connect to the server. Please check your internet connection.',
      0,
      'NETWORK_ERROR'
    );
  }

  const { status, data } = error.response;
  const message = data?.message ?? getDefaultErrorMessage(status);
  const code = data?.code ?? getErrorCode(status);

  // Handle specific status codes
  switch (status) {
    case 401:
      // Unauthorized
      // For participant enrollment/auth endpoints and admin pages, don't force redirect to login.
      // Let the calling page handle the error so the user can continue their flow.
      {
        const url = error.config?.url ?? '';
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

        const isParticipantEnrollmentEndpoint =
          url.includes('/auth/verify-participant-email') ||
          url.includes('/auth/send-otp') ||
          url.includes('/auth/validate-participant-invite');

        // Don't auto-logout on admin pages - let the page handle 401 errors gracefully
        const isAdminPage = currentPath.startsWith('/admin');

        if (!isParticipantEnrollmentEndpoint && !isAdminPage && typeof window !== 'undefined') {
          // Only redirect if not already on login page
          if (!currentPath.startsWith('/login')) {
            // Clear all auth tokens to prevent redirect loop
            const authKeys = ['accessToken', 'tokenType', 'isAuthenticated', 'userInfo', 'auth_token'];
            authKeys.forEach((key) => {
              localStorage.removeItem(key);
              sessionStorage.removeItem(key);
            });

            window.location.href = `${ROUTES.AUTH.LOGIN}?session=expired`;
          }
        }
      }
      throw new ApiError('Your session has expired. Please sign in again.', status, 'UNAUTHORIZED');

    case 403:
      throw new ApiError(
        'You do not have permission to perform this action.',
        status,
        'FORBIDDEN',
        data?.errors
      );

    case 404:
      throw new ApiError('The requested resource was not found.', status, 'NOT_FOUND');

    case 422:
      throw new ApiError(
        'Please check the form for errors.',
        status,
        'VALIDATION_ERROR',
        data?.errors
      );

    case 429:
      throw new ApiError(
        'Too many requests. Please wait a moment and try again.',
        status,
        'RATE_LIMITED'
      );

    case 500:
    case 502:
    case 503:
    case 504:
      throw new ApiError(
        'Server error. Our team has been notified. Please try again later.',
        status,
        'SERVER_ERROR'
      );

    default:
      throw new ApiError(message, status, code, data?.errors);
  }
}

/**
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1] ?? '') : null;
}

/**
 * Get default error message based on status code
 */
function getDefaultErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Please sign in to continue.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This operation conflicts with the current state.',
    422: 'Please check the form for errors.',
    429: 'Too many requests. Please wait a moment.',
    500: 'Server error. Please try again later.',
    502: 'Server is temporarily unavailable.',
    503: 'Service is temporarily unavailable.',
    504: 'Request timed out. Please try again.',
  };

  return messages[status] ?? 'An unexpected error occurred.';
}

/**
 * Get error code based on status
 */
function getErrorCode(status: number): string {
  const codes: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'RATE_LIMITED',
    500: 'SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT',
  };

  return codes[status] ?? 'UNKNOWN_ERROR';
}

/**
 * Main API client instance
 */
export const apiClient = createApiClient();

/**
 * Type-safe API request helpers
 */
export const api = {
  /**
   * GET request
   */
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  },

  /**
   * POST request
   */
  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },

  /**
   * PUT request
   */
  put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },

  /**
   * PATCH request
   */
  patch: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  },

  /**
   * DELETE request
   */
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },

  /**
   * Upload file(s)
   */
  upload: async <T>(
    url: string,
    files: File | File[],
    fieldName: string = 'file',
    additionalData?: Record<string, string>
  ): Promise<T> => {
    const formData = new FormData();

    if (Array.isArray(files)) {
      files.forEach((file, index) => {
        formData.append(`${fieldName}[${index}]`, file);
      });
    } else {
      formData.append(fieldName, files);
    }

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await apiClient.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Download file
   */
  download: async (url: string, filename: string): Promise<void> => {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data as BlobPart]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

/**
 * Helper to handle API calls with toast notifications
 */
export async function withToast<T>(
  promise: Promise<T>,
  messages: {
    loading?: string;
    success?: string;
    error?: string;
  }
): Promise<T> {
  if (messages.loading) {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success ?? 'Success',
      error: messages.error ?? 'An error occurred',
    });
  }

  try {
    const result = await promise;
    if (messages.success) {
      toast.success(messages.success);
    }
    return result;
  } catch (error) {
    const errorMessage =
      error instanceof ApiError
        ? error.message
        : messages.error ?? 'An error occurred';
    toast.error(errorMessage);
    throw error;
  }
}
