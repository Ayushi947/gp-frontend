/**
 * Centralized route configuration
 * Single source of truth for all application routes
 */

export const ROUTES = {
  // Authentication
  AUTH: {
    LOGIN: '/login',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    VERIFY_EMAIL: '/verify-email',
  },

  // Get Started - Sponsor Onboarding
  GET_STARTED: {
    ROOT: '/get-started',
    EMAIL: '/get-started/email',
    VERIFY_OTP: '/get-started/verify-otp',
    CREATE_ACCOUNT: '/get-started/create-account',
    COMPANY_INFO: '/get-started/company-info',
    BUSINESS: '/get-started/business',
    EMPLOYMENT_STATUS: '/get-started/employment-status',
    BUSINESS_SIZE: '/get-started/business-size',
    PLAN_PRIORITY: '/get-started/plan-priority',
    EXISTING_PLAN: '/get-started/existing-plan',
    MULTIPLE_BUSINESSES: '/get-started/multiple-businesses',
    PAYROLL_PROVIDER: '/get-started/payroll-provider',
    PLAN_RECOMMENDATION: '/get-started/plan-recommendation',
    // PLAN_DESIGN removed - routes directly to plan-specific pages (traditional/safe-harbor/starter/solo)
    BUSINESS_DETAILS: '/get-started/business-details',
    REVIEW_PRICING: '/get-started/review-pricing',
    CHECKOUT: '/get-started/checkout',
    CONFIRM_PLAN_START_DATE: '/get-started/confirm-plan-start-date',
    CONFIRM_TRUSTEE: '/get-started/confirm-trustee',
    AUTHORIZE_PROVIDER: '/get-started/authorize-provider',
    REVIEW_AND_SIGN_DOCUMENT: '/get-started/review-and-sign-document',
    BANK_ACCOUNT: '/get-started/bank-account',
    FINCH_CONNECT: '/get-started/finch-connect',
    CONFIRMATION: '/get-started/confirmation',
  },

  // Participant Enrollment
  PARTICIPANT_ENROLLMENT: {
    EMAIL: '/participant/email',
    VERIFY_OTP: '/participant/verify-otp',
    IDENTITY_VERIFICATION: '/participant/identity-verification',
    SET_PASSWORD: '/participant/set-password',
    CHOOSE_INVESTMENT_PATH: '/participant/choose-investment-path',
    RETIREMENT_PLANS: '/participant/retirement-plans',
    DEFAULT_PORTFOLIO: '/participant/default-portfolio',
    CUSTOM_PORTFOLIO: '/participant/custom-portfolio',
  },

  // Sponsor Routes
  SPONSOR: {
    DASHBOARD: '/dashboard',
    PARTICIPANTS: {
      LIST: '/participants',
      DETAIL: (id: string) => `/participants/${id}` as const,
      INVITE: '/participants/invite',
    },
    CONTRIBUTIONS: {
      ROOT: '/contributions',
      UPLOAD: '/contributions/upload',
      HISTORY: '/contributions/history',
    },
    COMPLIANCE: {
      ROOT: '/compliance',
      TESTS: '/compliance/tests',
      REPORTS: '/compliance/reports',
    },
    REPORTS: {
      ROOT: '/reports',
      CONTRIBUTIONS: '/reports/contributions',
      PARTICIPANT_BALANCE: '/reports/participant-balance',
      PAYROLL: '/reports/payroll',
      ANNUAL: '/reports/annual',
      DEFERRAL_RATES: '/reports/deferral-rates',
    },
    INVESTMENTS: {
      ROOT: '/investments',
      PORTFOLIOS: '/investments/portfolios',
      REBALANCING: '/investments/rebalancing',
    },
    PLAN: {
      ROOT: '/plan',
      DETAILS: '/plan/details',
      DOCUMENTS: '/plan/documents',
      PRICING: '/plan/pricing',
      ADMINISTRATORS: '/plan/administrators',
    },
  },

  // Participant Routes
  PARTICIPANT: {
    DASHBOARD: '/participant/dashboard',
    PORTFOLIO: {
      ROOT: '/participant/portfolio',
      ALLOCATION: '/participant/portfolio/allocation',
      PERFORMANCE: '/participant/portfolio/performance',
      CHANGE: '/participant/portfolio/change',
    },
    CONTRIBUTIONS: {
      ROOT: '/participant/contributions',
      CURRENT: '/participant/contributions/current',
      HISTORY: '/participant/contributions/history',
      CHANGE: '/participant/contributions/change',
    },
    TRANSACTIONS: '/participant/transactions',
    STATEMENTS: '/participant/statements',
    WITHDRAWALS: {
      ROOT: '/participant/withdrawals',
      OPTIONS: '/participant/withdrawals/options',
      REQUEST: '/participant/withdrawals/request',
    },
    BENEFICIARIES: '/participant/beneficiaries',
  },

  // Admin Routes
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    TENANTS: {
      LIST: '/admin/tenants',
      DETAIL: (id: string) => `/admin/tenants/${id}` as const,
      CREATE: '/admin/tenants/create',
    },
    USERS: {
      LIST: '/admin/users',
      DETAIL: (id: string) => `/admin/users/${id}` as const,
    },
    IMPERSONATION: '/admin/impersonation',
    TASKS: {
      ROOT: '/admin/tasks',
      ACTIVE: '/admin/tasks/active',
      HISTORY: '/admin/tasks/history',
    },
    AUDIT: '/admin/audit',
    CONFIG: {
      ROOT: '/admin/config',
      FEATURES: '/admin/config/features',
      EMAIL: '/admin/config/email',
      SECURITY: '/admin/config/security',
    },
    HEALTH: '/admin/health',
  },

  // Shared Routes
  SHARED: {
    SETTINGS: {
      ROOT: '/settings',
      PROFILE: '/settings/profile',
      SECURITY: '/settings/security',
      NOTIFICATIONS: '/settings/notifications',
      APPEARANCE: '/settings/appearance',
    },
    SUPPORT: {
      ROOT: '/support',
      TICKETS: '/support/tickets',
      TICKET_DETAIL: (id: string) => `/support/tickets/${id}` as const,
      NEW_TICKET: '/support/tickets/new',
      FAQ: '/support/faq',
      CONTACT: '/support/contact',
    },
    NOTIFICATIONS: '/notifications',
    RESOURCES: {
      ROOT: '/resources',
      DOCUMENTS: '/resources/documents',
      VIDEOS: '/resources/videos',
      GUIDES: '/resources/guides',
    },
    ACTIVITY: '/activity',
  },

  // Public Routes
  PUBLIC: {
    HOME: '/',
    PRICING: '/pricing',
    ABOUT: '/about',
    TERMS: '/terms',
    PRIVACY: '/privacy',
  },
} as const;

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
  ROUTES.AUTH.LOGIN,
  ROUTES.AUTH.FORGOT_PASSWORD,
  ROUTES.AUTH.RESET_PASSWORD,
  ROUTES.AUTH.VERIFY_EMAIL,
  ROUTES.PUBLIC.HOME,
  ROUTES.PUBLIC.PRICING,
  ROUTES.PUBLIC.ABOUT,
  ROUTES.PUBLIC.TERMS,
  ROUTES.PUBLIC.PRIVACY,
  '/get-started',
  '/participant/email',
  '/participant/verify-otp',
  '/participant/identity-verification',
  '/participant/set-password',
  '/participant/choose-investment-path',
  '/participant/default-portfolio',
  '/participant/custom-portfolio',
];

/**
 * Routes that require initial onboarding (no full auth)
 */
export const ONBOARDING_ENTRY_ROUTES = [
  '/get-started',
  '/participant/email',
];

/**
 * Sponsor-only routes
 */
export const SPONSOR_ROUTES = [
  ROUTES.SPONSOR.DASHBOARD,
  '/participants',
  '/contributions',
  '/compliance',
  '/reports',
  '/investments',
  '/plan',
];

/**
 * Participant-only routes
 */
export const PARTICIPANT_ROUTES = ['/participant'];

/**
 * Admin-only routes
 */
export const ADMIN_ROUTES = ['/admin'];

/**
 * Shared routes accessible by all authenticated users
 */
export const SHARED_ROUTES = ['/settings', '/support', '/notifications', '/resources', '/activity'];

/**
 * Get dashboard URL based on user role
 */
export function getDashboardUrl(role: string): string {
  const normalizedRole = role.toUpperCase();

  const roleMap: Record<string, string> = {
    SUPER_ADMIN: ROUTES.ADMIN.DASHBOARD,
    SUPERADMIN: ROUTES.ADMIN.DASHBOARD,
    ADMIN: ROUTES.SPONSOR.DASHBOARD,
    SPONSOR: ROUTES.SPONSOR.DASHBOARD,
    HR_ADMIN: ROUTES.SPONSOR.DASHBOARD,
    PARTICIPANT: ROUTES.PARTICIPANT.DASHBOARD,
    EMPLOYEE: ROUTES.PARTICIPANT.DASHBOARD,
  };

  return roleMap[normalizedRole] ?? ROUTES.SPONSOR.DASHBOARD;
}

/**
 * Check if a route is public (doesn't require auth)
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Check if a route belongs to a specific persona
 */
export function isRouteForRole(pathname: string, role: string): boolean {
  const normalizedRole = role.toUpperCase();

  // Admin routes
  if (pathname.startsWith('/admin')) {
    return ['SUPER_ADMIN', 'SUPERADMIN'].includes(normalizedRole);
  }

  // Participant routes
  if (pathname.startsWith('/participant')) {
    return ['PARTICIPANT', 'EMPLOYEE'].includes(normalizedRole);
  }

  // Sponsor routes
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/participants') ||
    pathname.startsWith('/contributions') ||
    pathname.startsWith('/compliance') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/investments') ||
    pathname.startsWith('/plan')
  ) {
    return ['SPONSOR', 'ADMIN', 'HR_ADMIN'].includes(normalizedRole);
  }

  // Shared routes - all roles
  if (
    pathname.startsWith('/settings') ||
    pathname.startsWith('/support') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/resources') ||
    pathname.startsWith('/activity')
  ) {
    return true;
  }

  return true;
}

/**
 * Validate a redirect URL to prevent open redirect attacks
 */
export function validateRedirectUrl(url: string | null): string {
  if (!url) return ROUTES.SPONSOR.DASHBOARD;

  // Only allow relative URLs starting with /
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }

  // For absolute URLs, validate against allowed hosts
  try {
    const parsed = new URL(url);
    const allowedHosts = [
      'app.glidingpath.com',
      'glidingpath.com',
      'localhost:3000',
      'localhost',
    ];

    if (allowedHosts.includes(parsed.host)) {
      return url;
    }
  } catch {
    // Invalid URL
  }

  return ROUTES.SPONSOR.DASHBOARD;
}
