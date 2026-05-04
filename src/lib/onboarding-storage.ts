/**
 * Centralized storage management for onboarding flow
 * Ensures data is properly cleared and synchronized
 */

/**
 * All sessionStorage keys used in the onboarding flow
 */
export const ONBOARDING_STORAGE_KEYS = {
  // Authentication
  accessToken: 'accessToken',
  tokenType: 'tokenType',
  isAuthenticated: 'isAuthenticated',
  userInfo: 'userInfo',

  // Email verification
  email: 'email',
  sponsorEmail: 'sponsorEmail',
  emailVerified: 'emailVerified',
  participantToken: 'participantToken',
  verifiedOTP: 'verifiedOTP',
  tenantId: 'tenantId',

  // Company info
  companyName: 'companyName',
  ein: 'ein',

  // Onboarding flow data
  userType: 'userType',
  employmentStatus: 'employmentStatus',
  businessSize: 'businessSize',
  existingPlan: 'existingPlan',
  hasMultipleBusinesses: 'hasMultipleBusinesses',
  payrollProvider: 'payrollProvider',

  // Plan selection
  selectedPlanType: 'selectedPlanType',
  selectedPricingTier: 'selectedPricingTier',

  // Plan design data
  starterPlanData: 'starterPlanData',
  traditionalPlanConfig: 'traditionalPlanConfig',
  safeHarborPlanData: 'safeHarborPlanData',
  soloPlanData: 'soloPlanData',

  // Business details
  estimatedEmployeeCount: 'estimatedEmployeeCount',
  businessDetailsData: 'businessDetailsData',

  // Additional steps
  planStartDate: 'planStartDate',
  trusteeData: 'trusteeData',
  authorizationData: 'authorizationData',
  stripeSessionId: 'stripeSessionId',

  // Completion flags
  'onboarding:authorize-provider': 'onboarding:authorize-provider',

  // TenantPlan ID (from plan creation)
  tenantPlanId: 'tenantPlanId',
} as const;

/**
 * Keys that should NOT be cleared when resetting onboarding
 * (authentication and verification data should persist)
 */
const PROTECTED_KEYS = [
  ONBOARDING_STORAGE_KEYS.accessToken,
  ONBOARDING_STORAGE_KEYS.tokenType,
  ONBOARDING_STORAGE_KEYS.isAuthenticated,
  ONBOARDING_STORAGE_KEYS.userInfo,
  ONBOARDING_STORAGE_KEYS.email,
  ONBOARDING_STORAGE_KEYS.sponsorEmail,
  ONBOARDING_STORAGE_KEYS.emailVerified,
  ONBOARDING_STORAGE_KEYS.participantToken,
  ONBOARDING_STORAGE_KEYS.verifiedOTP,
  ONBOARDING_STORAGE_KEYS.tenantId,
] as const;

/**
 * Clear all onboarding data from sessionStorage
 * Optionally preserve authentication data
 */
export function clearOnboardingData(preserveAuth = true): void {
  const keysToRemove = Object.values(ONBOARDING_STORAGE_KEYS).filter((key) => {
    if (preserveAuth) {
      return !PROTECTED_KEYS.includes(key as typeof PROTECTED_KEYS[number]);
    }
    return true;
  });

  keysToRemove.forEach((key) => {
    sessionStorage.removeItem(key);
  });

  console.log(`Cleared ${keysToRemove.length} onboarding keys from sessionStorage`, {
    preserved: preserveAuth ? PROTECTED_KEYS.length : 0,
  });
}

/**
 * Clear all onboarding data including authentication
 * Use this for complete logout/reset
 */
export function clearAllOnboardingData(): void {
  clearOnboardingData(false);

  // Also clear localStorage onboarding progress
  localStorage.removeItem('sponsor_onboarding_progress');

  // Clear any other related localStorage items
  localStorage.removeItem('userInfo');
  localStorage.removeItem('isAuthenticated');

  console.log('Cleared all onboarding data from sessionStorage and localStorage');
}

/**
 * Start a fresh onboarding flow
 * Clears old form data but preserves authentication if exists
 */
export function startFreshOnboarding(): void {
  // Check if user is authenticated
  const hasAuth = sessionStorage.getItem(ONBOARDING_STORAGE_KEYS.accessToken);

  if (hasAuth) {
    // User is authenticated - only clear form data, keep auth
    clearOnboardingData(true);
    console.log('Starting fresh onboarding (authenticated user)');
  } else {
    // User is not authenticated - clear everything
    clearAllOnboardingData();
    console.log('Starting fresh onboarding (new user)');
  }
}

/**
 * Check if user has authentication data
 */
export function isUserAuthenticated(): boolean {
  const hasAccessToken = !!sessionStorage.getItem(ONBOARDING_STORAGE_KEYS.accessToken);
  const isAuthenticated = sessionStorage.getItem(ONBOARDING_STORAGE_KEYS.isAuthenticated) === 'true';

  return hasAccessToken && isAuthenticated;
}

/**
 * Get user email from any available source
 */
export function getUserEmail(): string | null {
  // Try direct email keys first
  let email = sessionStorage.getItem(ONBOARDING_STORAGE_KEYS.email)
    || sessionStorage.getItem(ONBOARDING_STORAGE_KEYS.sponsorEmail);

  // If not found, try userInfo
  if (!email) {
    const userInfoStr = sessionStorage.getItem(ONBOARDING_STORAGE_KEYS.userInfo)
      || localStorage.getItem('userInfo');

    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        email = userInfo.email;
      } catch (e) {
        console.error('Failed to parse userInfo:', e);
      }
    }
  }

  return email;
}

/**
 * Debug utility - log all onboarding storage keys and values
 */
export function debugOnboardingStorage(): void {
  console.group('🔍 Onboarding Storage Debug');

  console.group('SessionStorage Keys:');
  Object.entries(ONBOARDING_STORAGE_KEYS).forEach(([name, key]) => {
    const value = sessionStorage.getItem(key);
    if (value) {
      console.log(`✓ ${name} (${key}):`, value.substring(0, 100));
    } else {
      console.log(`✗ ${name} (${key}): <empty>`);
    }
  });
  console.groupEnd();

  console.group('LocalStorage Keys:');
  const localKeys = ['sponsor_onboarding_progress', 'userInfo', 'isAuthenticated'];
  localKeys.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value) {
      console.log(`✓ ${key}:`, value.substring(0, 100));
    } else {
      console.log(`✗ ${key}: <empty>`);
    }
  });
  console.groupEnd();

  console.groupEnd();
}
