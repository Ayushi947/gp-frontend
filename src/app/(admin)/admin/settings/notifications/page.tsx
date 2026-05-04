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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CONFIG_KEY = 'notification_config';

const notificationConfigSchema = z.object({
  // Email Notifications
  enableEmailNotifications: z.boolean(),
  sendWelcomeEmail: z.boolean(),
  sendEnrollmentConfirmation: z.boolean(),
  sendContributionAlerts: z.boolean(),
  sendDistributionNotices: z.boolean(),
  sendComplianceAlerts: z.boolean(),

  // Notification Timing
  dailyDigestTime: z.string(),
  weeklyReportDay: z.string(),
  monthlyReportDay: z.number().min(1).max(28),

  // Alert Thresholds
  largeContributionThreshold: z.number().min(0),
  largeWithdrawalThreshold: z.number().min(0),
  accountBalanceAlertThreshold: z.number().min(0),

  // Template Customization
  emailFromName: z.string(),
  emailFooterText: z.string(),
  supportContactEmail: z.string().email(),
  supportContactPhone: z.string(),
});

type NotificationConfigForm = z.infer<typeof notificationConfigSchema>;

const defaultValues: NotificationConfigForm = {
  enableEmailNotifications: true,
  sendWelcomeEmail: true,
  sendEnrollmentConfirmation: true,
  sendContributionAlerts: true,
  sendDistributionNotices: true,
  sendComplianceAlerts: true,
  dailyDigestTime: '08:00',
  weeklyReportDay: 'monday',
  monthlyReportDay: 1,
  largeContributionThreshold: 10000,
  largeWithdrawalThreshold: 25000,
  accountBalanceAlertThreshold: 100000,
  emailFromName: 'GlidingPath',
  emailFooterText: 'This is an automated notification from GlidingPath 401(k) Administration Platform.',
  supportContactEmail: 'support@glidingpath.com',
  supportContactPhone: '1-800-GLIDING',
};

export default function NotificationSettingsPage() {
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
        toast.success('Notification configuration saved successfully');
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to save notification configuration';
        toast.error(message);
      },
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<NotificationConfigForm>({
    resolver: zodResolver(notificationConfigSchema),
    defaultValues,
  });

  useEffect(() => {
    if (configData?.configValue) {
      try {
        const savedConfig = JSON.parse(configData.configValue) as Partial<NotificationConfigForm>;
        reset({ ...defaultValues, ...savedConfig });
      } catch (error) {
        console.error('Error parsing config:', error);
      }
    }
  }, [configData, reset]);

  const onSubmit = async (data: NotificationConfigForm) => {
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
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
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
            <h1 className="text-2xl font-semibold tracking-tight">Notification Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Email templates, notification preferences, and alerts</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>Configure which email notifications to send</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Master switch for all email notifications</p>
              </div>
              <Switch checked={watch('enableEmailNotifications')} onCheckedChange={(checked) => setValue('enableEmailNotifications', checked)} />
            </div>

            {watch('enableEmailNotifications') && (
              <div className="space-y-4 ml-6">
                <div className="flex items-center justify-between">
                  <Label>Send Welcome Email</Label>
                  <Switch checked={watch('sendWelcomeEmail')} onCheckedChange={(checked) => setValue('sendWelcomeEmail', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Send Enrollment Confirmation</Label>
                  <Switch checked={watch('sendEnrollmentConfirmation')} onCheckedChange={(checked) => setValue('sendEnrollmentConfirmation', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Send Contribution Alerts</Label>
                  <Switch checked={watch('sendContributionAlerts')} onCheckedChange={(checked) => setValue('sendContributionAlerts', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Send Distribution Notices</Label>
                  <Switch checked={watch('sendDistributionNotices')} onCheckedChange={(checked) => setValue('sendDistributionNotices', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Send Compliance Alerts</Label>
                  <Switch checked={watch('sendComplianceAlerts')} onCheckedChange={(checked) => setValue('sendComplianceAlerts', checked)} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Notification Timing</CardTitle>
            <CardDescription>Configure when notifications are sent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="dailyDigestTime">Daily Digest Time</Label>
                <Input id="dailyDigestTime" type="time" {...register('dailyDigestTime')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weeklyReportDay">Weekly Report Day</Label>
                <Input id="weeklyReportDay" {...register('weeklyReportDay')} placeholder="monday" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyReportDay">Monthly Report Day</Label>
                <Input id="monthlyReportDay" type="number" min={1} max={28} {...register('monthlyReportDay', { valueAsNumber: true })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Alert Thresholds</CardTitle>
            <CardDescription>Set thresholds for automated alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="largeContributionThreshold">Large Contribution ($)</Label>
                <Input id="largeContributionThreshold" type="number" min={0} {...register('largeContributionThreshold', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground">Alert when contribution exceeds this amount</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="largeWithdrawalThreshold">Large Withdrawal ($)</Label>
                <Input id="largeWithdrawalThreshold" type="number" min={0} {...register('largeWithdrawalThreshold', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground">Alert when withdrawal exceeds this amount</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountBalanceAlertThreshold">Balance Alert ($)</Label>
                <Input id="accountBalanceAlertThreshold" type="number" min={0} {...register('accountBalanceAlertThreshold', { valueAsNumber: true })} />
                <p className="text-xs text-muted-foreground">Alert when account balance reaches threshold</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Template Customization</CardTitle>
            <CardDescription>Customize email template settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emailFromName">Email From Name</Label>
                <Input id="emailFromName" {...register('emailFromName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportContactEmail">Support Contact Email</Label>
                <Input id="supportContactEmail" type="email" {...register('supportContactEmail')} />
                {errors.supportContactEmail && <p className="text-sm text-destructive">{errors.supportContactEmail.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportContactPhone">Support Contact Phone</Label>
                <Input id="supportContactPhone" {...register('supportContactPhone')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailFooterText">Email Footer Text</Label>
              <Textarea id="emailFooterText" {...register('emailFooterText')} rows={3} />
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
