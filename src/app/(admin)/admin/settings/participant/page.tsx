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
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CONFIG_KEY = 'participant_config';

const participantConfigSchema = z.object({
  // Enrollment Settings
  minimumAge: z.number().min(18).max(65),
  minimumServiceMonths: z.number().min(0).max(24),
  allowImmediateEnrollment: z.boolean(),
  requireEnrollmentElection: z.boolean(),

  // Contribution Limits
  defaultContributionPercentage: z.number().min(0).max(100),
  minimumContributionPercentage: z.number().min(0).max(100),
  maximumContributionPercentage: z.number().min(0).max(100),
  allowCatchUpContributions: z.boolean(),
  catchUpAge: z.number().min(50).max(70),

  // Loan Settings
  allowLoans: z.boolean(),
  maxLoanPercentage: z.number().min(0).max(50),
  minimumLoanAmount: z.number().min(0),
  maximumLoanAmount: z.number().min(0),

  // Withdrawal Settings
  allowHardshipWithdrawals: z.boolean(),
  requireDocumentation: z.boolean(),
  minimumWithdrawalAge: z.number().min(55).max(70),

  // Distribution Options
  allowInServiceDistributions: z.boolean(),
  allowRolloverContributions: z.boolean(),
  allowRothConversions: z.boolean(),
});

type ParticipantConfigForm = z.infer<typeof participantConfigSchema>;

const defaultValues: ParticipantConfigForm = {
  minimumAge: 21,
  minimumServiceMonths: 12,
  allowImmediateEnrollment: false,
  requireEnrollmentElection: true,
  defaultContributionPercentage: 3,
  minimumContributionPercentage: 1,
  maximumContributionPercentage: 75,
  allowCatchUpContributions: true,
  catchUpAge: 50,
  allowLoans: true,
  maxLoanPercentage: 50,
  minimumLoanAmount: 1000,
  maximumLoanAmount: 50000,
  allowHardshipWithdrawals: true,
  requireDocumentation: true,
  minimumWithdrawalAge: 59,
  allowInServiceDistributions: false,
  allowRolloverContributions: true,
  allowRothConversions: true,
};

export default function ParticipantConfigurationPage() {
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
        toast.success('Participant configuration saved successfully');
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to save participant configuration';
        toast.error(message);
      },
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ParticipantConfigForm>({
    resolver: zodResolver(participantConfigSchema),
    defaultValues,
  });

  useEffect(() => {
    if (configData?.configValue) {
      try {
        const savedConfig = JSON.parse(configData.configValue) as Partial<ParticipantConfigForm>;
        reset({ ...defaultValues, ...savedConfig });
      } catch (error) {
        console.error('Error parsing config:', error);
      }
    }
  }, [configData, reset]);

  const onSubmit = async (data: ParticipantConfigForm) => {
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
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map((j) => (
                      <div key={j} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {[1, 2].map((j) => (
                      <div key={j} className="flex justify-between items-center">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-6 w-12" />
                      </div>
                    ))}
                  </div>
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
            <h1 className="text-2xl font-semibold tracking-tight">Participant Configuration</h1>
            <p className="text-sm text-muted-foreground mt-1">Enrollment options, contribution limits, and participant defaults</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Enrollment Settings */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Enrollment Settings
            </CardTitle>
            <CardDescription>Configure participant eligibility and enrollment requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minimumAge">Minimum Age</Label>
                <Input id="minimumAge" type="number" min={18} max={65} {...register('minimumAge', { valueAsNumber: true })} />
                {errors.minimumAge && <p className="text-sm text-destructive">{errors.minimumAge.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumServiceMonths">Minimum Service (Months)</Label>
                <Input id="minimumServiceMonths" type="number" min={0} max={24} {...register('minimumServiceMonths', { valueAsNumber: true })} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Immediate Enrollment</Label>
                  <p className="text-xs text-muted-foreground">Permit enrollment without waiting period</p>
                </div>
                <Switch checked={watch('allowImmediateEnrollment')} onCheckedChange={(checked) => setValue('allowImmediateEnrollment', checked)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Enrollment Election</Label>
                  <p className="text-xs text-muted-foreground">Mandate active enrollment choice</p>
                </div>
                <Switch checked={watch('requireEnrollmentElection')} onCheckedChange={(checked) => setValue('requireEnrollmentElection', checked)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contribution Limits */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Contribution Limits</CardTitle>
            <CardDescription>Set default and maximum contribution percentages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="defaultContributionPercentage">Default %</Label>
                <Input id="defaultContributionPercentage" type="number" min={0} max={100} {...register('defaultContributionPercentage', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumContributionPercentage">Minimum %</Label>
                <Input id="minimumContributionPercentage" type="number" min={0} max={100} {...register('minimumContributionPercentage', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maximumContributionPercentage">Maximum %</Label>
                <Input id="maximumContributionPercentage" type="number" min={0} max={100} {...register('maximumContributionPercentage', { valueAsNumber: true })} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Catch-Up Contributions</Label>
                  <p className="text-xs text-muted-foreground">Enable additional contributions for older participants</p>
                </div>
                <Switch checked={watch('allowCatchUpContributions')} onCheckedChange={(checked) => setValue('allowCatchUpContributions', checked)} />
              </div>

              {watch('allowCatchUpContributions') && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="catchUpAge">Catch-Up Age</Label>
                  <Input id="catchUpAge" type="number" min={50} max={70} {...register('catchUpAge', { valueAsNumber: true })} className="w-32" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loan Settings */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Loan Settings</CardTitle>
            <CardDescription>Configure participant loan options and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Loans</Label>
                <p className="text-xs text-muted-foreground">Permit participants to take loans from their accounts</p>
              </div>
              <Switch checked={watch('allowLoans')} onCheckedChange={(checked) => setValue('allowLoans', checked)} />
            </div>

            {watch('allowLoans') && (
              <div className="grid gap-6 md:grid-cols-3 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="maxLoanPercentage">Max Loan %</Label>
                  <Input id="maxLoanPercentage" type="number" min={0} max={50} {...register('maxLoanPercentage', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumLoanAmount">Minimum Amount</Label>
                  <Input id="minimumLoanAmount" type="number" min={0} {...register('minimumLoanAmount', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maximumLoanAmount">Maximum Amount</Label>
                  <Input id="maximumLoanAmount" type="number" min={0} {...register('maximumLoanAmount', { valueAsNumber: true })} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal Settings */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Withdrawal & Distribution Options</CardTitle>
            <CardDescription>Configure withdrawal rules and distribution options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Hardship Withdrawals</Label>
                <p className="text-xs text-muted-foreground">Permit withdrawals for financial hardship</p>
              </div>
              <Switch checked={watch('allowHardshipWithdrawals')} onCheckedChange={(checked) => setValue('allowHardshipWithdrawals', checked)} />
            </div>

            {watch('allowHardshipWithdrawals') && (
              <div className="grid gap-6 md:grid-cols-2 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="minimumWithdrawalAge">Minimum Withdrawal Age</Label>
                  <Input id="minimumWithdrawalAge" type="number" min={55} max={70} {...register('minimumWithdrawalAge', { valueAsNumber: true })} />
                </div>
                <div className="flex items-center justify-between pt-8">
                  <Label>Require Documentation</Label>
                  <Switch checked={watch('requireDocumentation')} onCheckedChange={(checked) => setValue('requireDocumentation', checked)} />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow In-Service Distributions</Label>
                <p className="text-xs text-muted-foreground">Permit distributions while still employed</p>
              </div>
              <Switch checked={watch('allowInServiceDistributions')} onCheckedChange={(checked) => setValue('allowInServiceDistributions', checked)} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Rollover Contributions</Label>
                <p className="text-xs text-muted-foreground">Accept rollovers from other qualified plans</p>
              </div>
              <Switch checked={watch('allowRolloverContributions')} onCheckedChange={(checked) => setValue('allowRolloverContributions', checked)} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Roth Conversions</Label>
                <p className="text-xs text-muted-foreground">Permit conversion of traditional contributions to Roth</p>
              </div>
              <Switch checked={watch('allowRothConversions')} onCheckedChange={(checked) => setValue('allowRothConversions', checked)} />
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
