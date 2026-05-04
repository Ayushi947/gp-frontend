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
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CONFIG_KEY = 'sponsor_config';

const sponsorConfigSchema = z.object({
  defaultPlanType: z.string(),
  defaultVestingSchedule: z.string(),
  defaultMatchPercentage: z.number().min(0).max(100),
  defaultContributionLimit: z.number().min(0),
  enableAutoEnrollment: z.boolean(),
  defaultAutoEnrollmentPercentage: z.number().min(0).max(100),
  requirePlanDocuments: z.boolean(),
  allowCustomPlanDesign: z.boolean(),
  requireERISACompliance: z.boolean(),
  minimumParticipants: z.number().min(1),
});

type SponsorConfigForm = z.infer<typeof sponsorConfigSchema>;

const defaultValues: SponsorConfigForm = {
  defaultPlanType: 'traditional_401k',
  defaultVestingSchedule: '3_year_graded',
  defaultMatchPercentage: 50,
  defaultContributionLimit: 23000,
  enableAutoEnrollment: true,
  defaultAutoEnrollmentPercentage: 3,
  requirePlanDocuments: true,
  allowCustomPlanDesign: true,
  requireERISACompliance: true,
  minimumParticipants: 1,
};

export default function SponsorConfigurationPage() {
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
        toast.success('Sponsor configuration saved successfully');
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to save sponsor configuration';
        toast.error(message);
      },
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<SponsorConfigForm>({
    resolver: zodResolver(sponsorConfigSchema),
    defaultValues,
  });

  useEffect(() => {
    if (configData?.configValue) {
      try {
        const savedConfig = JSON.parse(configData.configValue) as Partial<SponsorConfigForm>;
        reset({ ...defaultValues, ...savedConfig });
      } catch (error) {
        console.error('Error parsing config:', error);
      }
    }
  }, [configData, reset]);

  const onSubmit = async (data: SponsorConfigForm) => {
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
              <Skeleton className="h-7 w-56 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex justify-between items-center">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
            <h1 className="text-2xl font-semibold tracking-tight">Sponsor Configuration</h1>
            <p className="text-sm text-muted-foreground mt-1">Default plan settings and sponsor options</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Plan Defaults
            </CardTitle>
            <CardDescription>Configure default settings for new plans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultMatchPercentage">Default Match Percentage</Label>
                <Input id="defaultMatchPercentage" type="number" min={0} max={100} {...register('defaultMatchPercentage', { valueAsNumber: true })} />
                {errors.defaultMatchPercentage && <p className="text-sm text-destructive">{errors.defaultMatchPercentage.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultContributionLimit">Default Contribution Limit</Label>
                <Input id="defaultContributionLimit" type="number" min={0} {...register('defaultContributionLimit', { valueAsNumber: true })} />
                {errors.defaultContributionLimit && <p className="text-sm text-destructive">{errors.defaultContributionLimit.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultAutoEnrollmentPercentage">Auto-Enrollment Percentage</Label>
                <Input id="defaultAutoEnrollmentPercentage" type="number" min={0} max={100} {...register('defaultAutoEnrollmentPercentage', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumParticipants">Minimum Participants</Label>
                <Input id="minimumParticipants" type="number" min={1} {...register('minimumParticipants', { valueAsNumber: true })} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Auto-Enrollment</Label>
                  <p className="text-xs text-muted-foreground">Automatically enroll new employees</p>
                </div>
                <Switch checked={watch('enableAutoEnrollment')} onCheckedChange={(checked) => setValue('enableAutoEnrollment', checked)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Plan Documents</Label>
                  <p className="text-xs text-muted-foreground">Mandate submission of plan documents</p>
                </div>
                <Switch checked={watch('requirePlanDocuments')} onCheckedChange={(checked) => setValue('requirePlanDocuments', checked)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Custom Plan Design</Label>
                  <p className="text-xs text-muted-foreground">Permit customization of plan features</p>
                </div>
                <Switch checked={watch('allowCustomPlanDesign')} onCheckedChange={(checked) => setValue('allowCustomPlanDesign', checked)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require ERISA Compliance</Label>
                  <p className="text-xs text-muted-foreground">Enforce ERISA compliance checks</p>
                </div>
                <Switch checked={watch('requireERISACompliance')} onCheckedChange={(checked) => setValue('requireERISACompliance', checked)} />
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
