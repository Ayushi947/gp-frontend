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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  Settings,
  Building2,
  Globe,
  Save,
  Clock,
  DollarSign,
  FileText,
} from 'lucide-react';

const CONFIG_KEY = 'platform_config';

const platformConfigSchema = z.object({
  // General Platform Settings
  platformName: z.string().min(1, 'Platform name is required'),
  platformDescription: z.string().optional(),
  supportEmail: z.string().email('Invalid email address'),
  supportPhone: z.string().optional(),
  companyAddress: z.string().optional(),

  // Branding
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),

  // Localization
  defaultTimezone: z.string(),
  defaultCurrency: z.string(),
  defaultLanguage: z.string(),
  dateFormat: z.string(),

  // Business Rules
  enableMultiTenant: z.boolean(),
  maxTenantsAllowed: z.number().min(1),
  enableApiAccess: z.boolean(),
  apiRateLimitPerMinute: z.number().min(1),

  // Document Settings
  maxUploadSizeMB: z.number().min(1).max(100),
  allowedFileTypes: z.string(),
  documentRetentionDays: z.number().min(30),

  // Maintenance
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().optional(),
  scheduledMaintenanceStart: z.string().optional(),
  scheduledMaintenanceEnd: z.string().optional(),
});

type PlatformConfigForm = z.infer<typeof platformConfigSchema>;

const defaultValues: PlatformConfigForm = {
  platformName: 'GlidingPath',
  platformDescription: '401(k) Administration Platform',
  supportEmail: 'support@glidingpath.com',
  supportPhone: '',
  companyAddress: '',
  primaryColor: '#4F46E5',
  secondaryColor: '#7C3AED',
  logoUrl: '',
  faviconUrl: '',
  defaultTimezone: 'America/New_York',
  defaultCurrency: 'USD',
  defaultLanguage: 'en',
  dateFormat: 'MM/DD/YYYY',
  enableMultiTenant: true,
  maxTenantsAllowed: 100,
  enableApiAccess: true,
  apiRateLimitPerMinute: 60,
  maxUploadSizeMB: 10,
  allowedFileTypes: 'pdf,doc,docx,xls,xlsx,csv,jpg,png',
  documentRetentionDays: 2555,
  maintenanceMode: false,
  maintenanceMessage: '',
  scheduledMaintenanceStart: '',
  scheduledMaintenanceEnd: '',
};

export default function PlatformConfigurationPage() {
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
        toast.success('Platform configuration saved successfully');
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to save platform configuration';
        toast.error(message);
      },
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<PlatformConfigForm>({
    resolver: zodResolver(platformConfigSchema),
    defaultValues,
  });

  useEffect(() => {
    if (configData?.configValue) {
      try {
        const savedConfig = JSON.parse(configData.configValue) as Partial<PlatformConfigForm>;
        const mergedConfig = { ...defaultValues, ...savedConfig };
        reset(mergedConfig);
      } catch (error) {
        console.error('Error parsing config:', error);
      }
    }
  }, [configData, reset]);

  const onSubmit = async (data: PlatformConfigForm) => {
    try {
      await updateConfigMutation.mutateAsync({
        key: CONFIG_KEY,
        data: {
          configValue: JSON.stringify(data),
        },
      });
    } catch (error) {
      // Error handled in mutation callbacks
    }
  };

  const watchMaintenanceMode = watch('maintenanceMode');
  const watchEnableMultiTenant = watch('enableMultiTenant');
  const watchEnableApiAccess = watch('enableApiAccess');

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
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-4 w-32" />
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/settings')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Platform Configuration</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage global platform settings and business rules</p>
          </div>
        </div>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={updateConfigMutation.isPending || !isDirty}
        >
          {updateConfigMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General Settings */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Basic platform identification and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platformName">Platform Name *</Label>
                <Input
                  id="platformName"
                  {...register('platformName')}
                  placeholder="Enter platform name"
                />
                {errors.platformName && (
                  <p className="text-sm text-destructive">{errors.platformName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email *</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  {...register('supportEmail')}
                  placeholder="support@example.com"
                />
                {errors.supportEmail && (
                  <p className="text-sm text-destructive">{errors.supportEmail.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="platformDescription">Platform Description</Label>
              <Textarea
                id="platformDescription"
                {...register('platformDescription')}
                placeholder="Brief description of the platform"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supportPhone">Support Phone</Label>
                <Input
                  id="supportPhone"
                  {...register('supportPhone')}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Company Address</Label>
                <Input
                  id="companyAddress"
                  {...register('companyAddress')}
                  placeholder="123 Main St, City, State ZIP"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding Settings */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Branding
            </CardTitle>
            <CardDescription>
              Customize the platform's visual appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    {...register('primaryColor')}
                    placeholder="#4F46E5"
                    className="flex-1"
                  />
                  <Input
                    type="color"
                    value={watch('primaryColor') || '#4F46E5'}
                    onChange={(e) => setValue('primaryColor', e.target.value, { shouldDirty: true })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    {...register('secondaryColor')}
                    placeholder="#7C3AED"
                    className="flex-1"
                  />
                  <Input
                    type="color"
                    value={watch('secondaryColor') || '#7C3AED'}
                    onChange={(e) => setValue('secondaryColor', e.target.value, { shouldDirty: true })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  {...register('logoUrl')}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faviconUrl">Favicon URL</Label>
                <Input
                  id="faviconUrl"
                  {...register('faviconUrl')}
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Localization Settings */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Localization
            </CardTitle>
            <CardDescription>
              Regional settings for date, time, and currency formatting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultTimezone">Default Timezone</Label>
                <Select
                  value={watch('defaultTimezone')}
                  onValueChange={(value) => setValue('defaultTimezone', value, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                    <SelectItem value="Pacific/Honolulu">Hawaii Time (HT)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">Default Currency</Label>
                <Select
                  value={watch('defaultCurrency')}
                  onValueChange={(value) => setValue('defaultCurrency', value, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">Default Language</Label>
                <Select
                  value={watch('defaultLanguage')}
                  onValueChange={(value) => setValue('defaultLanguage', value, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select
                  value={watch('dateFormat')}
                  onValueChange={(value) => setValue('dateFormat', value, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Rules */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Business Rules
            </CardTitle>
            <CardDescription>
              Configure multi-tenancy and API access settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="enableMultiTenant">Enable Multi-Tenant Mode</Label>
                <p className="text-sm text-muted-foreground">Allow multiple organizations to use the platform</p>
              </div>
              <Switch
                id="enableMultiTenant"
                checked={watchEnableMultiTenant}
                onCheckedChange={(checked) => setValue('enableMultiTenant', checked, { shouldDirty: true })}
              />
            </div>
            {watchEnableMultiTenant && (
              <div className="space-y-2 ml-4">
                <Label htmlFor="maxTenantsAllowed">Maximum Tenants Allowed</Label>
                <Input
                  id="maxTenantsAllowed"
                  type="number"
                  {...register('maxTenantsAllowed', { valueAsNumber: true })}
                  min={1}
                  className="w-32"
                />
                {errors.maxTenantsAllowed && (
                  <p className="text-sm text-destructive">{errors.maxTenantsAllowed.message}</p>
                )}
              </div>
            )}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="enableApiAccess">Enable API Access</Label>
                <p className="text-sm text-muted-foreground">Allow external applications to connect via API</p>
              </div>
              <Switch
                id="enableApiAccess"
                checked={watchEnableApiAccess}
                onCheckedChange={(checked) => setValue('enableApiAccess', checked, { shouldDirty: true })}
              />
            </div>
            {watchEnableApiAccess && (
              <div className="space-y-2 ml-4">
                <Label htmlFor="apiRateLimitPerMinute">API Rate Limit (requests per minute)</Label>
                <Input
                  id="apiRateLimitPerMinute"
                  type="number"
                  {...register('apiRateLimitPerMinute', { valueAsNumber: true })}
                  min={1}
                  className="w-32"
                />
                {errors.apiRateLimitPerMinute && (
                  <p className="text-sm text-destructive">{errors.apiRateLimitPerMinute.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Settings */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Settings
            </CardTitle>
            <CardDescription>
              Configure file upload and document retention policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUploadSizeMB">Maximum Upload Size (MB)</Label>
                <Input
                  id="maxUploadSizeMB"
                  type="number"
                  {...register('maxUploadSizeMB', { valueAsNumber: true })}
                  min={1}
                  max={100}
                />
                {errors.maxUploadSizeMB && (
                  <p className="text-sm text-destructive">{errors.maxUploadSizeMB.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentRetentionDays">Document Retention (days)</Label>
                <Input
                  id="documentRetentionDays"
                  type="number"
                  {...register('documentRetentionDays', { valueAsNumber: true })}
                  min={30}
                />
                <p className="text-xs text-muted-foreground">Minimum 30 days for compliance</p>
                {errors.documentRetentionDays && (
                  <p className="text-sm text-destructive">{errors.documentRetentionDays.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
              <Input
                id="allowedFileTypes"
                {...register('allowedFileTypes')}
                placeholder="pdf,doc,docx,xls,xlsx"
              />
              <p className="text-xs text-muted-foreground">Comma-separated list of file extensions</p>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Settings */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Maintenance Mode
            </CardTitle>
            <CardDescription>
              Configure platform maintenance settings and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-warning/10 border-warning">
              <div>
                <Label htmlFor="maintenanceMode" className="text-warning">Enable Maintenance Mode</Label>
                <p className="text-sm text-warning/80">Users will see a maintenance message and be unable to access the platform</p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={watchMaintenanceMode}
                onCheckedChange={(checked) => setValue('maintenanceMode', checked, { shouldDirty: true })}
              />
            </div>
            {watchMaintenanceMode && (
              <div className="space-y-4 p-4 border rounded-lg bg-warning/10 border-warning">
                <div className="space-y-2">
                  <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                  <Textarea
                    id="maintenanceMessage"
                    {...register('maintenanceMessage')}
                    placeholder="We are currently performing scheduled maintenance. Please check back soon."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduledMaintenanceStart">Scheduled Start</Label>
                    <Input
                      id="scheduledMaintenanceStart"
                      type="datetime-local"
                      {...register('scheduledMaintenanceStart')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduledMaintenanceEnd">Scheduled End</Label>
                    <Input
                      id="scheduledMaintenanceEnd"
                      type="datetime-local"
                      {...register('scheduledMaintenanceEnd')}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
      </div>
    </DashboardContent>
  );
}
