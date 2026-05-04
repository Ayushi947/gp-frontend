'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFormPersistence } from './usePersistedState';
import { ROUTES } from '@/config/routes';
import { clearOnboardingData, clearAllOnboardingData } from '@/lib/onboarding-storage';

/**
 * Sponsor onboarding steps in order
 */
export const ONBOARDING_STEPS = [
  { id: 'root', route: ROUTES.GET_STARTED.ROOT, label: 'Get Started' },
  { id: 'email', route: ROUTES.GET_STARTED.EMAIL, label: 'Email Verification' },
  { id: 'verify-otp', route: ROUTES.GET_STARTED.VERIFY_OTP, label: 'Verify Email' },
  { id: 'create-account', route: ROUTES.GET_STARTED.CREATE_ACCOUNT, label: 'Create Account' },
  { id: 'company-info', route: ROUTES.GET_STARTED.COMPANY_INFO, label: 'Company Info' },
  { id: 'employment-status', route: ROUTES.GET_STARTED.EMPLOYMENT_STATUS, label: 'Employment Status' },
  { id: 'business-size', route: ROUTES.GET_STARTED.BUSINESS_SIZE, label: 'Business Size' },
  { id: 'existing-plan', route: ROUTES.GET_STARTED.EXISTING_PLAN, label: 'Existing Plan' },
  { id: 'multiple-businesses', route: ROUTES.GET_STARTED.MULTIPLE_BUSINESSES, label: 'Multiple Businesses' },
  { id: 'payroll-provider', route: ROUTES.GET_STARTED.PAYROLL_PROVIDER, label: 'Payroll Provider' },
  { id: 'plan-recommendation', route: ROUTES.GET_STARTED.PLAN_RECOMMENDATION, label: 'Plan Recommendation' },
  // Note: plan-design step removed - we route directly to plan-specific pages (traditional/safe-harbor/starter/solo)
  { id: 'business-details', route: ROUTES.GET_STARTED.BUSINESS_DETAILS, label: 'Business Details' },
  { id: 'review-pricing', route: ROUTES.GET_STARTED.REVIEW_PRICING, label: 'Review Pricing' },
  { id: 'checkout', route: ROUTES.GET_STARTED.CHECKOUT, label: 'Checkout' },
  { id: 'confirm-plan-start-date', route: ROUTES.GET_STARTED.CONFIRM_PLAN_START_DATE, label: 'Confirm Plan Start Date' },
  { id: 'confirm-trustee', route: ROUTES.GET_STARTED.CONFIRM_TRUSTEE, label: 'Confirm Trustee' },
  { id: 'authorize-provider', route: ROUTES.GET_STARTED.AUTHORIZE_PROVIDER, label: 'Authorize Provider' },
  { id: 'review-and-sign-document', route: ROUTES.GET_STARTED.REVIEW_AND_SIGN_DOCUMENT, label: 'Review & Sign Document' },
  { id: 'bank-account', route: ROUTES.GET_STARTED.BANK_ACCOUNT, label: 'Bank Account' },
  { id: 'finch-connect', route: ROUTES.GET_STARTED.FINCH_CONNECT, label: 'Payroll Integration' },
  { id: 'confirmation', route: ROUTES.GET_STARTED.CONFIRMATION, label: 'Confirmation' },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]['id'];

/**
 * Data collected during sponsor onboarding
 */
export interface SponsorOnboardingData extends Record<string, unknown> {
  // Step tracking
  currentStep: OnboardingStepId;
  completedSteps: OnboardingStepId[];
  startedAt: string | null;
  lastUpdatedAt: string | null;

  // Email verification
  email: string;
  emailVerified: boolean;

  // Account creation
  adminFullName: string;
  accountCreated: boolean;

  // Company information
  companyName: string;
  companyLegalName: string;
  ein: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };

  // Business details
  businessSize: string;
  employeeCount: number | null;
  employmentStatus: string;

  // Plan details
  hasExistingPlan: boolean | null;
  existingPlanType: string;
  existingPlanProvider: string;
  hasMultipleBusinesses: boolean | null;

  // Payroll
  payrollProvider: string;

  // Plan selection
  selectedPlanType: string;

  // Additional data
  metadata: Record<string, unknown>;
}

const DEFAULT_ONBOARDING_DATA: SponsorOnboardingData = {
  currentStep: 'root',
  completedSteps: [],
  startedAt: null,
  lastUpdatedAt: null,
  email: '',
  emailVerified: false,
  adminFullName: '',
  accountCreated: false,
  companyName: '',
  companyLegalName: '',
  ein: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
  },
  businessSize: '',
  employeeCount: null,
  employmentStatus: '',
  hasExistingPlan: null,
  existingPlanType: '',
  existingPlanProvider: '',
  hasMultipleBusinesses: null,
  payrollProvider: '',
  selectedPlanType: '',
  metadata: {},
};

const STORAGE_KEY = 'sponsor_onboarding_progress';

/**
 * Hook to manage sponsor onboarding state and progress
 */
export function useSponsorOnboarding() {
  const router = useRouter();
  const { data, updateData, clearData, isHydrated } = useFormPersistence<SponsorOnboardingData>({
    key: STORAGE_KEY,
    initialValue: DEFAULT_ONBOARDING_DATA,
    storageType: 'localStorage', // Use localStorage so progress persists across sessions
  });

  /**
   * Get step index by ID
   */
  const getStepIndex = useCallback((stepId: OnboardingStepId): number => {
    return ONBOARDING_STEPS.findIndex((s) => s.id === stepId);
  }, []);

  /**
   * Get current step info
   */
  const currentStepInfo = useMemo(() => {
    return ONBOARDING_STEPS.find((s) => s.id === data.currentStep) ?? ONBOARDING_STEPS[0];
  }, [data.currentStep]);

  /**
   * Get step number (1-based)
   */
  const currentStepNumber = useMemo(() => {
    return getStepIndex(data.currentStep) + 1;
  }, [data.currentStep, getStepIndex]);

  /**
   * Total steps count
   */
  const totalSteps = ONBOARDING_STEPS.length;

  /**
   * Progress percentage
   */
  const progressPercentage = useMemo(() => {
    return Math.round((data.completedSteps.length / totalSteps) * 100);
  }, [data.completedSteps.length, totalSteps]);

  /**
   * Check if a step is completed
   */
  const isStepCompleted = useCallback(
    (stepId: OnboardingStepId): boolean => {
      return data.completedSteps.includes(stepId);
    },
    [data.completedSteps]
  );

  /**
   * Check if user can access a step (previous steps must be completed)
   */
  const canAccessStep = useCallback(
    (stepId: OnboardingStepId): boolean => {
      const stepIndex = getStepIndex(stepId);
      if (stepIndex === 0) return true;

      // Check if all previous steps are completed
      for (let i = 0; i < stepIndex; i++) {
        const step = ONBOARDING_STEPS[i];
        if (step && !data.completedSteps.includes(step.id)) {
          return false;
        }
      }
      return true;
    },
    [data.completedSteps, getStepIndex]
  );

  /**
   * Mark current step as completed and advance to next
   */
  const completeStep = useCallback(
    (stepId: OnboardingStepId, stepData?: Partial<SponsorOnboardingData>) => {
      const newCompletedSteps = data.completedSteps.includes(stepId)
        ? data.completedSteps
        : [...data.completedSteps, stepId];

      const stepIndex = getStepIndex(stepId);
      const nextStep = ONBOARDING_STEPS[stepIndex + 1];

      const updates: Partial<SponsorOnboardingData> = {
        ...stepData,
        completedSteps: newCompletedSteps,
        lastUpdatedAt: new Date().toISOString(),
      };

      if (nextStep) {
        updates.currentStep = nextStep.id;
      }

      // Set startedAt if this is the first step
      if (!data.startedAt) {
        updates.startedAt = new Date().toISOString();
      }

      updateData(updates);

      // Navigate to next step if available
      if (nextStep) {
        router.push(nextStep.route);
      }
    },
    [data.completedSteps, data.startedAt, getStepIndex, updateData, router]
  );

  /**
   * Check if payment has been completed (Stripe session exists)
   */
  const isPaymentCompleted = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    return !!sessionStorage.getItem('stripeSessionId');
  }, []);

  /**
   * Navigate to a specific step (if accessible)
   * Blocks navigation to checkout or earlier steps after payment is completed
   */
  const goToStep = useCallback(
    (stepId: OnboardingStepId) => {
      if (!canAccessStep(stepId)) {
        console.warn(`Cannot access step ${stepId} - previous steps not completed`);
        return;
      }

      // Block navigation to checkout or earlier steps after payment
      const checkoutIndex = ONBOARDING_STEPS.findIndex((s) => s.id === 'checkout');
      const targetIndex = getStepIndex(stepId);
      if (isPaymentCompleted() && targetIndex <= checkoutIndex) {
        console.warn(`Cannot navigate to step ${stepId} - payment already completed`);
        return;
      }

      updateData({ currentStep: stepId });
      const step = ONBOARDING_STEPS.find((s) => s.id === stepId);
      if (step) {
        router.push(step.route);
      }
    },
    [canAccessStep, updateData, router, getStepIndex, isPaymentCompleted]
  );

  /**
   * Go back to previous step
   * Prevents navigating back to or before checkout after payment is completed
   */
  const goBack = useCallback(() => {
    const currentIndex = getStepIndex(data.currentStep);
    if (currentIndex > 0) {
      const previousStep = ONBOARDING_STEPS[currentIndex - 1];
      if (previousStep) {
        // Block backward navigation to checkout or earlier steps after payment
        const checkoutIndex = ONBOARDING_STEPS.findIndex((s) => s.id === 'checkout');
        if (isPaymentCompleted() && getStepIndex(previousStep.id) <= checkoutIndex) {
          return;
        }
        updateData({ currentStep: previousStep.id });
        router.push(previousStep.route);
      }
    }
  }, [data.currentStep, getStepIndex, updateData, router, isPaymentCompleted]);

  /**
   * Resume onboarding from last position
   */
  const resumeOnboarding = useCallback(() => {
    if (data.currentStep && data.startedAt) {
      const step = ONBOARDING_STEPS.find((s) => s.id === data.currentStep);
      if (step) {
        router.push(step.route);
        return true;
      }
    }
    return false;
  }, [data.currentStep, data.startedAt, router]);

  /**
   * Check if onboarding can be resumed
   */
  const canResume = useMemo(() => {
    return !!data.startedAt && data.completedSteps.length > 0;
  }, [data.startedAt, data.completedSteps.length]);

  /**
   * Reset onboarding progress
   * Clears both localStorage (hook state) and sessionStorage (form data)
   */
  const resetOnboarding = useCallback(() => {
    // Clear localStorage (hook state)
    clearData();

    // Clear sessionStorage (form data) - preserve auth if user wants to start over
    clearOnboardingData(true);
  }, [clearData]);

  /**
   * Complete reset - clear everything including authentication
   * Use this for logout or complete restart
   */
  const completeReset = useCallback(() => {
    // Clear localStorage (hook state)
    clearData();

    // Clear all sessionStorage including auth
    clearAllOnboardingData();
  }, [clearData]);

  /**
   * Update onboarding data without completing step
   */
  const saveStepData = useCallback(
    (stepData: Partial<SponsorOnboardingData>) => {
      updateData({
        ...stepData,
        lastUpdatedAt: new Date().toISOString(),
      });
    },
    [updateData]
  );

  return {
    // Data
    data,
    isHydrated,

    // Step info
    currentStepInfo,
    currentStepNumber,
    totalSteps,
    progressPercentage,
    steps: ONBOARDING_STEPS,

    // Step checks
    isStepCompleted,
    canAccessStep,
    canResume,
    isPaymentCompleted,

    // Actions
    completeStep,
    goToStep,
    goBack,
    resumeOnboarding,
    resetOnboarding,
    completeReset,
    saveStepData,
    updateData,
  };
}
