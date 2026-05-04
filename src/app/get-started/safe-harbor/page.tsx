'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  IconShield,
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
import { planDropdowns, getVestingScheduleDbName } from '@/config/planDropdowns';
import {
  useCreate,
  useGetAllPlanTypes,
  useGetAllMasterVestingSchedules,
} from '@/api/generated/endpoints/plan-sponsor-details/plan-sponsor-details';
import type {
  EmployerContributionRuleDTORuleType,
  ProfitSharingConfigDTOFormula,
  PlanEligibilityDTOExclusionsItem,
} from '@/api/generated/models';

const safeHarborPlanSchema = z.object({
  // Employer Contribution (Safe Harbor)
  employerContributionType: z.string(),
  employerContributionPercentage: z.string().optional(),
  employerVesting: z.string().optional(),

  // Employee Eligibility
  minimumAge: z.string(),
  timeEmployed: z.string(),
  exclusionType: z.string(),
  customExclusions: z.array(z.string()).optional(),

  // Auto-Enrollment
  isAutoEnrollment: z.boolean(),
  defaultContributionRate: z.string().optional(),
  annualIncreaseMode: z.string(),
  annualIncreaseRate: z.string().optional(),
  maxContributionRate: z.string().optional(),

  // Profit Sharing (always visible, not optional)
  profitSharingDefault: z.string(),
  profitSharingFormula: z.string(),
  profitSharingVestingSchedule: z.string(),
});

type SafeHarborPlanFormData = z.infer<typeof safeHarborPlanSchema>;

export default function SafeHarborPlanPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showSafeHarborInfo, setShowSafeHarborInfo] = useState(false);

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
  } = useForm<SafeHarborPlanFormData>({
    resolver: zodResolver(safeHarborPlanSchema),
    defaultValues: {
      employerContributionType: 'basic-match',
      employerContributionPercentage: '4',
      employerVesting: 'immediate',
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
    // Check if previous step was completed
    const selectedPlanType = sessionStorage.getItem('selectedPlanType');
    if (!selectedPlanType || selectedPlanType !== 'safe-harbor-401k') {
      toast.error('Missing information', 'Please select Safe Harbor plan first.');
      router.push(ROUTES.GET_STARTED.PLAN_RECOMMENDATION);
      return;
    }

    // Load saved data if exists
    const savedData = sessionStorage.getItem('safeHarborPlanData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        Object.keys(parsed).forEach((key) => {
          setValue(key as keyof SafeHarborPlanFormData, parsed[key]);
        });
      } catch (error) {
        console.error('Failed to parse saved safe harbor plan data', error);
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

  const onSubmit = (data: SafeHarborPlanFormData) => {
    // Save to session storage
    sessionStorage.setItem('safeHarborPlanData', JSON.stringify(data));

    // Show compliance modal before saving
    setShowComplianceModal(true);
  };

  const handleConfirmPlan = async () => {
    setIsLoading(true);
    setShowComplianceModal(false);

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
        sessionStorage.getItem('safeHarborPlanData') || '{}'
      ) as SafeHarborPlanFormData;

      // Find Safe Harbor plan type from backend
      const safeHarborPlan = planTypes?.find((plan) =>
        plan.name?.toLowerCase().includes('safe harbor')
      );

      if (!safeHarborPlan?.id) {
        toast.error('Plan type not found', 'Unable to find Safe Harbor plan type. Please refresh the page.');
        setIsLoading(false);
        return;
      }

      // Map employer contribution type to contribution rule
      const ruleTypeMapping: Record<string, EmployerContributionRuleDTORuleType> = {
        'basic-match': 'BASIC_MATCH',
        'enhanced-match': 'ENHANCED_MATCH',
        'non-elective-minimum': 'SAFE_HARBOR_NON_ELECTIVE',
        'non-elective-enhanced': 'SAFE_HARBOR_NON_ELECTIVE',
      };
      const ruleType: EmployerContributionRuleDTORuleType = ruleTypeMapping[data.employerContributionType] || 'BASIC_MATCH';
      const contributionRate = parseFloat(data.employerContributionPercentage || '4');

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

      const minimumEntryAge =
        data.minimumAge === 'no-minimum' ? 0 : parseInt(data.minimumAge || '21');

      // Find vesting schedule IDs from dropdown values
      const findVestingScheduleId = (value: string): string | undefined => {
        const dbName = getVestingScheduleDbName(value);
        const schedule = vestingSchedules?.find((s) => s.name === dbName);
        return schedule?.id;
      };

      const requestBody = {
        planTypeId: safeHarborPlan.id,
        planYear: new Date().getFullYear(),
        effectiveDate: new Date().toISOString().split('T')[0],
        email,
        eligibility: {
          minimumEntryAge,
          timeEmployedMonths: data.timeEmployed === 'immediate' ? 0 : parseInt(data.timeEmployed),
          exclusions: mapExclusions(),
        },
        employeeContributionConfig: {
          hasEmployeeContribution: true,
          defaultContributionRate: parseFloat(data.defaultContributionRate || '0'),
          isAutoEnrollment: data.isAutoEnrollment,
          enrollmentStartRate: parseFloat(data.defaultContributionRate || '0'),
          enrollmentAnnualIncrease: increase,
          enrollmentMaxRate: max,
          enrollmentMaxContributionRate: max,
          supportsRoth: true,
        },
        employerContributionRule: {
          ruleType,
          basicMatchFirstPercent: (data.employerContributionType === 'basic-match') ? 100 : 0,
          basicMatchFirstRate: (data.employerContributionType === 'basic-match') ? contributionRate : 0,
          basicMatchSecondPercent: undefined,
          basicMatchSecondRate: undefined,
          flexibleMatchPercent: (data.employerContributionType === 'enhanced-match') ? contributionRate : undefined,
          nonElectivePercent: (data.employerContributionType === 'non-elective-minimum')
            ? 3
            : (data.employerContributionType === 'non-elective-enhanced')
            ? contributionRate
            : undefined,
          matchPercentage: (data.employerContributionType === 'basic-match' || data.employerContributionType === 'enhanced-match') ? contributionRate : 0,
          matchLimitPercent: (data.employerContributionType === 'basic-match' || data.employerContributionType === 'enhanced-match') ? contributionRate : 0,
          // Safe Harbor requires immediate vesting - look up from backend
          vestingScheduleId: findVestingScheduleId('immediate'),
          tenantVestingScheduleId: findVestingScheduleId('immediate'),
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
      console.log('Creating Safe Harbor plan with data:', JSON.stringify(requestBody, null, 2));

      await createPlanMutation.mutateAsync({ data: requestBody });

      toast.success('Success', 'Safe Harbor plan configured successfully!');
      router.push(ROUTES.GET_STARTED.BUSINESS_DETAILS);
    } catch (error: unknown) {
      console.error('Failed to save Safe Harbor plan:', error);

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
              Design your Safe Harbor 401(k) Plan
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
          {/* Employer Contribution (Safe Harbor) */}
          <Card className="w-full rounded-[24px] border-0 bg-white/95 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Set up Employer Safe Harbor contribution</CardTitle>
              <CardDescription>
                Select a Safe Harbor contribution to ensure compliance and support employee retirement savings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormSelect
                label="What type of employer contribution will you provide?"
                options={planDropdowns.employerContributionType.safeHarbor}
                value={employerContributionType}
                onValueChange={(value) => setValue('employerContributionType', value)}
                required
                error={errors.employerContributionType?.message}
              />

              {/* Safe Harbor Info Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <IconShield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700 space-y-2">
                    <p className="font-semibold">Safe Harbor 401(k) Benefits</p>
                    <p>
                      Your plan will automatically pass IRS nondiscrimination testing, allowing highly compensated employees to maximize their contributions. Safe Harbor contributions are always 100% vested immediately.
                    </p>
                  </div>
                </div>
              </div>

              {employerContributionType === 'enhanced-match' && (
                <FormSelect
                  label="Match Percentage (i.e. 100% match up to this percentage of compensation)"
                  options={planDropdowns.safeHarborMatchPercentage}
                  value={watch('employerContributionPercentage') || '5'}
                  onValueChange={(value) => setValue('employerContributionPercentage', value)}
                  required
                  error={errors.employerContributionPercentage?.message}
                />
              )}

              {employerContributionType === 'non-elective-enhanced' && (
                <FormSelect
                  label="Non-elective contribution (percentage of compensation)"
                  options={planDropdowns.safeHarborNonElectivePercentage}
                  value={watch('employerContributionPercentage') || '4'}
                  onValueChange={(value) => setValue('employerContributionPercentage', value)}
                  required
                  error={errors.employerContributionPercentage?.message}
                />
              )}

              <FormSelect
                label="Vesting Schedule for Employer Match"
                options={planDropdowns.vestingSchedules}
                value={watch('employerVesting') || 'immediate'}
                onValueChange={(value) => setValue('employerVesting', value)}
                disabled
                required
                error={errors.employerVesting?.message}
              />
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
                  error={errors.minimumAge?.message}
                />

                <FormSelect
                  label="Service Requirement"
                  options={planDropdowns.timeEmployed}
                  value={watch('timeEmployed')}
                  onValueChange={(value) => setValue('timeEmployed', value)}
                  required
                  // helperText="Maximum 12 months allowed"
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
              <CardTitle>Employee contribution</CardTitle>
              <CardDescription>
                The IRS requires employees to be automatically enrolled with a default employee contribution rate unless they choose their own rate or opt out.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormSelect
                  label="Default employee contribution rate"
                  options={planDropdowns.defaultContributionRate}
                  value={watch('defaultContributionRate') || '3'}
                  onValueChange={(value) => setValue('defaultContributionRate', value)}
                  required
                  // helperText="Recommended: 3-6% of compensation. Employees can change this anytime."
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

              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <IconInfoCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Employees must be notified 30-90 days before automatic enrollment begins and can opt
                  out at any time.
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormSelect
                  label="Default contribution"
                  options={planDropdowns.profitSharingDefault}
                  value={watch('profitSharingDefault') || 'none'}
                  onValueChange={(value) => setValue('profitSharingDefault', value)}
                  disabled={watch('profitSharingDefault') === 'none'}
                  // helperText="Set to 'None' if not using profit sharing"
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
                  // helperText="Profit sharing can have a separate vesting schedule (not immediate like Safe Harbor)"
                  error={errors.profitSharingVestingSchedule?.message}
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <IconInfoCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  <strong>Profit sharing is discretionary:</strong> You decide each year whether to make contributions and how much, separate from Safe Harbor requirements.
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

      {/* Safe Harbor Info Modal */}
      <Dialog open={showSafeHarborInfo} onOpenChange={setShowSafeHarborInfo}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconShield className="h-5 w-5 text-primary" />
              About Safe Harbor 401(k) Plans
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Key Benefits:</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>
                    <strong>Automatic Pass:</strong> Your plan automatically passes IRS
                    nondiscrimination tests (ADP/ACP)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>
                    <strong>No Testing Required:</strong> Eliminates complex and costly annual
                    compliance testing
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>
                    <strong>Higher Contribution Limits:</strong> Owners and highly compensated
                    employees can maximize deferrals
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Requirements:</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    <strong>Required Contributions:</strong> You must make guaranteed employer
                    contributions each year
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    <strong>Immediate Vesting:</strong> Safe Harbor contributions are 100% vested
                    immediately
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    <strong>Annual Notice:</strong> Must provide Safe Harbor notice to employees
                    30-90 days before plan year
                  </span>
                </li>
              </ul>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* Compliance Confirmation Modal */}
      <Dialog open={showComplianceModal} onOpenChange={setShowComplianceModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconAlertCircle className="h-5 w-5 text-primary" />
              Confirm Safe Harbor Plan Setup
            </DialogTitle>
            <DialogDescription>
              Please review the Safe Harbor requirements before proceeding
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">

            <p className="text-sm text-muted-foreground">
              By proceeding, you confirm that you understand these requirements and commit to
              fulfilling them as part of your Safe Harbor 401(k) plan.
            </p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowComplianceModal(false)}
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
