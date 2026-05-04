import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
} from 'axios';

/**
 * API Client Configuration with httpOnly Cookie Authentication
 * Uses httpOnly cookies for authentication instead of Bearer tokens.
 *
 * NOTE:
 * This is the single source of truth for the backend base URL on the frontend.
 * All HTTP clients (including the generic `api-client` in `src/lib`) should
 * import and use this `API_BASE_URL` to ensure consistent behavior across
 * participant, sponsor, and superadmin flows.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:9090/v1/api';

const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  // Request interceptor
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Add Bearer token from sessionStorage if available
      if (typeof window !== 'undefined') {
        const accessToken =
          sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
        const tokenType = sessionStorage.getItem('tokenType') || 'Bearer';

        if (accessToken && config.headers) {
          config.headers.Authorization = `${tokenType} ${accessToken}`;
        }

        // Add X-Tenant-ID header from sessionStorage
        // This is stored during login/registration flows
        const tenantId =
          sessionStorage.getItem('tenantId') ||
          sessionStorage.getItem('participantTenantId') ||
          localStorage.getItem('tenantId');

        if (tenantId && config.headers) {
          config.headers['X-Tenant-ID'] = tenantId;
        }
      }

      return config;
    },
    (error: AxiosError) => {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError) => {
      const status = error.response?.status;
      const url = error.config?.url || '';

      // Optional endpoints that shouldn't cause redirects
      const optionalEndpoints = [
        '/superadmin/impersonation/sessions',
        '/superadmin/impersonation/status',
        '/finch/auth/token',
        // Demo/test endpoints should not trigger forced logout/redirect UX
        '/demo/payroll/',
        '/btc/demo/',
      ];

      const isOptionalEndpoint = optionalEndpoints.some((endpoint) =>
        url.includes(endpoint)
      );

      // Handle 401 - redirect to login
      if (status === 401) {
        const isAuthEndpoint =
          url.includes('/auth/login') ||
          url.includes('/auth/register') ||
          url.includes('/auth/send-otp') ||
          url.includes('/auth/verify-otp') ||
          url.includes('/auth/verify-participant-email') ||
          url.includes('/auth/validate-participant-invite') ||
          url.includes('/superadmin/auth/');

        // Don't auto-redirect for admin pages - let the page handle 401 gracefully
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        const isAdminPage = currentPath.startsWith('/admin');

        // Also check if already on login page to prevent redirect loops
        const isLoginPage = currentPath.startsWith('/login');

        if (!isAuthEndpoint && !isOptionalEndpoint && !isAdminPage && !isLoginPage && typeof window !== 'undefined') {
          console.error('401 Unauthorized:', url);

          // Clear all auth tokens to prevent redirect loop
          const authKeys = ['accessToken', 'tokenType', 'isAuthenticated', 'userInfo', 'auth_token'];
          authKeys.forEach((key) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });

          window.location.href = '/login?session=expired';
        }
      }

      // Log errors in development (except expected ones and canceled requests)
      if (
        process.env.NODE_ENV === 'development' &&
        status !== 401 &&
        status !== 404 &&
        status !== 501 &&
        !isOptionalEndpoint &&
        error.message !== 'canceled'
      ) {
        const errorDetails = {
          status: status || 'No status',
          url: url || 'No URL',
          message: error.message || 'No error message',
          data: error.response?.data || 'No response data',
          hasToken: typeof window !== 'undefined' ? !!sessionStorage.getItem('accessToken') : 'N/A',
          errorCode: error.code || 'No error code',
        };

        // Only log if there's meaningful error information
        if (status || error.message || error.response?.data) {
          console.error('API Error:', errorDetails);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export const apiClient = createApiClient();

/**
 * Custom instance for Orval-generated API client
 */
export const customInstance = <T>(
  config: Omit<Partial<InternalAxiosRequestConfig>, 'headers'> & {
    url: string;
    method: string;
    headers?: Record<string, string>;
    params?: Record<string, unknown>;
    data?: unknown;
  }
): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = apiClient({
    ...config,
    headers: config.headers || {},
    cancelToken: source.token,
  } as InternalAxiosRequestConfig).then(({ data }) => data);

  // @ts-expect-error - Adding cancel method to promise
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

export default apiClient;
