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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CONFIG_KEY = 'email_config';

const emailConfigSchema = z.object({
  provider: z.string(),
  awsRegion: z.string(),
  awsAccessKeyId: z.string(),
  awsSecretAccessKey: z.string(),
  smtpHost: z.string(),
  smtpPort: z.number().min(1).max(65535),
  smtpUsername: z.string(),
  smtpPassword: z.string(),
  useSSL: z.boolean(),
  useTLS: z.boolean(),
  fromEmail: z.string().email(),
  fromName: z.string(),
  replyToEmail: z.string().email(),
  enableBounceHandling: z.boolean(),
  enableComplaintHandling: z.boolean(),
  maxSendRate: z.number().min(1),
});

type EmailConfigForm = z.infer<typeof emailConfigSchema>;

const defaultValues: EmailConfigForm = {
  provider: 'aws_ses',
  awsRegion: 'us-east-1',
  awsAccessKeyId: '',
  awsSecretAccessKey: '',
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpUsername: '',
  smtpPassword: '',
  useSSL: false,
  useTLS: true,
  fromEmail: 'noreply@glidingpath.com',
  fromName: 'GlidingPath',
  replyToEmail: 'support@glidingpath.com',
  enableBounceHandling: true,
  enableComplaintHandling: true,
  maxSendRate: 14,
};

export default function EmailConfigurationPage() {
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
        toast.success('Email configuration saved successfully');
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to save email configuration';
        toast.error(message);
      },
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<EmailConfigForm>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues,
  });

  useEffect(() => {
    if (configData?.configValue) {
      try {
        const savedConfig = JSON.parse(configData.configValue) as Partial<EmailConfigForm>;
        reset({ ...defaultValues, ...savedConfig });
      } catch (error) {
        console.error('Error parsing config:', error);
      }
    }
  }, [configData, reset]);

  const onSubmit = async (data: EmailConfigForm) => {
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
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((j) => (
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
            <h1 className="text-2xl font-semibold tracking-tight">Email Configuration</h1>
            <p className="text-sm text-muted-foreground mt-1">AWS SES settings, email domains, and SMTP configuration</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Provider
            </CardTitle>
            <CardDescription>Select your email delivery provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select value={watch('provider')} onValueChange={(value) => setValue('provider', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aws_ses">AWS SES</SelectItem>
                  <SelectItem value="smtp">SMTP</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {watch('provider') === 'aws_ses' && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>AWS SES Configuration</CardTitle>
              <CardDescription>Configure AWS Simple Email Service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="awsRegion">AWS Region</Label>
                  <Input id="awsRegion" {...register('awsRegion')} placeholder="us-east-1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSendRate">Max Send Rate (emails/sec)</Label>
                  <Input id="maxSendRate" type="number" min={1} {...register('maxSendRate', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="awsAccessKeyId">AWS Access Key ID</Label>
                  <Input id="awsAccessKeyId" type="password" {...register('awsAccessKeyId')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="awsSecretAccessKey">AWS Secret Access Key</Label>
                  <Input id="awsSecretAccessKey" type="password" {...register('awsSecretAccessKey')} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Bounce Handling</Label>
                  <Switch checked={watch('enableBounceHandling')} onCheckedChange={(checked) => setValue('enableBounceHandling', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enable Complaint Handling</Label>
                  <Switch checked={watch('enableComplaintHandling')} onCheckedChange={(checked) => setValue('enableComplaintHandling', checked)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {watch('provider') === 'smtp' && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>Configure custom SMTP server</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input id="smtpHost" {...register('smtpHost')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input id="smtpPort" type="number" min={1} max={65535} {...register('smtpPort', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">SMTP Username</Label>
                  <Input id="smtpUsername" {...register('smtpUsername')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input id="smtpPassword" type="password" {...register('smtpPassword')} />
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <Label>Use SSL</Label>
                  <Switch checked={watch('useSSL')} onCheckedChange={(checked) => setValue('useSSL', checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Use TLS</Label>
                  <Switch checked={watch('useTLS')} onCheckedChange={(checked) => setValue('useTLS', checked)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Email Addresses</CardTitle>
            <CardDescription>Configure sender and reply-to addresses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <Input id="fromEmail" type="email" {...register('fromEmail')} />
                {errors.fromEmail && <p className="text-sm text-destructive">{errors.fromEmail.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input id="fromName" {...register('fromName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="replyToEmail">Reply-To Email</Label>
                <Input id="replyToEmail" type="email" {...register('replyToEmail')} />
                {errors.replyToEmail && <p className="text-sm text-destructive">{errors.replyToEmail.message}</p>}
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
