'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IconLoader2, IconCalendar, IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { useSponsorOnboarding } from '@/hooks';
import { useSavePlanStartDate } from '@/api/generated/endpoints/plan-sponsor-details/plan-sponsor-details';
import { FormSelect } from '@/components/ui/FormSelect';

// Configuration constants (TODO: Fetch from backend config)
const CONFIG = {
  onBoardingTasksDueIn: 70, // Days before plan start for onboarding tasks
  employeeInvitesSentIn: 30, // Days before plan start to send employee invites
  paycheckWithFirstContributionIn: 30, // Days after plan start for first contribution
};

// Generate dynamic start dates based on current date with 1-month intervals
function generateStartDates(): string[] {
  const dates: string[] = [];
  const currentDate = new Date();

  // Calculate minimum days ahead based on config
  const minDaysAhead = CONFIG.onBoardingTasksDueIn + CONFIG.employeeInvitesSentIn;

  // Calculate minimum start date
  const minStartDate = new Date(currentDate);
  minStartDate.setDate(currentDate.getDate() + minDaysAhead);

  // Generate 12 months of dates starting from the minimum start date
  for (let i = 0; i < 12; i++) {
    const date = new Date(minStartDate);
    date.setMonth(minStartDate.getMonth() + i);
    dates.push(
      date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    );
  }

  return dates;
}

function calculateImportantDates(startDate: string) {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const start = new Date(startDate);

  // Calculate onboarding tasks due date (before plan start)
  const onboardingDate = new Date(start);
  onboardingDate.setDate(onboardingDate.getDate() - CONFIG.onBoardingTasksDueIn);

  // Calculate employee invites date (before plan start)
  const invitesDate = new Date(start);
  invitesDate.setDate(invitesDate.getDate() - CONFIG.employeeInvitesSentIn);

  // First contribution MUST occur AFTER plan start date for 401(k) compliance
  const paycheckDate = new Date(start);
  paycheckDate.setDate(paycheckDate.getDate() + CONFIG.paycheckWithFirstContributionIn);

  return {
    onboarding: formatDate(onboardingDate),
    invites: formatDate(invitesDate),
    paycheck: formatDate(paycheckDate),
  };
}

function ConfirmPlanStartDateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasNavigatedRef = useRef(false);
  const { completeStep } = useSponsorOnboarding();

  // Get session_id from URL (from Stripe redirect)
  const sessionId = searchParams.get('session_id');

  // Use the mutation hook for saving plan start date
  const savePlanStartDateMutation = useSavePlanStartDate();

  // Generate start dates
  const startDates = useMemo(() => generateStartDates(), []);

  const [selected, setSelected] = useState('');

  // Check if coming from checkout (session_id in URL)
  useEffect(() => {
    if (sessionId) {
      // Coming from Stripe checkout - save session ID
      sessionStorage.setItem('stripeSessionId', sessionId);
      // Replace browser history so back button doesn't return to Stripe/checkout
      window.history.replaceState(null, '', ROUTES.GET_STARTED.CONFIRM_PLAN_START_DATE);
    } else {
      // Direct navigation - check if previous steps were completed
      const hasCompletedPricing = sessionStorage.getItem('stripeSessionId');
      if (!hasCompletedPricing) {
        toast.warning('Payment required', 'Please complete the checkout process first.');
        router.push(ROUTES.GET_STARTED.CHECKOUT);
      }
    }
  }, [sessionId, router]);

  // Auto-select first date when available
  useEffect(() => {
    if (startDates.length > 0 && !selected) {
      const firstDate = startDates[0];
      if (!firstDate) return; // Type guard

      // Check if there's a saved date
      const savedDate = sessionStorage.getItem('planStartDate');
      if (savedDate) {
        // Verify saved date is still valid
        if (startDates.includes(savedDate)) {
          setSelected(savedDate);
        } else {
          setSelected(firstDate);
        }
      } else {
        setSelected(firstDate);
      }
    }
  }, [startDates, selected]);

  const importantDates = useMemo(() => {
    if (!selected) return null;
    return calculateImportantDates(selected);
  }, [selected]);

  const handleSaveAndContinue = async () => {
    // Prevent multiple submissions
    if (savePlanStartDateMutation.isPending || hasNavigatedRef.current) {
      return;
    }

    if (!selected || !importantDates) {
      toast.error('Selection required', 'Please select a start date before continuing');
      return;
    }

    // Convert dates to ISO format (YYYY-MM-DD)
    const formatDateForAPI = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    // tenantPlanId is optional - backend will use authenticated user's tenantId
    // Only include it if available
    const tenantPlanId = localStorage.getItem('tenantPlanId') || sessionStorage.getItem('tenantPlanId');

    try {
      await savePlanStartDateMutation.mutateAsync({
        data: {
          startDate: formatDateForAPI(selected),
          onboardingTasksDue: formatDateForAPI(importantDates.onboarding),
          employeeInvitesSent: formatDateForAPI(importantDates.invites),
          paycheckWithFirstContribution: formatDateForAPI(importantDates.paycheck),
          // Only include tenantPlanId if it exists
          ...(tenantPlanId && { tenantPlanId: tenantPlanId }),
        },
      });

      // Save to sessionStorage for next step
      sessionStorage.setItem('planStartDate', selected);

      toast.success('Success', 'Plan start date saved successfully');

      // Prevent multiple navigations
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        
        // Use completeStep to properly track progress and navigate to next step
        completeStep('confirm-plan-start-date', {
          planStartDate: selected,
        });
        // completeStep automatically navigates to confirm-trustee (next step)
      }
    } catch (error) {
      console.error('Error saving plan start date:', error);
      toast.error('Save failed', 'Failed to save plan start date. Please try again.');
      hasNavigatedRef.current = false;
    }
  };

  const handleBack = () => {
    // After payment, navigate to review-pricing (read-only) instead of checkout
    // to prevent users from re-entering the payment flow
    router.push(ROUTES.GET_STARTED.REVIEW_PRICING);
  };

  return (
    <OnboardingLayout
      title="Confirm Plan Start Date"
      description="Select when you'd like your plan to begin"
      currentStep={13}
      totalSteps={19}
      milestoneStep={9}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Date Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCalendar className="h-5 w-5" />
              Plan Start Date
            </CardTitle>
            <CardDescription>
              Choose when you want your 401(k) plan to become effective
            </CardDescription>
          </CardHeader>
          <CardContent>
              <FormSelect
                label=""
                options={startDates.map((date) => ({
                  value: date,
                  label: date,
                }))}
                value={selected}
                onValueChange={setSelected}
                placeholder="Select a start date"
              />
          </CardContent>
        </Card>

        {/* Important Dates Timeline */}
        {importantDates && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCheck className="h-5 w-5 text-green-600" />
                Important Dates
              </CardTitle>
              <CardDescription>Key milestones leading up to your plan start date</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Onboarding Tasks Due */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Onboarding Tasks Due</p>
                    <p className="text-sm text-gray-500">Complete setup tasks</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">{importantDates.onboarding}</span>
              </div>

              {/* Employee Invites Sent */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-semibold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Employee Invites Sent</p>
                    <p className="text-sm text-gray-500">Notify your employees</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">{importantDates.invites}</span>
              </div>

              {/* First Contribution Paycheck */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-semibold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">First Contribution Paycheck</p>
                    <p className="text-sm text-gray-500">First contributions processed</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">{importantDates.paycheck}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={savePlanStartDateMutation.isPending}
            size="default"
            className="min-w-[140px] text-sm"
          >
            Back
          </Button>
          <Button
            onClick={handleSaveAndContinue}
            disabled={savePlanStartDateMutation.isPending || !selected}
            size="default"
            className="min-w-[140px] text-sm"
          >
            {savePlanStartDateMutation.isPending ? 'Saving...' : 'Save and Continue'}
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
}

export default function ConfirmPlanStartDatePage() {
  return (
    <Suspense
      fallback={
        <OnboardingLayout
          title="Confirm Plan Start Date"
          description="Select when you'd like your plan to begin"
          currentStep={16}
          totalSteps={22}
          milestoneStep={12}
          maxWidth="4xl"
        >
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <IconLoader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </OnboardingLayout>
      }
    >
      <ConfirmPlanStartDateContent />
    </Suspense>
  );
}
