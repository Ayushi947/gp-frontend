'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  IconRocket,
  IconInfoCircle,
  IconAlertCircle,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormSelect } from '@/components/ui/FormSelect';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';
import { planDropdowns } from '@/config/planDropdowns';
import {
  useCreate,
  useGetAllPlanTypes,
} from '@/api/generated/endpoints/plan-sponsor-details/plan-sponsor-details';
import type { PlanEligibilityDTOExclusionsItem } from '@/api/generated/models';

const starterPlanSchema = z.object({
  // Employee Eligibility
  minimumAge: z.string(),
  timeEmployed: z.string(),
  exclusionType: z.string(),
  customExclusions: z.array(z.string()).optional(),

  // Auto-Enrollment (REQUIRED for Starter 401k)
  defaultContributionRate: z.string(),
  annualIncreaseMode: z.string(),
  annualIncreaseRate: z.string().optional(),
  maxContributionRate: z.string().optional(),
});

type StarterPlanFormData = z.infer<typeof starterPlanSchema>;

export default function StarterPlanPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const createPlanMutation = useCreate();
  const { data: planTypes, isLoading: isLoadingPlanTypes } = useGetAllPlanTypes();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<StarterPlanFormData>({
    resolver: zodResolver(starterPlanSchema),
    defaultValues: {
        minimumAge: 'no-minimum',
      timeEmployed: 'immediate',
      exclusionType: 'none',
        customExclusions: [],
      defaultContributionRate: '3',
      annualIncreaseMode: 'minimum',
      annualIncreaseRate: '2',
      maxContributionRate: '15',
    },
  });

  const annualIncreaseMode = watch('annualIncreaseMode');
  const exclusionType = watch('exclusionType');

  useEffect(() => {
    // Check if previous step was completed
    const selectedPlanType = sessionStorage.getItem('selectedPlanType');
    if (!selectedPlanType || selectedPlanType !== 'starter-401k') {
      toast.error('Missing information', 'Please select Starter 401(k) plan first.');
      router.push(ROUTES.GET_STARTED.PLAN_RECOMMENDATION);
      return;
    }

    // Load saved data if exists
    const savedData = sessionStorage.getItem('starterPlanData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        Object.keys(parsed).forEach((key) => {
          setValue(key as keyof StarterPlanFormData, parsed[key]);
        });
      } catch (error) {
        console.error('Failed to parse saved starter plan data', error);
      }
    }
  }, [router, setValue]);

  const onSubmit = (data: StarterPlanFormData) => {
    // Save to session storage
    sessionStorage.setItem('starterPlanData', JSON.stringify(data));

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmPlan = async () => {
    setIsLoading(true);
    setShowConfirmModal(false);

    try {
      // Check authentication first
      const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
      const hasAccessToken = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');

      if (!isAuthenticated && !hasAccessToken) {
        toast.error('Not authenticated', 'Please log in or complete account creation first.');
        setIsLoading(false);
        router.push(ROUTES.GET_STARTED.CREATE_ACCOUNT);
        return;
      }

      // Get email from multiple possible locations
      let email = sessionStorage.getItem('email') || sessionStorage.getItem('sponsorEmail');

      // If still not found, try to get from userInfo
      if (!email) {
        const userInfoStr = sessionStorage.getItem('userInfo') || localStorage.getItem('userInfo');
        if (userInfoStr) {
          try {
            const userInfo = JSON.parse(userInfoStr);
            email = userInfo.email;
          } catch (e) {
            console.error('Failed to parse userInfo:', e);
          }
        }
      }

      if (!email) {
        toast.error('Email not found', 'Unable to retrieve your email. Please contact support.');
        setIsLoading(false);
        return;
      }

      const data = JSON.parse(
        sessionStorage.getItem('starterPlanData') || '{}'
      ) as StarterPlanFormData;

      // Find Starter 401(k) plan type from backend
      const starterPlan = planTypes?.find((plan) => plan.name?.toLowerCase().includes('starter'));

      if (!starterPlan?.id) {
        toast.error('Plan type not found', 'Unable to find Starter 401(k) plan type. Please refresh the page.');
        setIsLoading(false);
        return;
      }

      // Parse dropdown values to API format
      const minimumEntryAge = data.minimumAge === 'no-minimum' ? 0 : parseInt(data.minimumAge);
      const timeEmployedMonths = data.timeEmployed === 'immediate' ? 0 : parseInt(data.timeEmployed);
      const defaultContributionRate = parseFloat(data.defaultContributionRate);

      // Map exclusions from dropdown values to API enums
      const mapExclusions = (): PlanEligibilityDTOExclusionsItem[] => {
        if (data.exclusionType !== 'custom' || !data.customExclusions) {
          return [];
        }

        const mapping: Record<string, PlanEligibilityDTOExclusionsItem> = {
          'part-time': 'PART_TIME',
          union: 'UNION',
          'non-resident-alien': 'NON_RESIDENT_ALIEN',
          'intern-trainee': 'INTERN_OR_TRAINEE',
          'temporary-seasonal': 'TEMPORARY_OR_SEASONAL',
        };

        return data.customExclusions
          .map((exclusion) => mapping[exclusion])
          .filter((exclusion): exclusion is PlanEligibilityDTOExclusionsItem => Boolean(exclusion));
      };

      // Calculate annual increase values based on mode
      const enrollmentAnnualIncrease =
        data.annualIncreaseMode === 'minimum'
          ? 1
          : parseFloat(data.annualIncreaseRate || '2');

      const enrollmentMaxRate =
        data.annualIncreaseMode === 'minimum'
          ? 10
          : parseFloat(data.maxContributionRate || '15');

      // Match old frontend request body exactly
      const requestBody = {
        email, // Required for tenant resolution during registration
        planTypeId: starterPlan.id,
        planYear: new Date().getFullYear(),
        effectiveDate: new Date().toISOString().split('T')[0],
        eligibility: {
          minimumEntryAge,
          timeEmployedMonths,
          exclusions: mapExclusions(),
        },
        employeeContributionConfig: {
          hasEmployeeContribution: true,
          defaultContributionRate,
          isAutoEnrollment: true,
          enrollmentAnnualIncrease,
          enrollmentMaxRate,
        },
        profitSharingConfig: {
          isEnabled: true,
        },
      };

      // Log request for debugging
      console.log('Creating Starter plan with data:', JSON.stringify(requestBody, null, 2));

      await createPlanMutation.mutateAsync({ data: requestBody });

      toast.success('Success', 'Starter 401(k) plan configured successfully!');
      router.push(ROUTES.GET_STARTED.BUSINESS_DETAILS);
    } catch (error: unknown) {
      console.error('Failed to save Starter plan:', error);

      // Extract error message from response
      const err = error as { response?: { data?: { message?: string; error?: string }; status?: number } };

      // Log full error details for debugging
      console.error('Error response status:', err?.response?.status);
      console.error('Error response data:', JSON.stringify(err?.response?.data, null, 2));

      const errorMessage = err?.response?.data?.message || err?.response?.data?.error || 'Please try again.';

      toast.error('Failed to save plan', errorMessage);
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push(ROUTES.GET_STARTED.PLAN_RECOMMENDATION);
  };

  if (isLoadingPlanTypes) {
    return (
      <OnboardingLayout
        title="Design your Starter 401(k) Plan"
        description="Configure your plan to meet your company's needs and compliance requirements."
        currentStep={12}
        totalSteps={22}
        maxWidth="4xl"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading plan options...</p>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <>
      <div
        className="min-h-screen flex items-center justify-center px-4 py-10"
        style={{
          backgroundImage: 'linear-gradient(111.25deg, #EFF6FF 1.1%, #FAF5FF 100%)',
        }}
      >
        <div className="w-full max-w-[853px] flex flex-col items-center gap-10">
          {/* Logo (same as other onboarding pages) */}
          <div className="mb-2 flex items-center justify-center gap-3">
            <Image
            src="/assets/images/Final Logo.svg"
              alt="GlidingPath Logo"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="text-2xl font-bold">GlidingPath</span>
          </div>

          {/* Page Title + Description */}
          <div className="flex w-full flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold text-[#2563EB]">
            Design your Starter 401(k) Plan
          </h1>
            <p className="max-w-[720px] text-base text-muted-foreground">
              Configure your plan to meet your company's needs and compliance requirements.
            </p>
          </div>

          {/* Content Cards */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex w-full flex-col items-stretch gap-6"
          >
            {/* Employee Eligibility */}
            <Card className="w-full rounded-[24px] border-0 bg-white/95 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Employee Eligibility</CardTitle>
              <CardDescription>
                Employees who meet the following criteria will be invited to enroll in this plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect
                  label="Minimum Age"
                  options={planDropdowns.minimumAge}
                  value={watch('minimumAge')}
                  onValueChange={(value) => setValue('minimumAge', value)}
                  required
                  // helperText="Minimum age for plan eligibility"
                  error={errors.minimumAge?.message}
                />

                <FormSelect
                  label="Time Employed"
                  options={planDropdowns.timeEmployed}
                  value={watch('timeEmployed')}
                  onValueChange={(value) => setValue('timeEmployed', value)}
                  required
                  // helperText="Service requirement before eligibility"
                  error={errors.timeEmployed?.message}
                />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Employee Exclusions</Label>

                  <div
                      className={cn(
                          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm'
                      )}
                  >
                    <span className="text-muted-foreground">None</span>
                  </div>

                  {/* Optional helper text */}
                  <p className="text-xs text-muted-foreground">
                    Starter plans must include all employees (no exclusions allowed)
                  </p>
                </div>
              </div>
            </CardContent>
            </Card>

            {/* Auto-Enrollment */}
            <Card className="w-full rounded-[24px] border-0 bg-white/95 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Employee contribution</CardTitle>
              <CardDescription>
                The IRS requires employees to be automatically enrolled with a default employee contribution rate unless they choose their own rate or opt out.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect
                  label="Default Contribution Rate"
                  options={planDropdowns.defaultContributionRate}
                  value={watch('defaultContributionRate')}
                  onValueChange={(value) => setValue('defaultContributionRate', value)}
                  required
                  // helperText="Automatically enroll employees at this rate"
                  error={errors.defaultContributionRate?.message}
                />

                <FormSelect
                  label="Annual Increase"
                  options={planDropdowns.annualIncreaseMode}
                  value={annualIncreaseMode}
                  onValueChange={(value) => setValue('annualIncreaseMode', value)}
                  // helperText="Gradually increase contributions each year"
                  error={errors.annualIncreaseMode?.message}
                />
              </div>

              {annualIncreaseMode === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
                  <FormSelect
                    label="Annual Increase Rate"
                    options={planDropdowns.annualIncreaseRate}
                    value={watch('annualIncreaseRate') || '2'}
                    onValueChange={(value) => setValue('annualIncreaseRate', value)}
                    required
                    // helperText="How much to increase each year"
                    error={errors.annualIncreaseRate?.message}
                  />

                  <FormSelect
                    label="Maximum Contribution Rate"
                    options={planDropdowns.maxContributionRate}
                    value={watch('maxContributionRate') || '15'}
                    onValueChange={(value) => setValue('maxContributionRate', value)}
                    required
                    // helperText="Stop increasing at this rate"
                    error={errors.maxContributionRate?.message}
                  />
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <IconInfoCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Employees must be notified 30-90 days before automatic enrollment begins and can opt out at any time. The annual increase helps employees gradually save more.
                </p>
              </div>
            </CardContent>
            </Card>

            {/* Restrictions Notice */}
            <Card className="w-full rounded-[24px] border border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IconAlertCircle className="h-5 w-5 text-amber-600" />
                Plan Restrictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>
                    <strong>No employer contributions allowed</strong> - This plan only supports
                    employee deferrals
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>
                    <strong>Cannot add profit sharing</strong> - Starter 401(k) is deferrals only
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>
                    <strong>Cannot exclude employee classes</strong> - Must cover substantially all
                    employees
                  </span>
                </li>
              </ul>
            </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center gap-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                size="default"
                className="min-w-[140px] text-sm"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                size="default"
                className="min-w-[140px] text-sm"
              >
                Continue
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Info Modal */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconRocket className="h-5 w-5 text-primary" />
              About Starter 401(k) Plans
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-semibold">Perfect For:</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-600">✓</span>
                  <span>
                    <strong>Small businesses:</strong> 0-100 employees with limited budget
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-600">✓</span>
                  <span>
                    <strong>First-time sponsors:</strong> New to retirement plans
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-600">✓</span>
                  <span>
                    <strong>Simple operations:</strong> Want minimal administration
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Key Benefits:</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">•</span>
                  <span>
                    <strong>No employer contribution required:</strong> Reduces your costs
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">•</span>
                  <span>
                    <strong>Automatic pass:</strong> No annual nondiscrimination testing
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">•</span>
                  <span>
                    <strong>Lower admin burden:</strong> Simplified compliance requirements
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">•</span>
                  <span>
                    <strong>Tax advantages:</strong> Employee deferrals are pre-tax
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Important Limitations:</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber-600">!</span>
                  <span>
                    <strong>No employer contributions:</strong> Cannot add matching or profit
                    sharing
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber-600">!</span>
                  <span>
                    <strong>15% maximum deferral:</strong> Lower than traditional 401(k)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber-600">!</span>
                  <span>
                    <strong>Must cover all employees:</strong> Cannot exclude groups
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconAlertCircle className="h-5 w-5 text-primary" />
              Confirm Starter 401(k) Setup
            </DialogTitle>
            <DialogDescription>Please review before proceeding</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              By proceeding, you confirm that this plan structure meets your business needs.
            </p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Review Plan
              </Button>
              <Button
                type="button"
                onClick={handleConfirmPlan}
                disabled={isLoading}
                loading={isLoading}
                loadingText="Saving..."
                className="flex-1"
              >
                Confirm & Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
