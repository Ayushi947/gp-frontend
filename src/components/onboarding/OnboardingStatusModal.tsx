'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconCheck,
  IconCircleDashed,
  IconCircle,
  IconArrowRight,
  IconX,
  IconClock,
  IconFileText,
} from '@tabler/icons-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ONBOARDING_STEPS } from '@/hooks/useSponsorOnboarding';
import { useGetOnBoardingState } from '@/api/generated/endpoints/plan-sponsor-details/plan-sponsor-details';
import { useGetDocuments } from '@/api/generated/endpoints/document-management/document-management';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';

interface OnboardingStatusModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Map backend state to step ID
const BACKEND_STATE_TO_STEP_ID: Record<string, string> = {
  COMPANY_BASIC_DETAILS: 'company-info',
  EMPLOYMENT_STATUS: 'employment-status',
  BUSINESS_SIZE: 'business-size',
  EXISTING_PLAN: 'existing-plan',
  MULTIPLE_BUSINESSES: 'multiple-businesses',
  PAYROLL_PROVIDER: 'payroll-provider',
  PLAN_RECOMMENDATION: 'plan-recommendation',
  PLAN_DETAILS: 'plan-recommendation',
  BUSINESS_DETAILS: 'business-details',
  PRICING: 'review-pricing',
  CHECKOUT: 'checkout',
  PLAN_START_DATE: 'confirm-plan-start-date',
  TRUSTEE: 'confirm-trustee',
  AUTHORIZE_PROVIDER: 'authorize-provider',
  SIGN: 'review-and-sign-document',
  BANK_VERIFICATION: 'bank-account',
  FINCH: 'finch-connect',
  DASHBOARD: 'confirmation',
};

export function OnboardingStatusModal({ open, onOpenChange }: OnboardingStatusModalProps) {
  const router = useRouter();
  const { data: onboardingState } = useGetOnBoardingState();
  
  // Check if documents are actually available
  const {
    data: documentsResponse,
    isLoading: isLoadingDocuments,
    error: documentsError,
  } = useGetDocuments();

  const [isOpen, setIsOpen] = useState(false);
  const [documentsStatus, setDocumentsStatus] = useState<string | null>(null);
  const [documentsMessage, setDocumentsMessage] = useState<string | null>(null);

  // Calculate current step and progress based on backend state
  const { currentStepInfo, completedSteps, upcomingSteps, progressPercentage } = useMemo(() => {
    if (!onboardingState?.currentState) {
      return {
        currentStepInfo: ONBOARDING_STEPS[0],
        completedSteps: [],
        upcomingSteps: ONBOARDING_STEPS.slice(1),
        progressPercentage: 0,
      };
    }

    const currentStepId = BACKEND_STATE_TO_STEP_ID[onboardingState.currentState] || 'root';
    const currentIndex = ONBOARDING_STEPS.findIndex((s) => s.id === currentStepId);
    const currentStep = currentIndex >= 0 ? ONBOARDING_STEPS[currentIndex] : ONBOARDING_STEPS[0];

    // All steps before current step are completed
    const completed = currentIndex > 0 ? ONBOARDING_STEPS.slice(0, currentIndex) : [];

    // All steps after current step are upcoming
    const upcoming = currentIndex >= 0 ? ONBOARDING_STEPS.slice(currentIndex + 1) : ONBOARDING_STEPS.slice(1);

    // Calculate progress percentage
    const progress = currentIndex >= 0 ? Math.round((currentIndex / ONBOARDING_STEPS.length) * 100) : 0;

    return {
      currentStepInfo: currentStep,
      completedSteps: completed,
      upcomingSteps: upcoming,
      progressPercentage: progress,
    };
  }, [onboardingState?.currentState]);

  // Check for documents status and verify actual document availability
  useEffect(() => {
    const status = sessionStorage.getItem('documentsStatus');
    const message = sessionStorage.getItem('documentsStatusMessage');
    
    // If we're in SIGN state, check if documents are actually available
    if (onboardingState?.currentState === 'SIGN' && !isLoadingDocuments) {
      const hasDocuments = documentsResponse?.documents && documentsResponse.documents.length > 0;
      
      if (hasDocuments) {
        // Documents are available, clear the pending status
        sessionStorage.removeItem('documentsStatus');
        sessionStorage.removeItem('documentsStatusMessage');
        setDocumentsStatus(null);
        setDocumentsMessage(null);
      } else if (status === 'pending') {
        // Documents are still not available, keep the pending status
        setDocumentsStatus(status);
        setDocumentsMessage(message);
      } else if (documentsError || (!hasDocuments && !isLoadingDocuments)) {
        // No documents and no error from API, but sessionStorage doesn't have pending
        // This might be a fresh load, so check if we should set pending
        if (!status) {
          setDocumentsStatus('pending');
          setDocumentsMessage('Unable to load documents at this time. Our team is working on it.');
        } else {
          setDocumentsStatus(status);
          setDocumentsMessage(message);
        }
      }
    } else {
      // Not in SIGN state, just use sessionStorage value
      setDocumentsStatus(status);
      setDocumentsMessage(message);
    }
  }, [onboardingState?.currentState, documentsResponse, isLoadingDocuments, documentsError]);

  // Auto-open modal if onboarding is incomplete or documents pending
  useEffect(() => {
    if (onboardingState?.currentState && onboardingState.currentState !== 'DASHBOARD') {
      // Check if user dismissed the modal in this session
      const dismissed = sessionStorage.getItem('onboarding_modal_dismissed');
      if (!dismissed || documentsStatus === 'pending') {
        // Always show if documents are pending, even if dismissed before
        setIsOpen(true);
      }
    }
  }, [onboardingState?.currentState, documentsStatus]);

  const handleContinue = () => {
    // Navigate to the current step
    if (currentStepInfo) {
      router.push(currentStepInfo.route);
    }
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('onboarding_modal_dismissed', 'true');
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const modalOpen = isControlled ? open : isOpen;
  const setModalOpen = isControlled ? onOpenChange : setIsOpen;

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Complete Your Account Setup</DialogTitle>
          <DialogDescription>
            You&apos;re {progressPercentage}% done! Continue setting up your retirement plan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="space-y-6">
            {/* Documents Pending Banner */}
            {documentsStatus === 'pending' && documentsMessage && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <IconFileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-blue-900">Documents Being Prepared</h4>
                    <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      <IconClock className="h-3 w-3" />
                      <span>In Progress</span>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700 leading-relaxed">{documentsMessage}</p>
                  <p className="text-xs text-blue-600 mt-2">
                    Estimated time: 2-3 business days. We&apos;ll email you when ready.
                  </p>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Setup Progress</span>
                <span className="text-muted-foreground">
                  {completedSteps.length} of {ONBOARDING_STEPS.length} steps completed
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Steps List */}
            <div className="space-y-4">
              {/* Completed Steps */}
              {completedSteps.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
                    <IconCheck className="h-4 w-4" />
                    Completed ({completedSteps.length})
                  </h3>
                  <div className="space-y-2">
                    {completedSteps.slice(-3).map((step) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/10"
                      >
                        <div className="h-6 w-6 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                          <IconCheck className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm text-muted-foreground line-through">
                          {step.label}
                        </span>
                      </div>
                    ))}
                    {completedSteps.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-9">
                        +{completedSteps.length - 3} more completed
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Current Step */}
              <div>
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <IconCircleDashed className="h-4 w-4" />
                  {documentsStatus === 'pending' ? 'Waiting' : 'In Progress'}
                </h3>
                <div className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2",
                  documentsStatus === 'pending'
                    ? "bg-amber-50 border-amber-300"
                    : "bg-primary/5 border-primary"
                )}>
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                    documentsStatus === 'pending'
                      ? "bg-amber-100"
                      : "bg-primary animate-pulse"
                  )}>
                    {documentsStatus === 'pending' ? (
                      <IconClock className="h-5 w-5 text-amber-600" />
                    ) : (
                      <IconCircleDashed className="h-5 w-5 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{currentStepInfo?.label || 'Get Started'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {documentsStatus === 'pending'
                        ? 'Waiting for documents to be ready'
                        : 'Continue from where you left off'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Upcoming Steps */}
              {upcomingSteps.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <IconCircle className="h-4 w-4" />
                    Upcoming ({upcomingSteps.length})
                  </h3>
                  <div className="space-y-2">
                    {upcomingSteps.slice(0, 3).map((step) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                      >
                        <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center flex-shrink-0">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                        </div>
                        <span className="text-sm text-muted-foreground">{step.label}</span>
                      </div>
                    ))}
                    {upcomingSteps.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-9">
                        +{upcomingSteps.length - 3} more steps
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleDismiss}
            size="default"
            className="min-w-[140px] text-sm"
          >
            {documentsStatus === 'pending' ? 'Close' : 'Remind Me Later'}
          </Button>
          <Button
            onClick={handleContinue}
            size="default"
            className="min-w-[140px] text-sm"
            disabled={documentsStatus === 'pending'}
          >
            {documentsStatus === 'pending' ? (
              <>
                <IconClock className="h-4 w-4 mr-2" />
                Waiting for Documents
              </>
            ) : onboardingState?.currentState === 'SIGN' ? (
              <>
                Review and Sign Document
                <IconArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Continue Setup
                <IconArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
