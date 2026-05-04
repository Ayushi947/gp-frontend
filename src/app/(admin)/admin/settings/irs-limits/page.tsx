'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetConfigurationByKey,
  useUpdateConfiguration
} from '@/api/generated/endpoints/platform-configuration/platform-configuration';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CONFIG_KEY = 'irs_limits_config';

const irsLimitsConfigSchema = z.object({
  // Plan Year
  planYear: z.number().min(2020).max(2050),

  // 401(k) Elective Deferral Limits (IRC 402(g))
  electiveDeferralLimit: z.number().min(0),
  catchUpContributionLimit: z.number().min(0),
  catchUpAge: z.number().min(50).max(70),

  // Defined Contribution Limits (IRC 415(c))
  annualAdditionsLimit: z.number().min(0),
  compensationLimit: z.number().min(0),

  // Highly Compensated Employee Threshold
  hceCompensationThreshold: z.number().min(0),
  hceOwnershipThreshold: z.number().min(0).max(100),

  // Key Employee Thresholds
  keyEmployeeOfficerCompensation: z.number().min(0),
  keyEmployeeOwnershipThreshold: z.number().min(0).max(100),

  // Social Security Wage Base
  socialSecurityWageBase: z.number().min(0),

  // SIMPLE Plan Limits
  simpleElectiveDeferralLimit: z.number().min(0),
  simpleCatchUpLimit: z.number().min(0),
  simpleMatchingLimit: z.number().min(0).max(100),

  // Safe Harbor Limits
  safeHarborMatchLimit: z.number().min(0).max(100),
  safeHarborNonElectiveLimit: z.number().min(0).max(100),

  // IRA Limits (for reference)
  traditionalIRALimit: z.number().min(0),
  rothIRALimit: z.number().min(0),
  iraCatchUpLimit: z.number().min(0),
});

type IRSLimitsConfigForm = z.infer<typeof irsLimitsConfigSchema>;

const defaultValues: IRSLimitsConfigForm = {
  planYear: 2025,
  electiveDeferralLimit: 23500,
  catchUpContributionLimit: 7500,
  catchUpAge: 50,
  annualAdditionsLimit: 70000,
  compensationLimit: 350000,
  hceCompensationThreshold: 155000,
  hceOwnershipThreshold: 5,
  keyEmployeeOfficerCompensation: 220000,
  keyEmployeeOwnershipThreshold: 5,
  socialSecurityWageBase: 176100,
  simpleElectiveDeferralLimit: 16500,
  simpleCatchUpLimit: 3500,
  simpleMatchingLimit: 3,
  safeHarborMatchLimit: 4,
  safeHarborNonElectiveLimit: 3,
  traditionalIRALimit: 7000,
  rothIRALimit: 7000,
  iraCatchUpLimit: 1000,
};

export default function IRSLimitsConfigurationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: configData, isLoading } = useGetConfigurationByKey(CONFIG_KEY, {
    query: {
      retry: false,
    },
  });

  const updateConfigMutation = useUpdateConfiguration({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/superadmin/config/${CONFIG_KEY}`] });
        toast.success('IRS limits configuration saved successfully');
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to save IRS limits configuration';
        toast.error(message);
      },
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<IRSLimitsConfigForm>({
    resolver: zodResolver(irsLimitsConfigSchema),
    defaultValues,
  });

  useEffect(() => {
    if (configData?.configValue) {
      try {
        const savedConfig = JSON.parse(configData.configValue) as Partial<IRSLimitsConfigForm>;
        reset({ ...defaultValues, ...savedConfig });
      } catch (error) {
        console.error('Error parsing config:', error);
      }
    }
  }, [configData, reset]);

  const onSubmit = async (data: IRSLimitsConfigForm) => {
    try {
      await updateConfigMutation.mutateAsync({
        key: CONFIG_KEY,
        data: { configValue: JSON.stringify(data) },
      });
    } catch (error) {
      // Handled by mutation
    }
  };

  if (isLoading) {
    return (
      <DashboardContent>
        <div className="space-y-8 max-w-6xl">
          <div className="space-y-4">
            <Button onClick={() => router.push('/admin/settings')} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <Skeleton className="h-7 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <div className="space-y-8 max-w-6xl">
        <div className="space-y-4">
          <Button onClick={() => router.push('/admin/settings')} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">IRS Contribution Limits</h1>
            <p className="text-sm text-muted-foreground mt-1">Annual IRS limits for 401(k) contributions (402g, 415c, catch-up)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Plan Year */}
          <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Plan Year
            </CardTitle>
            <CardDescription>Select the plan year for IRS limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="planYear">Plan Year</Label>
              <Select value={watch('planYear').toString()} onValueChange={(value) => setValue('planYear', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 6 }, (_, i) => 2025 - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

          {/* 401(k) Elective Deferral Limits */}
          <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>401(k) Elective Deferral Limits (IRC 402(g))</CardTitle>
            <CardDescription>Annual limits on employee elective deferrals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="electiveDeferralLimit">Elective Deferral Limit ($)</Label>
                <Input id="electiveDeferralLimit" type="number" min={0} {...register('electiveDeferralLimit', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground">Maximum annual employee contribution</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="catchUpContributionLimit">Catch-Up Contribution ($)</Label>
                <Input id="catchUpContributionLimit" type="number" min={0} {...register('catchUpContributionLimit', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground">Additional limit for participants age 50+</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="catchUpAge">Catch-Up Age</Label>
                <Input id="catchUpAge" type="number" min={50} max={70} {...register('catchUpAge', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground">Minimum age for catch-up contributions</p>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Defined Contribution Limits */}
          <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Defined Contribution Limits (IRC 415(c))</CardTitle>
            <CardDescription>Annual additions limit and compensation limit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="annualAdditionsLimit">Annual Additions Limit ($)</Label>
                <Input id="annualAdditionsLimit" type="number" min={0} {...register('annualAdditionsLimit', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground">Maximum total contributions (employee + employer)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="compensationLimit">Compensation Limit ($)</Label>
                <Input id="compensationLimit" type="number" min={0} {...register('compensationLimit', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground">Maximum compensation for calculating contributions</p>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Highly Compensated Employee */}
          <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Highly Compensated Employee (HCE) Thresholds</CardTitle>
            <CardDescription>Thresholds for identifying highly compensated employees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hceCompensationThreshold">HCE Compensation Threshold ($)</Label>
                <Input id="hceCompensationThreshold" type="number" min={0} {...register('hceCompensationThreshold', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground">Prior year compensation threshold for HCE status</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hceOwnershipThreshold">HCE Ownership Threshold (%)</Label>
                <Input id="hceOwnershipThreshold" type="number" min={0} max={100} {...register('hceOwnershipThreshold', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground">Ownership percentage for automatic HCE status</p>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Key Employee */}
          <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Key Employee Thresholds</CardTitle>
            <CardDescription>Thresholds for identifying key employees (top-heavy testing)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="keyEmployeeOfficerCompensation">Officer Compensation ($)</Label>
                <Input id="keyEmployeeOfficerCompensation" type="number" min={0} {...register('keyEmployeeOfficerCompensation', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground">Compensation threshold for key employee officers</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyEmployeeOwnershipThreshold">Ownership Threshold (%)</Label>
                <Input id="keyEmployeeOwnershipThreshold" type="number" min={0} max={100} {...register('keyEmployeeOwnershipThreshold', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground">Ownership percentage for key employee status</p>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Social Security */}
          <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Social Security Wage Base</CardTitle>
            <CardDescription>Annual wage base for Social Security taxes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-md">
              <Label htmlFor="socialSecurityWageBase">Social Security Wage Base ($)</Label>
              <Input id="socialSecurityWageBase" type="number" min={0} {...register('socialSecurityWageBase', { valueAsNumber: true })} />
              <p className="text-xs text-muted-foreground">Maximum earnings subject to Social Security tax</p>
            </div>
          </CardContent>
        </Card>

          {/* SIMPLE Plan Limits */}
          <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>SIMPLE Plan Limits</CardTitle>
            <CardDescription>Contribution limits for SIMPLE 401(k) plans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="simpleElectiveDeferralLimit">Elective Deferral Limit ($)</Label>
                <Input id="simpleElectiveDeferralLimit" type="number" min={0} {...register('simpleElectiveDeferralLimit', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground">Maximum employee deferral for SIMPLE plans</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="simpleCatchUpLimit">Catch-Up Limit ($)</Label>
                <Input id="simpleCatchUpLimit" type="number" min={0} {...register('simpleCatchUpLimit', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground">Additional limit for age 50+ in SIMPLE plans</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="simpleMatchingLimit">Matching Limit (%)</Label>
                <Input id="simpleMatchingLimit" type="number" min={0} max={100} {...register('simpleMatchingLimit', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground">Required matching contribution percentage</p>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Safe Harbor Limits */}
          <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Safe Harbor Contribution Limits</CardTitle>
            <CardDescription>Required contribution percentages for Safe Harbor plans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="safeHarborMatchLimit">Safe Harbor Match (%)</Label>
                <Input id="safeHarborMatchLimit" type="number" min={0} max={100} {...register('safeHarborMatchLimit', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground">Typical 100% match on first 3% + 50% on next 2%</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="safeHarborNonElectiveLimit">Safe Harbor Non-Elective (%)</Label>
                <Input id="safeHarborNonElectiveLimit" type="number" min={0} max={100} {...register('safeHarborNonElectiveLimit', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground">Non-elective contribution to all eligible employees</p>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* IRA Limits */}
          <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>IRA Contribution Limits</CardTitle>
            <CardDescription>Annual limits for Traditional and Roth IRAs (for reference)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="traditionalIRALimit">Traditional IRA Limit ($)</Label>
                <Input id="traditionalIRALimit" type="number" min={0} {...register('traditionalIRALimit', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rothIRALimit">Roth IRA Limit ($)</Label>
                <Input id="rothIRALimit" type="number" min={0} {...register('rothIRALimit', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iraCatchUpLimit">IRA Catch-Up Limit ($)</Label>
                <Input id="iraCatchUpLimit" type="number" min={0} {...register('iraCatchUpLimit', { valueAsNumber: true })} />
              </div>
            </div>
          </CardContent>
        </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/settings')}>Cancel</Button>
            <Button type="submit" disabled={updateConfigMutation.isPending}>
              {updateConfigMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Configuration'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardContent>
  );
}
