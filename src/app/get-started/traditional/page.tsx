'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FormSelect } from '@/components/ui/FormSelect';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';
import { planDropdowns, getVestingScheduleDbName } from '@/config/planDropdowns';
import {
  useCreate,
  useGetAllPlanTypes,
  useGetAllMasterVestingSchedules,
} from '@/api/generated/endpoints/plan-sponsor-details/plan-sponsor-details';
import {
  EmployerContributionRuleDTORuleType,
  ProfitSharingConfigDTOFormula,
  PlanEligibilityDTOExclusionsItem,
} from '@/api/generated/models';

const traditionalPlanSchema = z.object({
  // Employer Contribution
  employerContributionType: z.string(),
  enhancedMatchPercentage: z.string().optional(),
  nonElectivePercentage: z.string().optional(),
  employerVestingSchedule: z.string().optional(),

  // Employee Eligibility
  minimumAge: z.string(),
  timeEmployed: z.string(),
  exclusionType: z.string(),
  customExclusions: z.array(z.string()).optional(),

  // Auto-Enrollment
  isAutoEnrollment: z.boolean(),
  defaultContributionRate: z.string(),
  annualIncreaseMode: z.string(),
  annualIncreaseRate: z.string().optional(),
  maxContributionRate: z.string().optional(),

  // Profit Sharing
  profitSharingDefault: z.string().optional(),
  profitSharingFormula: z.string().optional(),
  profitSharingVestingSchedule: z.string().optional(),
});

type TraditionalPlanFormData = z.infer<typeof traditionalPlanSchema>;

export default function TraditionalPlanPage() {
  const router = useRouter();
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TraditionalPlanFormData>({
    resolver: zodResolver(traditionalPlanSchema),
    defaultValues: {
      employerContributionType: 'no-contribution',
      enhancedMatchPercentage: '',
      nonElectivePercentage: '3',
      employerVestingSchedule: 'immediate',
      minimumAge: 'no-minimum',
      timeEmployed: 'immediate',
      exclusionType: 'none',
      customExclusions: [],
      isAutoEnrollment: true,
      defaultContributionRate: '3',
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
    // Check if plan was selected
    const selectedPlanType = sessionStorage.getItem('selectedPlanType');
    if (!selectedPlanType || selectedPlanType !== 'traditional-401k') {
      toast.error('Missing information', 'Please select Traditional 401(k) plan first.');
      router.push(ROUTES.GET_STARTED.PLAN_RECOMMENDATION);
      return;
    }

    // Load saved data if exists
    const savedData = sessionStorage.getItem('traditionalPlanConfig');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        Object.keys(parsed).forEach((key) => {
          setValue(key as keyof TraditionalPlanFormData, parsed[key]);
        });
      } catch (error) {
        console.error('Failed to parse saved plan config', error);
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

  const onSubmit = (data: TraditionalPlanFormData) => {
    // Save form data to session storage
    sessionStorage.setItem('traditionalPlanConfig', JSON.stringify(data));

    // Show compliance modal
    setShowComplianceModal(true);
  };

  const handleConfirmPlan = async () => {
    const data = watch();
    setIsLoading(true);

    try {
      // Check authentication first
      const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
      const hasAccessToken = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');

      if (!isAuthenticated && !hasAccessToken) {
        toast.error('Not authenticated', 'Please log in or complete account creation first.');
        setIsLoading(false);
        setShowComplianceModal(false);
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
        setShowComplianceModal(false);
        return;
      }

      // Find the Traditional 401(k) plan type
      const traditionalPlan = planTypes?.find((plan) =>
        plan.name?.toLowerCase().includes('traditional')
      );

      if (!traditionalPlan?.id) {
        toast.error('Plan type not found', 'Unable to find Traditional 401(k) plan type. Please refresh the page.');
        setIsLoading(false);
        setShowComplianceModal(false);
        return;
      }

      // Map employer contribution type to backend enum
      const mapEmployerContributionType = (type: string): EmployerContributionRuleDTORuleType | undefined => {
        const mapping: Record<string, EmployerContributionRuleDTORuleType> = {
          'no-contribution': 'NO_CONTRIBUTION',
          'basic-match': 'BASIC_MATCH',
          'custom-match': 'ENHANCED_MATCH',
          'non-elective-basic': 'SAFE_HARBOR_NON_ELECTIVE',
          'custom-non-elective': 'SAFE_HARBOR_NON_ELECTIVE',
        };
        return mapping[type];
      };

      // Find vesting schedule IDs from dropdown values
      const findVestingScheduleId = (value: string): string | undefined => {
        const dbName = getVestingScheduleDbName(value);
        const schedule = vestingSchedules?.find((s) => s.name === dbName);
        return schedule?.id;
      };

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

      // Map form data to API request
      const requestBody = {
        planTypeId: traditionalPlan.id,
        planYear: new Date().getFullYear(),
        effectiveDate: new Date().toISOString().split('T')[0],
        email,

        // Eligibility
        eligibility: {
          minimumEntryAge: parseInt(data.minimumAge === 'no-minimum' ? '0' : data.minimumAge),
          timeEmployedMonths: data.timeEmployed === 'immediate' ? 0 : parseInt(data.timeEmployed),
          exclusions: mapExclusions(),
        },

        // Employee Contribution Config
        employeeContributionConfig: {
          hasEmployeeContribution: true,
          defaultContributionRate: parseFloat(data.defaultContributionRate),
          isAutoEnrollment: data.isAutoEnrollment,
          enrollmentStartRate: parseFloat(data.defaultContributionRate),
          enrollmentAnnualIncrease: increase,
          enrollmentMaxRate: max,
          enrollmentMaxContributionRate: max,
          supportsRoth: true,
        },

        // Employer Contribution Rule
        employerContributionRule:
          data.employerContributionType !== 'no-contribution'
            ? {
                ruleType: mapEmployerContributionType(data.employerContributionType) as EmployerContributionRuleDTORuleType,
                basicMatchFirstPercent: data.employerContributionType === 'basic-match' ? 4 : 0,
                basicMatchFirstRate: 100,
                basicMatchSecondPercent: 0,
                basicMatchSecondRate: 0,
                flexibleMatchPercent: data.employerContributionType === 'custom-match'
                  ? parseFloat(data.enhancedMatchPercentage || '0')
                  : 0,
                nonElectivePercent:
                  data.employerContributionType === 'non-elective-basic'
                    ? 3
                    : data.employerContributionType === 'custom-non-elective'
                    ? parseFloat(data.nonElectivePercentage || '1')
                    : 0,
                matchPercentage: 100,
                matchLimitPercent: data.employerContributionType === 'basic-match' ? 4 : 0,
                vestingScheduleId: findVestingScheduleId(data.employerVestingSchedule || 'immediate'),
                tenantVestingScheduleId: findVestingScheduleId(data.employerVestingSchedule || 'immediate'),
              }
            : undefined,

        // Profit Sharing Config
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
      console.log('Creating plan with data:', JSON.stringify(requestBody, null, 2));

      // Call API
      await createPlanMutation.mutateAsync({ data: requestBody });

      toast.success('Plan saved successfully', 'Your Traditional 401(k) plan has been configured.');

      // Navigate to next step
      router.push(ROUTES.GET_STARTED.BUSINESS_DETAILS);
    } catch (error) {
      console.error('Failed to save plan:', error);

      // Extract error message from response
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      const errorMessage = err?.response?.data?.message || err?.response?.data?.error || 'Please try again.';

      toast.error('Failed to save plan', errorMessage);
      setIsLoading(false);
      setShowComplianceModal(false);
    }
  };

  const handleBack = () => {
    router.push(ROUTES.GET_STARTED.PLAN_RECOMMENDATION);
  };

  if (isLoadingPlanTypes || isLoadingVesting) {
    return (
      <OnboardingLayout
        title="Design your Traditional 401(k) plan"
        description="Loading plan configuration options..."
        currentStep={12}
        totalSteps={22}
        maxWidth="4xl"
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </OnboardingLayout>
    );
  }

  return (
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
            Design your Traditional 401(k) plan
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
          {/* Employer contribution */}
          <Card className="w-full rounded-[24px] border-0 bg-white/95 backdrop-blur-md">
            <CardContent className="space-y-7 pt-8">
              <div className="space-y-2">
                <h2 className="text-[18px] font-medium tracking-[0.5px] text-[#111113]">
                  Employer contribution
                </h2>
                <p className="text-[16px] text-muted-foreground">
                  Determine how much to contribute to your employee&apos;s retirement
                </p>
              </div>

              <div className="space-y-4">
                <FormSelect
                  label="What type of employer contribution will you provide?"
                  options={planDropdowns.employerContributionType.traditional}
                  value={employerContributionType}
                  onValueChange={(value) => setValue('employerContributionType', value)}
                  required
                  // helperText="Select how you want to contribute to employee accounts"
                  error={errors.employerContributionType?.message}
                />

                <FormSelect
                  label="When will your employees own the contributions? (i.e, Vesting Schedule)"
                  options={planDropdowns.vestingSchedules}
                  value={watch('employerVestingSchedule') || 'immediate'}
                  onValueChange={(value) => setValue('employerVestingSchedule', value)}
                  required
                  // helperText="Determines when employees gain ownership of employer contributions"
                  error={errors.employerVestingSchedule?.message}
                />

                {employerContributionType === 'custom-match' && (
                  <div className="pt-4 border-t space-y-4">
                    <FormSelect
                      label="Match Percentage (i.e. 100% match up to this percentage of compensation)"
                      options={planDropdowns.traditionalMatchPercentage}
                      value={watch('enhancedMatchPercentage') || ''}
                      onValueChange={(value) => setValue('enhancedMatchPercentage', value)}
                      required
                      error={errors.enhancedMatchPercentage?.message}
                    />
                  </div>
                )}

                {employerContributionType === 'custom-non-elective' && (
                  <div className="pt-4 border-t space-y-4">
                    <FormSelect
                      label="Non-elective contribution (percentage of compensation)"
                      options={planDropdowns.traditionalNonElectivePercentage}
                      value={watch('nonElectivePercentage') || '1'}
                      onValueChange={(value) => setValue('nonElectivePercentage', value)}
                      required
                      error={errors.nonElectivePercentage?.message}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employee eligibility */}
          <Card className="w-full rounded-[24px] border-0 bg-white/95 backdrop-blur-md">
            <CardContent className="space-y-7 pt-8">
              <div className="space-y-2">
                <h2 className="text-[18px] font-medium tracking-[0.5px] text-[#111113]">
                  Employee eligibility
                </h2>
                <p className="text-[16px] text-muted-foreground">
                  Employees who meet the following criteria will be invited to enroll in this plan.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormSelect
                    label="Minimum age"
                    options={planDropdowns.minimumAge}
                    value={watch('minimumAge')}
                    onValueChange={(value) => setValue('minimumAge', value)}
                    required
                    // helperText="IRS allows up to age 21"
                    error={errors.minimumAge?.message}
                  />

                  <FormSelect
                    label="Time employed"
                    options={planDropdowns.timeEmployed}
                    value={watch('timeEmployed')}
                    onValueChange={(value) => setValue('timeEmployed', value)}
                    required
                    // helperText="Time employed before eligibility"
                    error={errors.timeEmployed?.message}
                  />

                  <FormSelect
                    label="Exclusions"
                    options={planDropdowns.exclusions.options}
                    value={exclusionType}
                    onValueChange={(value) => setValue('exclusionType', value)}
                    // helperText="Exclude certain employee groups from plan participation"
                    error={errors.exclusionType?.message}
                  />
                </div>

                {exclusionType === 'custom' && (
                  <div className="space-y-3 pt-4 border-t">
                    <Label>Select Employee Groups to Exclude</Label>
                    <div className="space-y-2">
                      {planDropdowns.exclusions.customOptions.map((exclusion) => (
                        <label
                          key={exclusion.value}
                          className="flex cursor-pointer items-center space-x-2"
                        >
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
                      Excluded employees cannot participate in the plan. Consider compliance
                      implications.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Auto-enrolled employees */}
          <Card className="w-full rounded-[24px] border-0 bg-white/95 backdrop-blur-md">
            <CardContent className="space-y-7 pt-8">
              <div className="space-y-2">
                <h2 className="text-[18px] font-medium tracking-[0.5px] text-[#111113]">
                  Auto-enrolled employees
                </h2>
                <p className="text-[16px] text-muted-foreground">
                  The IRS requires employees to be{' '}
                  <span className="font-medium text-[#111113]">automatically enrolled</span> with a
                  default employee contribution rate unless they choose their own rate or opt out.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormSelect
                  label="Default employee contribution rate"
                  options={planDropdowns.defaultContributionRate}
                  value={watch('defaultContributionRate')}
                  onValueChange={(value) => setValue('defaultContributionRate', value)}
                  required
                  // helperText="Typical range: 3-6%. Employees can change this anytime."
                  error={errors.defaultContributionRate?.message}
                />

                <FormSelect
                  label="Annual increase"
                  options={planDropdowns.annualIncreaseMode}
                  value={annualIncreaseMode}
                  onValueChange={(value) => setValue('annualIncreaseMode', value)}
                  // helperText="Gradually increase employee contributions each year"
                  error={errors.annualIncreaseMode?.message}
                />
              </div>

              {annualIncreaseMode === 'custom' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    label="Maximum Rate"
                    options={planDropdowns.maxContributionRate}
                    value={watch('maxContributionRate') || '10'}
                    onValueChange={(value) => setValue('maxContributionRate', value)}
                    required
                  // helperText="Stop increasing at this rate"
                    error={errors.maxContributionRate?.message}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profit sharing feature */}
          <Card className="w-full rounded-[24px] border-0 bg-white/95 backdrop-blur-md">
            <CardContent className="space-y-7 pt-8">
              <div className="space-y-2">
                <h2 className="text-[18px] font-medium tracking-[0.5px] text-[#111113]">
                  Profit sharing feature
                </h2>
                <p className="text-[16px] text-muted-foreground">
                  Add Profit Sharing to your 401(k) plan and decide how much to contribute each
                  year— discretionary, flexible, and tax-deductible.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormSelect
                  label="Default contribution"
                  options={planDropdowns.profitSharingDefault}
                  value={watch('profitSharingDefault') || 'none'}
                  onValueChange={(value) => setValue('profitSharingDefault', value)}
                  // helperText="Typical amount to contribute as profit sharing"
                  error={errors.profitSharingDefault?.message}
                />

                <FormSelect
                  label="Profit sharing formula"
                  options={planDropdowns.profitSharingFormula}
                  value={watch('profitSharingFormula') || 'pro-rata'}
                  onValueChange={(value) => setValue('profitSharingFormula', value)}
                  required
                  // helperText="How to distribute profit sharing among eligible employees"
                  error={errors.profitSharingFormula?.message}
                />
                
                <FormSelect
                  label="Vesting schedule"
                  options={planDropdowns.vestingSchedules}
                  value={watch('profitSharingVestingSchedule') || 'immediate'}
                  onValueChange={(value) => setValue('profitSharingVestingSchedule', value)}
                  required
                  // helperText="Profit sharing can have a separate vesting schedule"
                  error={errors.profitSharingVestingSchedule?.message}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="mt-2 flex w-full items-center justify-center gap-6">
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
              Save &amp; Continue
            </Button>
          </div>
        </form>

        {/* Compliance Confirmation Modal */}
        <Dialog open={showComplianceModal} onOpenChange={setShowComplianceModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Understanding Nondiscrimination Testing</DialogTitle>
              <DialogDescription>
                Your Traditional 401(k) plan requires annual compliance testing
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                The IRS requires Traditional 401(k) plans to pass nondiscrimination tests each year
                to ensure benefits don&apos;t favor highly compensated employees. If your plan fails
                testing, corrections may include:
              </p>

              <ul className="list-inside list-disc space-y-1 pl-2 text-sm text-muted-foreground">
                <li>Refunding excess contributions to highly compensated employees</li>
                <li>Making additional employer contributions to non-highly compensated employees</li>
              </ul>

              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  <strong>We&apos;re here to help:</strong> GlidingPath will automatically perform
                  all required compliance testing and guide you through any necessary corrections.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowComplianceModal(false)}
                disabled={isLoading}
              >
                Go Back
              </Button>
              <Button onClick={handleConfirmPlan} disabled={isLoading} loading={isLoading}>
                I Understand
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
