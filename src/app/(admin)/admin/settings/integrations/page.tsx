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
import { ArrowLeft, Key, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CONFIG_KEY = 'integration_config';

const integrationConfigSchema = z.object({
  finchApiKey: z.string(),
  finchClientId: z.string(),
  finchClientSecret: z.string(),
  finchRedirectUri: z.string().url(),
  enableFinchIntegration: z.boolean(),
  custodianSFTPHost: z.string(),
  custodianSFTPPort: z.number().min(1).max(65535),
  custodianSFTPUsername: z.string(),
  custodianSFTPPassword: z.string(),
  enableCustodianIntegration: z.boolean(),
  stripePublicKey: z.string(),
  stripeSecretKey: z.string(),
  enableStripeIntegration: z.boolean(),
  slackWebhookUrl: z.string().url().optional(),
  enableSlackNotifications: z.boolean(),
});

type IntegrationConfigForm = z.infer<typeof integrationConfigSchema>;

const defaultValues: IntegrationConfigForm = {
  finchApiKey: '',
  finchClientId: '',
  finchClientSecret: '',
  finchRedirectUri: 'https://glidingpath.com/finch/callback',
  enableFinchIntegration: true,
  custodianSFTPHost: '',
  custodianSFTPPort: 22,
  custodianSFTPUsername: '',
  custodianSFTPPassword: '',
  enableCustodianIntegration: false,
  stripePublicKey: '',
  stripeSecretKey: '',
  enableStripeIntegration: false,
  slackWebhookUrl: '',
  enableSlackNotifications: false,
};

export default function IntegrationSettingsPage() {
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
        toast.success('Integration configuration saved successfully');
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to save integration configuration';
        toast.error(message);
      },
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<IntegrationConfigForm>({
    resolver: zodResolver(integrationConfigSchema),
    defaultValues,
  });

  useEffect(() => {
    if (configData?.configValue) {
      try {
        const savedConfig = JSON.parse(configData.configValue) as Partial<IntegrationConfigForm>;
        reset({ ...defaultValues, ...savedConfig });
      } catch (error) {
        console.error('Error parsing config:', error);
      }
    }
  }, [configData, reset]);

  const onSubmit = async (data: IntegrationConfigForm) => {
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
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-full mb-4" />
                <div className="grid gap-6 md:grid-cols-2">
                  {[1, 2].map((j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
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
            <h1 className="text-2xl font-semibold tracking-tight">Integration Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Finch API, custodian, and third-party integrations</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Finch Payroll Integration
              </CardTitle>
            <CardDescription>Configure Finch API for payroll integrations (200+ providers)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Finch Integration</Label>
              <Switch checked={watch('enableFinchIntegration')} onCheckedChange={(checked) => setValue('enableFinchIntegration', checked)} />
            </div>

            {watch('enableFinchIntegration') && (
              <div className="grid gap-6 md:grid-cols-2 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="finchClientId">Client ID</Label>
                  <Input id="finchClientId" type="password" {...register('finchClientId')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="finchClientSecret">Client Secret</Label>
                  <Input id="finchClientSecret" type="password" {...register('finchClientSecret')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="finchApiKey">API Key</Label>
                  <Input id="finchApiKey" type="password" {...register('finchApiKey')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="finchRedirectUri">Redirect URI</Label>
                  <Input id="finchRedirectUri" type="url" {...register('finchRedirectUri')} />
                </div>
              </div>
            )}
          </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Custodian Integration (SFTP)</CardTitle>
            <CardDescription>Configure custodian file exchange via SFTP</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Custodian Integration</Label>
              <Switch checked={watch('enableCustodianIntegration')} onCheckedChange={(checked) => setValue('enableCustodianIntegration', checked)} />
            </div>

            {watch('enableCustodianIntegration') && (
              <div className="grid gap-6 md:grid-cols-2 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="custodianSFTPHost">SFTP Host</Label>
                  <Input id="custodianSFTPHost" {...register('custodianSFTPHost')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custodianSFTPPort">SFTP Port</Label>
                  <Input id="custodianSFTPPort" type="number" min={1} max={65535} {...register('custodianSFTPPort', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custodianSFTPUsername">SFTP Username</Label>
                  <Input id="custodianSFTPUsername" {...register('custodianSFTPUsername')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custodianSFTPPassword">SFTP Password</Label>
                  <Input id="custodianSFTPPassword" type="password" {...register('custodianSFTPPassword')} />
                </div>
              </div>
            )}
          </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Stripe Payment Integration</CardTitle>
            <CardDescription>Configure Stripe for payment processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Stripe Integration</Label>
              <Switch checked={watch('enableStripeIntegration')} onCheckedChange={(checked) => setValue('enableStripeIntegration', checked)} />
            </div>

            {watch('enableStripeIntegration') && (
              <div className="grid gap-6 md:grid-cols-2 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="stripePublicKey">Public Key</Label>
                  <Input id="stripePublicKey" type="password" {...register('stripePublicKey')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripeSecretKey">Secret Key</Label>
                  <Input id="stripeSecretKey" type="password" {...register('stripeSecretKey')} />
                </div>
              </div>
            )}
          </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Slack Notifications</CardTitle>
            <CardDescription>Configure Slack webhook for platform notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Slack Notifications</Label>
              <Switch checked={watch('enableSlackNotifications')} onCheckedChange={(checked) => setValue('enableSlackNotifications', checked)} />
            </div>

            {watch('enableSlackNotifications') && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="slackWebhookUrl">Webhook URL</Label>
                <Input id="slackWebhookUrl" type="url" {...register('slackWebhookUrl')} placeholder="https://hooks.slack.com/services/..." />
              </div>
            )}
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
