'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useStartImpersonation,
  useEndImpersonation,
  useGetStatus,
} from '@/api/generated/endpoints/impersonation/impersonation';
import { useGetAllTenants } from '@/api/generated/endpoints/tenant-management/tenant-management';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconShield, IconAlertCircle, IconCircleCheck, IconLogout } from '@tabler/icons-react';
import { toast } from '@/lib/toast';
import { DashboardContent } from '@/components/layout/dashboard-layout';

// Constants
const PAGINATION = {
  MAX_TENANTS_FETCH: 1000,
};

const IMPERSONATION = {
  DEFAULT_DURATION_SECONDS: 3600, // 1 hour
  MIN_DURATION_SECONDS: 300, // 5 minutes
  MAX_DURATION_SECONDS: 28800, // 8 hours
  MFA_TOKEN_LENGTH: 6,
};

// Validation schema
const startImpersonationSchema = z.object({
  tenantId: z.string().min(1, 'Tenant is required'),
  userId: z.string().optional(),
  userEmail: z.string().email('Valid email is required').min(1, 'User email is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  durationSeconds: z
    .number()
    .min(IMPERSONATION.MIN_DURATION_SECONDS, `Duration must be at least ${IMPERSONATION.MIN_DURATION_SECONDS} seconds`)
    .max(IMPERSONATION.MAX_DURATION_SECONDS, `Duration must not exceed ${IMPERSONATION.MAX_DURATION_SECONDS} seconds`),
  allowedActions: z.array(z.string()).optional(),
  mfaToken: z.string().length(IMPERSONATION.MFA_TOKEN_LENGTH, `MFA token must be exactly ${IMPERSONATION.MFA_TOKEN_LENGTH} digits`),
});

type StartImpersonationFormData = z.infer<typeof startImpersonationSchema>;

// Type for impersonation status response
interface ImpersonationStatus {
  isImpersonating: boolean;
  session?: {
    id?: string;
    impersonatedUserEmail?: string;
    tenantId?: string;
    superAdminEmail?: string;
    superAdminRole?: string;
    reason?: string;
    startedAt?: string;
    expiresAt?: string;
    isActive?: boolean;
    remainingSeconds?: number;
  };
}

export default function ImpersonationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Fetch current status
  const {
    data: status,
    refetch: refetchStatus,
    isError: statusError,
  } = useGetStatus({
    query: {
      retry: false,
      staleTime: 30000,
    },
  });

  // Fetch all tenants
  const {
    data: tenantsData,
    isLoading: tenantsLoading,
    isError: tenantsError,
  } = useGetAllTenants(
    {
      pageable: { page: 0, size: PAGINATION.MAX_TENANTS_FETCH },
    },
    {
      query: {
        retry: false,
        staleTime: 60000,
      },
    }
  );

  // Mutations
  const startMutation = useStartImpersonation();
  const endMutation = useEndImpersonation();

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<StartImpersonationFormData>({
    resolver: zodResolver(startImpersonationSchema),
    mode: 'onSubmit',
    defaultValues: {
      durationSeconds: IMPERSONATION.DEFAULT_DURATION_SECONDS,
    },
  });

  const tenants = tenantsData?.content || [];

  // Safely cast status to ImpersonationStatus
  const impersonationStatus = status as unknown as ImpersonationStatus | undefined;

  const onStartImpersonation = async (data: StartImpersonationFormData) => {
    setLoading(true);
    try {
      await startMutation.mutateAsync({
        data: {
          userId: data.userId || undefined,
          userEmail: data.userEmail || undefined,
          tenantId: data.tenantId,
          reason: data.reason,
          durationSeconds: data.durationSeconds,
          allowedActions: data.allowedActions,
          mfaToken: data.mfaToken,
        },
      });

      toast.success('Impersonation started', 'Impersonation session started successfully');
      refetchStatus();
      reset();

      // Redirect to sponsor dashboard after successful impersonation
      router.push('/dashboard');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to start impersonation';
      toast.error('Impersonation failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onEndImpersonation = async () => {
    setLoading(true);
    try {
      const sessionId = impersonationStatus?.session?.id ? String(impersonationStatus.session.id) : undefined;
      
      await endMutation.mutateAsync({
        data: {
          sessionId,
          reason: 'Manual end by super admin',
        },
      });

      toast.success('Session ended', 'Impersonation session ended successfully');
      refetchStatus();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to end impersonation';
      toast.error('End session failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardContent>
      <div className="space-y-6 max-w-2xl">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Impersonation Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Start or end user impersonation sessions
          </p>
        </div>

        {/* Current Status */}
        {!!impersonationStatus?.isImpersonating && (
          <Card className="border-2 border-warning bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconShield className="h-5 w-5 text-warning" />
                Active Impersonation Session
              </CardTitle>
              <CardDescription>
                You are currently impersonating a user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Super Admin:</span>
                  <span className="text-muted-foreground">{String(impersonationStatus?.session?.superAdminEmail || 'N/A')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Impersonating:</span>
                  <span className="text-muted-foreground">{String(impersonationStatus?.session?.impersonatedUserEmail || 'N/A')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Session ID:</span>
                  <span className="font-mono text-xs text-muted-foreground">{String(impersonationStatus?.session?.id || 'N/A')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Tenant ID:</span>
                  <span className="font-mono text-xs text-muted-foreground">{String(impersonationStatus?.session?.tenantId || 'N/A')}</span>
                </div>
              </div>

              <Button
                onClick={onEndImpersonation}
                disabled={loading}
                loading={loading}
                variant="destructive"
                className="w-full"
              >
                <IconLogout className="mr-2 h-4 w-4" />
                End Impersonation Session
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Start Impersonation Form */}
        {!impersonationStatus?.isImpersonating && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconShield className="h-5 w-5" />
                Start Impersonation Session
              </CardTitle>
              <CardDescription>
                Select a tenant and user to impersonate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onStartImpersonation)} className="space-y-4">
                {/* Tenant Selection */}
                <div className="space-y-2">
                  <Label htmlFor="tenantId">
                    Select Tenant <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="tenantId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          id="tenantId"
                          disabled={tenantsLoading || tenantsError}
                        >
                          <SelectValue
                            placeholder={
                              tenantsLoading
                                ? 'Loading tenants...'
                                : tenantsError
                                ? 'Error loading tenants'
                                : 'Select a tenant'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {tenantsError ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              Unable to load tenants. Please try again.
                            </div>
                          ) : tenants.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              No tenants available
                            </div>
                          ) : (
                            tenants.map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id || ''}>
                                {tenant.companyName} ({tenant.contactEmail})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.tenantId && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <IconAlertCircle className="h-3 w-3" />
                      {errors.tenantId.message}
                    </p>
                  )}
                  {!!tenantsError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <IconAlertCircle className="h-3 w-3" />
                      Unable to load tenants from the server. Please try again later.
                    </p>
                  )}
                </div>

                {/* User Email */}
                <div className="space-y-2">
                  <Label htmlFor="userEmail">
                    User Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="user@example.com"
                    {...register('userEmail')}
                  />
                  {errors.userEmail && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <IconAlertCircle className="h-3 w-3" />
                      {errors.userEmail.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enter the email address of the user you want to impersonate
                  </p>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">
                    Reason <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Provide a detailed reason for impersonation..."
                    rows={3}
                    {...register('reason')}
                  />
                  {errors.reason && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <IconAlertCircle className="h-3 w-3" />
                      {errors.reason.message}
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="durationSeconds">
                    Duration (seconds) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="durationSeconds"
                    type="number"
                    min={IMPERSONATION.MIN_DURATION_SECONDS}
                    max={IMPERSONATION.MAX_DURATION_SECONDS}
                    placeholder={String(IMPERSONATION.DEFAULT_DURATION_SECONDS)}
                    {...register('durationSeconds', { valueAsNumber: true })}
                  />
                  {errors.durationSeconds && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <IconAlertCircle className="h-3 w-3" />
                      {errors.durationSeconds.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Minimum: 5 minutes ({IMPERSONATION.MIN_DURATION_SECONDS}s), Maximum: 8 hours ({IMPERSONATION.MAX_DURATION_SECONDS}s)
                  </p>
                </div>

                {/* MFA Token */}
                <div className="space-y-2">
                  <Label htmlFor="mfaToken">
                    MFA Token <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="mfaToken"
                    type="text"
                    maxLength={IMPERSONATION.MFA_TOKEN_LENGTH}
                    placeholder="123456"
                    {...register('mfaToken')}
                  />
                  {errors.mfaToken && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <IconAlertCircle className="h-3 w-3" />
                      {errors.mfaToken.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => reset()}
                    disabled={loading}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    loading={loading}
                  >
                    <IconShield className="mr-2 h-4 w-4" />
                    Start Impersonation
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconCircleCheck className="h-4 w-4 text-primary" />
              Security Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1 pt-0">
            <p>All impersonation sessions are logged and audited</p>
            <p>A valid reason must be provided for compliance</p>
            <p>Sessions automatically expire after the specified duration</p>
            <p>MFA verification may be required based on security settings</p>
          </CardContent>
        </Card>
      </div>
    </DashboardContent>
  );
}
