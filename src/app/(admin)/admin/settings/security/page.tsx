'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Lock,
  Key,
  Shield,
  Clock,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetConfigurationByKey,
  useUpdateConfiguration
} from '@/api/generated/endpoints/platform-configuration/platform-configuration';

const CONFIG_KEY = 'security_config';

const securityConfigSchema = z.object({
  // Password Policy
  minPasswordLength: z.number().min(8).max(32),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSpecialChars: z.boolean(),
  passwordExpiryDays: z.number().min(0).max(365),
  passwordHistoryCount: z.number().min(0).max(24),

  // Session Management
  sessionTimeoutMinutes: z.number().min(5).max(1440),
  maxConcurrentSessions: z.number().min(1).max(10),
  enforceSessionTimeout: z.boolean(),
  extendSessionOnActivity: z.boolean(),

  // Account Lockout
  maxLoginAttempts: z.number().min(3).max(10),
  lockoutDurationMinutes: z.number().min(5).max(1440),
  enableAccountLockout: z.boolean(),
  notifyOnLockout: z.boolean(),

  // Two-Factor Authentication
  requireMfaForAdmins: z.boolean(),
  requireMfaForSuperadmins: z.boolean(),
  allowRememberDevice: z.boolean(),
  rememberDeviceDays: z.number().min(1).max(90),

  // IP & Access Control
  enableIpWhitelist: z.boolean(),
  whitelistedIps: z.string(),
  blockSuspiciousIps: z.boolean(),
  enableGeoBlocking: z.boolean(),

  // Audit & Logging
  enableAuditLogs: z.boolean(),
  auditLogRetentionDays: z.number().min(30).max(2555),
  logSensitiveOperations: z.boolean(),
  enableRealTimeAlerts: z.boolean(),
});

type SecurityConfigForm = z.infer<typeof securityConfigSchema>;

const defaultValues: SecurityConfigForm = {
  // Password Policy
  minPasswordLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  passwordExpiryDays: 90,
  passwordHistoryCount: 12,

  // Session Management
  sessionTimeoutMinutes: 30,
  maxConcurrentSessions: 3,
  enforceSessionTimeout: true,
  extendSessionOnActivity: true,

  // Account Lockout
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 30,
  enableAccountLockout: true,
  notifyOnLockout: true,

  // Two-Factor Authentication
  requireMfaForAdmins: true,
  requireMfaForSuperadmins: true,
  allowRememberDevice: true,
  rememberDeviceDays: 30,

  // IP & Access Control
  enableIpWhitelist: false,
  whitelistedIps: '',
  blockSuspiciousIps: true,
  enableGeoBlocking: false,

  // Audit & Logging
  enableAuditLogs: true,
  auditLogRetentionDays: 365,
  logSensitiveOperations: true,
  enableRealTimeAlerts: true,
};

export default function SecuritySettingsPage() {
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
        toast.success('Security configuration saved successfully');
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to save security configuration';
        toast.error(message);
      },
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<SecurityConfigForm>({
    resolver: zodResolver(securityConfigSchema),
    defaultValues,
  });

  useEffect(() => {
    if (configData?.configValue) {
      try {
        const savedConfig = JSON.parse(configData.configValue) as Partial<SecurityConfigForm>;
        const mergedConfig = { ...defaultValues, ...savedConfig };
        reset(mergedConfig);
      } catch (error) {
        console.error('Error parsing config:', error);
      }
    }
  }, [configData, reset]);

  const onSubmit = async (data: SecurityConfigForm) => {
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

  if (isLoading) {
    return (
      <DashboardContent>
        <div className="space-y-8 max-w-6xl">
          <div className="space-y-4">
            <Button
              onClick={() => router.push('/admin/settings')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <Skeleton className="h-7 w-56 mb-2" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map((j) => (
                      <div key={j} className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((j) => (
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
        {/* Header */}
        <div className="space-y-4">
          <Button
            onClick={() => router.push('/admin/settings')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Security Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Password policies, session management, and security rules
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Password Policy */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Password Policy
            </CardTitle>
            <CardDescription>
              Define password requirements and expiration rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minPasswordLength">Minimum Password Length</Label>
                <Input
                  id="minPasswordLength"
                  type="number"
                  min={8}
                  max={32}
                  {...register('minPasswordLength', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 12+ characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordExpiryDays">Password Expiry (Days)</Label>
                <Input
                  id="passwordExpiryDays"
                  type="number"
                  min={0}
                  max={365}
                  {...register('passwordExpiryDays', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Set to 0 for no expiry
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordHistoryCount">Password History Count</Label>
                <Input
                  id="passwordHistoryCount"
                  type="number"
                  min={0}
                  max={24}
                  {...register('passwordHistoryCount', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Prevent reuse of last N passwords
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Require Uppercase Letters</Label>
                <Switch
                  checked={watch('requireUppercase')}
                  onCheckedChange={(checked) => setValue('requireUppercase', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Require Lowercase Letters</Label>
                <Switch
                  checked={watch('requireLowercase')}
                  onCheckedChange={(checked) => setValue('requireLowercase', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Require Numbers</Label>
                <Switch
                  checked={watch('requireNumbers')}
                  onCheckedChange={(checked) => setValue('requireNumbers', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Require Special Characters</Label>
                <Switch
                  checked={watch('requireSpecialChars')}
                  onCheckedChange={(checked) => setValue('requireSpecialChars', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Management */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Session Management
            </CardTitle>
            <CardDescription>
              Control user session behavior and timeouts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeoutMinutes">Session Timeout (Minutes)</Label>
                <Input
                  id="sessionTimeoutMinutes"
                  type="number"
                  min={5}
                  max={1440}
                  {...register('sessionTimeoutMinutes', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxConcurrentSessions">Max Concurrent Sessions</Label>
                <Input
                  id="maxConcurrentSessions"
                  type="number"
                  min={1}
                  max={10}
                  {...register('maxConcurrentSessions', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enforce Session Timeout</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically log out inactive users
                  </p>
                </div>
                <Switch
                  checked={watch('enforceSessionTimeout')}
                  onCheckedChange={(checked) => setValue('enforceSessionTimeout', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Extend Session on Activity</Label>
                  <p className="text-xs text-muted-foreground">
                    Reset timeout on user activity
                  </p>
                </div>
                <Switch
                  checked={watch('extendSessionOnActivity')}
                  onCheckedChange={(checked) => setValue('extendSessionOnActivity', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Lockout */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Account Lockout
            </CardTitle>
            <CardDescription>
              Protect against brute force attacks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Account Lockout</Label>
                <p className="text-xs text-muted-foreground">
                  Lock accounts after failed login attempts
                </p>
              </div>
              <Switch
                checked={watch('enableAccountLockout')}
                onCheckedChange={(checked) => setValue('enableAccountLockout', checked)}
              />
            </div>

            {watch('enableAccountLockout') && (
              <div className="grid gap-6 md:grid-cols-2 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min={3}
                    max={10}
                    {...register('maxLoginAttempts', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lockoutDurationMinutes">Lockout Duration (Minutes)</Label>
                  <Input
                    id="lockoutDurationMinutes"
                    type="number"
                    min={5}
                    max={1440}
                    {...register('lockoutDurationMinutes', { valueAsNumber: true })}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notify on Lockout</Label>
                <p className="text-xs text-muted-foreground">
                  Send email alert when account is locked
                </p>
              </div>
              <Switch
                checked={watch('notifyOnLockout')}
                onCheckedChange={(checked) => setValue('notifyOnLockout', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Configure MFA requirements for different user roles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require MFA for Admins</Label>
                  <p className="text-xs text-muted-foreground">
                    Mandate 2FA for all admin users
                  </p>
                </div>
                <Switch
                  checked={watch('requireMfaForAdmins')}
                  onCheckedChange={(checked) => setValue('requireMfaForAdmins', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require MFA for Super Admins</Label>
                  <p className="text-xs text-muted-foreground">
                    Mandate 2FA for super admin access
                  </p>
                </div>
                <Switch
                  checked={watch('requireMfaForSuperadmins')}
                  onCheckedChange={(checked) => setValue('requireMfaForSuperadmins', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Remember Device</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow users to trust devices for a period
                  </p>
                </div>
                <Switch
                  checked={watch('allowRememberDevice')}
                  onCheckedChange={(checked) => setValue('allowRememberDevice', checked)}
                />
              </div>

              {watch('allowRememberDevice') && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="rememberDeviceDays">Remember Device Duration (Days)</Label>
                  <Input
                    id="rememberDeviceDays"
                    type="number"
                    min={1}
                    max={90}
                    {...register('rememberDeviceDays', { valueAsNumber: true })}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* IP & Access Control */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              IP & Access Control
            </CardTitle>
            <CardDescription>
              Restrict access based on IP addresses and location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable IP Whitelist</Label>
                  <p className="text-xs text-muted-foreground">
                    Only allow access from specific IPs
                  </p>
                </div>
                <Switch
                  checked={watch('enableIpWhitelist')}
                  onCheckedChange={(checked) => setValue('enableIpWhitelist', checked)}
                />
              </div>

              {watch('enableIpWhitelist') && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="whitelistedIps">Whitelisted IPs (comma-separated)</Label>
                  <Input
                    id="whitelistedIps"
                    placeholder="192.168.1.1, 10.0.0.0/24"
                    {...register('whitelistedIps')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports CIDR notation
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Block Suspicious IPs</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically block known malicious IPs
                  </p>
                </div>
                <Switch
                  checked={watch('blockSuspiciousIps')}
                  onCheckedChange={(checked) => setValue('blockSuspiciousIps', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Geo-Blocking</Label>
                  <p className="text-xs text-muted-foreground">
                    Restrict access by geographic location
                  </p>
                </div>
                <Switch
                  checked={watch('enableGeoBlocking')}
                  onCheckedChange={(checked) => setValue('enableGeoBlocking', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit & Logging */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Audit & Logging
            </CardTitle>
            <CardDescription>
              Configure security audit trails and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Audit Logs</Label>
                  <p className="text-xs text-muted-foreground">
                    Track all security-related events
                  </p>
                </div>
                <Switch
                  checked={watch('enableAuditLogs')}
                  onCheckedChange={(checked) => setValue('enableAuditLogs', checked)}
                />
              </div>

              {watch('enableAuditLogs') && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="auditLogRetentionDays">Log Retention (Days)</Label>
                  <Input
                    id="auditLogRetentionDays"
                    type="number"
                    min={30}
                    max={2555}
                    {...register('auditLogRetentionDays', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Compliance requires 7 years (2555 days) for financial records
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Log Sensitive Operations</Label>
                  <p className="text-xs text-muted-foreground">
                    Track access to sensitive data and operations
                  </p>
                </div>
                <Switch
                  checked={watch('logSensitiveOperations')}
                  onCheckedChange={(checked) => setValue('logSensitiveOperations', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Real-Time Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified of suspicious activities immediately
                  </p>
                </div>
                <Switch
                  checked={watch('enableRealTimeAlerts')}
                  onCheckedChange={(checked) => setValue('enableRealTimeAlerts', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/settings')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateConfigMutation.isPending}
          >
            {updateConfigMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
          </div>
        </form>
      </div>
    </DashboardContent>
  );
}
