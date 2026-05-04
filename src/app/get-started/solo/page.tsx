'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  IconInfoCircle,
  IconAlertCircle,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
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
import { planDropdowns, getVestingScheduleDbName } from '@/config/planDropdowns';
import {
  useCreate,
  useGetAllPlanTypes,
  useGetAllMasterVestingSchedules,
} from '@/api/generated/endpoints/plan-sponsor-details/plan-sponsor-details';
import type {
  PlanEligibilityDTOExclusionsItem,
  EmployerContributionRuleDTORuleType,
  ProfitSharingConfigDTOFormula,
} from '@/api/generated/models';

const soloPlanSchema = z.object({
  // Employer Contribution
  employerContributionType: z.string(),
  employerVesting: z.string().optional(),

  // Employee Eligibility
  minimumAge: z.string(),
  timeEmployed: z.string(),
  exclusionType: z.string(),
  customExclusions: z.array(z.string()).optional(),

  // Auto-Enrollment
  defaultContributionRate: z.string(),
  annualIncreaseMode: z.string(),
  annualIncreaseRate: z.string().optional(),
  maxContributionRate: z.string().optional(),

  // Profit Sharing
  profitSharingDefault: z.string(),
  profitSharingFormula: z.string(),
  profitSharingVestingSchedule: z.string(),
});

type SoloPlanFormData = z.infer<typeof soloPlanSchema>;

export default function SoloPlanPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const createPlanMutation = useCreate();
  const { data: planTypes, isLoading: isLoadingPlanTypes } = useGetAllPlanTypes();
  const {
    data: vestingSchedules,
    isLoading: isLoadingVesting,
    error: vestingError,
  } = useGetAllMasterVestingSchedules({
    query: {
      retry: 3,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SoloPlanFormData>({
    resolver: zodResolver(soloPlanSchema),
    defaultValues: {
      employerContributionType: 'enhanced-match',
      employerVesting: '2-year-cliff',
      minimumAge: 'no-minimum',
      timeEmployed: 'immediate',
      exclusionType: 'none',
      customExclusions: [],
      defaultContributionRate: '5',
      annualIncreaseMode: 'minimum',
      annualIncreaseRate: '2',
      maxContributionRate: '10',
      profitSharingDefault: 'none',
      profitSharingFormula: 'pro-rata',
      profitSharingVestingSchedule: 'immediate',
    },
  });

  const employerContributionType = watch('employerContributionType');
  const exclusionType = watch('exclusionType');
  const annualIncreaseMode = watch('annualIncreaseMode');

  useEffect(() => {
    // Check if previous step was completed
    const selectedPlanType = sessionStorage.getItem('selectedPlanType');
    if (!selectedPlanType || selectedPlanType !== 'solo-401k') {
      toast.error('Missing information', 'Please select Solo 401(k) plan first.');
      router.push(ROUTES.GET_STARTED.PLAN_RECOMMENDATION);
      return;
    }

    // Load saved data if exists
    const savedData = sessionStorage.getItem('soloPlanData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        Object.keys(parsed).forEach((key) => {
          setValue(key as keyof SoloPlanFormData, parsed[key]);
        });
      } catch (error) {
        console.error('Failed to parse saved solo plan data', error);
      }
    }
  }, [router, setValue]);

  // Handle vesting schedules error
  useEffect(() => {
    if (vestingError) {
      console.error('Failed to load vesting schedules:', vestingError);
      toast.error('Failed to load vesting schedules', 'Please refresh the page or contact support.');
    }
  }, [vestingError]);

  const onSubmit = (data: SoloPlanFormData) => {
    // Save to session storage
    sessionStorage.setItem('soloPlanData', JSON.stringify(data));

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
        sessionStorage.getItem('soloPlanData') || '{}'
      ) as SoloPlanFormData;

      // Find Solo 401(k) plan type from backend
      const soloPlan = planTypes?.find((plan) => plan.name?.toLowerCase().includes('solo'));

      if (!soloPlan?.id) {
        toast.error('Plan type not found', 'Unable to find Solo 401(k) plan type. Please refresh the page.');
        setIsLoading(false);
        return;
      }

      // Map exclusions from dropdown values to API enums
      const mapExclusions = (): PlanEligibilityDTOExclusionsItem[] => {
        if (data.exclusionType !== 'custom' || !data.customExclusions) {
          return [];
        }
        const mapping: Record<string, PlanEligibilityDTOExclusionsItem> = {
          'part-time': 'PART_TIME',
          'union': 'UNION',
          'non-resident-alien': 'NON_RESIDENT_ALIEN',
          'intern-trainee': 'INTERN_OR_TRAINEE',
          'temporary-seasonal': 'TEMPORARY_OR_SEASONAL',
        };
        return data.customExclusions.map((ex) => mapping[ex]).filter(Boolean) as PlanEligibilityDTOExclusionsItem[];
      };

      // Calculate annual increase values
      const calculateAnnualIncrease = () => {
        if (data.annualIncreaseMode === 'none') {
          return { increase: 0, max: 100 };
        } else if (data.annualIncreaseMode === 'minimum') {
          return { increase: 1, max: 10 };
        } else {
          return {
            increase: parseFloat(data.annualIncreaseRate || '2'),
            max: parseFloat(data.maxContributionRate || '10'),
          };
        }
      };

      const { increase, max } = calculateAnnualIncrease();

      // Find vesting schedule IDs from dropdown values
      const findVestingScheduleId = (value: string): string | undefined => {
        const dbName = getVestingScheduleDbName(value);
        const schedule = vestingSchedules?.find((s) => s.name === dbName);
        return schedule?.id;
      };

      // Employer contribution rule type (Solo 401k typically no employer contribution)
      const ruleType: EmployerContributionRuleDTORuleType = 'NO_CONTRIBUTION';

      const requestBody = {
        planTypeId: soloPlan.id,
        planYear: new Date().getFullYear(),
        effectiveDate: new Date().toISOString().split('T')[0],
        email,
        eligibility: {
          minimumEntryAge: data.minimumAge === 'no-minimum' ? 0 : parseInt(data.minimumAge),
          timeEmployedMonths: data.timeEmployed === 'immediate' ? 0 : parseInt(data.timeEmployed),
          exclusions: mapExclusions(),
        },
        employeeContributionConfig: {
          hasEmployeeContribution: true,
          defaultContributionRate: parseFloat(data.defaultContributionRate),
          isAutoEnrollment: true,
          enrollmentStartRate: parseFloat(data.defaultContributionRate),
          enrollmentAnnualIncrease: increase,
          enrollmentMaxRate: max,
          enrollmentMaxContributionRate: max,
          supportsRoth: true,
        },
        employerContributionRule: {
          ruleType,
          contributionRate: 0,
          maxContribution: 0,
          vestingScheduleId: findVestingScheduleId(data.employerVesting || '2-year-cliff'),
          isDiscretionary: false,
        },
        profitSharingConfig: data.profitSharingDefault && data.profitSharingDefault !== 'none'
          ? {
              isEnabled: true,
              formula: (data.profitSharingFormula === 'pro-rata' ? 'PRO_RATA'
                : data.profitSharingFormula === 'flat-dollar' ? 'FLAT_DOLLAR'
                : data.profitSharingFormula === 'new-comparability' ? 'NEW_COMPARABILITY'
                : data.profitSharingFormula === 'age-weighted' ? 'AGE_WEIGHTED'
                : 'PRO_RATA') as ProfitSharingConfigDTOFormula,
              defaultContribution: data.profitSharingDefault,
              proRataPercentage:
                data.profitSharingFormula === 'pro-rata' && data.profitSharingDefault !== 'none'
                  ? parseFloat(data.profitSharingDefault || '0')
                  : 0,
              flatDollarAmount: 0,
              comparabilityFormula: '',
              vestingScheduleId: findVestingScheduleId(data.profitSharingVestingSchedule || 'immediate'),
              tenantVestingScheduleId: findVestingScheduleId(data.profitSharingVestingSchedule || 'immediate'),
            }
          : undefined,
      };

      // Log request for debugging
      console.log('Creating Solo plan with data:', JSON.stringify(requestBody, null, 2));

      await createPlanMutation.mutateAsync({ data: requestBody });

      toast.success('Success', 'Solo 401(k) plan configured successfully!');
      router.push(ROUTES.GET_STARTED.BUSINESS_DETAILS);
    } catch (error: unknown) {
      console.error('Failed to save Solo plan:', error);

      // Extract error message from response
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      const errorMessage = err?.response?.data?.message || err?.response?.data?.error || 'Please try again.';

      toast.error('Failed to save plan', errorMessage);
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push(ROUTES.GET_STARTED.PLAN_RECOMMENDATION);
  };

  if (isLoadingPlanTypes || isLoadingVesting) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4 py-10"
        style={{
          backgroundImage: 'linear-gradient(111.25deg, #EFF6FF 1.1%, #FAF5FF 100%)',
        }}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading plan options...</p>
        </div>
      </div>
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
              Design your Solo 401(k) plan
            </h1>
            <p className="max-w-[720px] text-base text-muted-foreground">
              Configure your plan settings to meet your company's needs and compliance requirements.
            </p>
          </div>

          {/* Content Cards */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex w-full flex-col items-stretch gap-6"
          >
          {/* Employer Contribution */}
          <Card className="w-full rounded-[24px] border-0 bg-white/95 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Employer Contribution</CardTitle>
              <CardDescription>
                Determine how much to contribute to your employee's retirement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormSelect
                label="What type of employer contribution will you provide?"
                options={planDropdowns.employerContributionType.traditional}
                value={employerContributionType}
                onValueChange={(value) => setValue('employerContributionType', value)}
                required
                error={errors.employerContributionType?.message}
              />

              {employerContributionType === 'enhanced-match' && (
                <FormSelect
                  label="When will your employees own the contributions? (i.e, Vesting Schedule)"
                  options={planDropdowns.vestingSchedules}
                  value={watch('employerVesting') || '2-year-cliff'}
                  onValueChange={(value) => setValue('employerVesting', value)}
                  // helperText="Vesting schedule for employer contributions"
                  error={errors.employerVesting?.message}
                />
              )}
            </CardContent>
          </Card>

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

                <FormSelect
                  label="Employee Exclusions"
                  options={planDropdowns.exclusions.options}
                  value={exclusionType}
                  onValueChange={(value) => setValue('exclusionType', value)}
                  // helperText="Exclude certain employee groups from plan participation"
                  error={errors.exclusionType?.message}
                />
              </div>

              {/* Custom Exclusions List */}
              {exclusionType === 'custom' && (
                <div className="space-y-3 pt-4 border-t">
                  <Label>Select Employee Groups to Exclude</Label>
                  <div className="space-y-2">
                    {planDropdowns.exclusions.customOptions.map((exclusion) => (
                      <label key={exclusion.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={exclusion.value}
                          {...register('customExclusions')}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span className="text-sm">{exclusion.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Excluded employees cannot participate in the plan. Consider compliance implications.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auto-Enrollment */}
          <Card className="w-full rounded-[24px] border-0 bg-white/95 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Auto-Enrollment</CardTitle>
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
                  label="Annual Automatic Increase"
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
                    value={watch('maxContributionRate') || '10'}
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
                  Employees must be notified 30-90 days before automatic enrollment begins and can opt out at any time.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profit Sharing */}
          <Card className="w-full rounded-[24px] border-0 bg-white/95 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Profit Sharing</CardTitle>
              <CardDescription>
                Add Profit Sharing to your 401(k) plan and decide how much to contribute each year— discretionary, flexible, and tax-deductible.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect
                  label="Default Contribution"
                  options={planDropdowns.profitSharingDefault}
                  value={watch('profitSharingDefault')}
                  onValueChange={(value) => setValue('profitSharingDefault', value)}
                  // helperText="Typical amount to contribute as profit sharing"
                  error={errors.profitSharingDefault?.message}
                />

                <FormSelect
                  label="Allocation Formula"
                  options={planDropdowns.profitSharingFormula}
                  value={watch('profitSharingFormula')}
                  onValueChange={(value) => setValue('profitSharingFormula', value)}
                  required
                  // helperText="How to distribute profit sharing among eligible employees"
                  error={errors.profitSharingFormula?.message}
                />

                <FormSelect
                  label="Vesting Schedule"
                  options={planDropdowns.vestingSchedules}
                  value={watch('profitSharingVestingSchedule')}
                  onValueChange={(value) => setValue('profitSharingVestingSchedule', value)}
                  required
                  // helperText="Profit sharing can have a separate vesting schedule"
                  error={errors.profitSharingVestingSchedule?.message}
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <IconInfoCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  <strong>Profit sharing is discretionary:</strong> You decide each year whether to make contributions and how much.
                </p>
              </div>
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

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconAlertCircle className="h-5 w-5 text-primary" />
              Confirm Solo 401(k) Setup
            </DialogTitle>
            <DialogDescription>
              Please review before proceeding
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              By proceeding, you confirm that this plan structure meets your business needs as a self-employed individual.
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
