'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useGetTenantById,
  useSuspendTenant,
  useActivateTenant,
  useGetTenantPlanDetails,
} from '@/api/generated/endpoints/tenant-management/tenant-management';
import {
  useStartImpersonation,
  useGetStatus,
} from '@/api/generated/endpoints/impersonation/impersonation';
import { useGetParticipants } from '@/api/generated/endpoints/participants/participants';
import type { TenantManagementDTO } from '@/api/generated/models';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  IconArrowLeft,
  IconBuilding,
  IconMail,
  IconPhone,
  IconMapPin,
  IconUsers,
  IconShield,
  IconBan,
  IconCircleCheck,
  IconAlertCircle,
  IconCalendar,
  IconClock,
  IconKey,
  IconFlag,
  IconSettings,
  IconChartPie,
  IconTrendingUp,
  IconFileText,
  IconActivity,
  IconLoader2,
  IconDatabase,
} from '@tabler/icons-react';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { formatEnum } from '@/lib/utils';

// Constants
const IMPERSONATION = {
  DEFAULT_DURATION_SECONDS: 3600, // 1 hour
  MIN_DURATION_SECONDS: 300, // 5 minutes
  MAX_DURATION_SECONDS: 28800, // 8 hours
};

// Impersonation form schema
const tenantImpersonationSchema = z.object({
  userEmail: z.string().email('Invalid email format'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(490, 'Reason must be less than 490 characters'),
  durationSeconds: z.number().int().min(300, 'Minimum duration is 5 minutes').max(28800, 'Maximum duration is 8 hours'),
  mfaToken: z.string().length(6, 'MFA token must be exactly 6 digits'),
});

type TenantImpersonationForm = z.infer<typeof tenantImpersonationSchema>;

/**
 * Tenant Details Page
 */
export default function TenantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [participantPage, setParticipantPage] = useState(0);
  const [participantSearch, setParticipantSearch] = useState('');

  // Queries
  const { data: tenant, refetch, isLoading } = useGetTenantById(tenantId);

  const { data: impersonationStatus } = useGetStatus({
    query: {
      retry: false,
      staleTime: 30000,
    },
  });

  // Fetch participants list when Participants tab is active
  const { data: participantsData, isLoading: participantsLoading } = useGetParticipants(
    {
      page: participantPage,
      size: 10,
      search: participantSearch || undefined,
    },
    {
      query: {
        enabled: activeTab === 'participants',
      },
    },
  );

  // Fetch plan configuration when Overview tab is active
  // Use tenant-management endpoint which supports super admin access to any tenant
  const { data: planDetailsArray, isLoading: planDetailsLoading } = useGetTenantPlanDetails(
    tenantId,
    {
      query: {
        enabled: activeTab === 'overview' && Boolean(tenant),
      },
    },
  );

  // Extract the first plan from the array (API returns CompanyPlanResponseDTO[])
  const planDetails = planDetailsArray?.[0];

  // Mutations
  const suspendMutation = useSuspendTenant();
  const activateMutation = useActivateTenant();
  const startImpersonationMutation = useStartImpersonation();

  // Impersonation form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TenantImpersonationForm>({
    resolver: zodResolver(tenantImpersonationSchema),
    defaultValues: {
      durationSeconds: IMPERSONATION.DEFAULT_DURATION_SECONDS,
    },
  });

  const onSuspendTenant = async () => {
    if (!suspendReason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }

    try {
      await suspendMutation.mutateAsync({
        id: tenantId,
        data: { reason: suspendReason },
      });
      toast.success('Tenant suspended successfully');
      setSuspendDialogOpen(false);
      setSuspendReason('');
      refetch();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to suspend tenant';
      toast.error(errorMessage);
    }
  };

  const onActivateTenant = async () => {
    try {
      await activateMutation.mutateAsync({ id: tenantId });
      toast.success('Tenant activated successfully');
      refetch();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate tenant';
      toast.error(errorMessage);
    }
  };

  const onStartImpersonation = async (data: TenantImpersonationForm) => {
    try {
      await startImpersonationMutation.mutateAsync({
        data: {
          userEmail: data.userEmail,
          tenantId: tenantId,
          reason: data.reason,
          durationSeconds: data.durationSeconds,
          mfaToken: data.mfaToken,
        },
      });

      toast.success('Impersonation started successfully');
      setImpersonateDialogOpen(false);
      reset();

      // Redirect to sponsor dashboard after successful impersonation
      router.push('/dashboard');
    } catch (error: unknown) {
      let errorMessage = 'Failed to start impersonation';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      const errorStr = String(error);
      if (errorStr.includes('500') || errorStr.includes('Server error')) {
        errorMessage = 'Server error: Unable to start impersonation. Please try again or contact support.';
      } else if (errorStr.includes('401') || errorStr.includes('Unauthorized')) {
        errorMessage = 'Unauthorized: Please check your MFA token and try again.';
      } else if (errorStr.includes('404')) {
        errorMessage = 'User not found: Please check the email address and try again.';
      }

      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-500/10 text-green-700 dark:text-green-400 ring-green-500/20',
      INACTIVE: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 ring-gray-500/20',
      SUSPENDED: 'bg-red-500/10 text-red-700 dark:text-red-400 ring-red-500/20',
      TRIAL: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-500/20',
    };
    return colors[status as keyof typeof colors] || colors.INACTIVE;
  };

  // Calculate participation rate
  const participationRate = tenant?.employeeCount && tenant?.participantCount
    ? ((tenant.participantCount / tenant.employeeCount) * 100).toFixed(1)
    : '0.0';

  if (isLoading) {
    return (
      <DashboardContent>
        <div className="space-y-8">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </DashboardContent>
    );
  }

  if (!tenant) {
    return (
      <DashboardContent>
        <div className="flex flex-col items-center justify-center py-12">
          <IconBuilding className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Tenant Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested tenant could not be found.</p>
          <Button onClick={() => router.push('/admin/tenants')}>
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenants
          </Button>
        </div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push('/admin/tenants')} variant="outline" size="sm">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{tenant.companyName}</h1>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadge(tenant.status || 'INACTIVE')}`}>
                  {formatEnum(tenant.status)}
                </span>
              </div>
              <p className="text-muted-foreground text-sm mt-1">Tenant ID: {tenant.tenantId || tenant.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/test-recordkeeping?tenantId=${tenant.tenantId || tenant.id}`)}
              className="border-primary/30 text-primary hover:bg-primary/5"
            >
              <IconDatabase className="h-4 w-4 mr-2" />
              Test Recordkeeping
            </Button>
            <Button
              variant="outline"
              onClick={() => setImpersonateDialogOpen(true)}
              disabled={Boolean((impersonationStatus as any)?.isImpersonating)}
              className="border-primary/30 text-primary hover:bg-primary/5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <IconShield className="h-4 w-4 mr-2" />
              Impersonate
            </Button>
            {tenant.status === 'ACTIVE' ? (
              <Button
                variant="outline"
                onClick={() => setSuspendDialogOpen(true)}
                className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              >
                <IconBan className="h-4 w-4 mr-2" />
                Suspend
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={onActivateTenant}
                className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
              >
                <IconCircleCheck className="h-4 w-4 mr-2" />
                Activate
              </Button>
            )}
          </div>
        </div>

        {/* Active Impersonation Warning */}
        {Boolean((impersonationStatus as any)?.isImpersonating) && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <IconAlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Active Impersonation Session</p>
                  <p className="text-xs text-muted-foreground">
                    You are currently impersonating a user. End the current session before starting a new one.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription</CardTitle>
              <IconKey className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenant.subscriptionTier || 'N/A'}</div>
              {tenant.expiresAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expires {format(new Date(tenant.expiresAt), 'MMM dd, yyyy')}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <IconUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenant.employeeCount?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Company workforce</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <IconChartPie className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenant.participantCount?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Plan participants</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
              <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{participationRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Enrollment percentage</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content - Comprehensive 4-tab layout */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <IconBuilding className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="participants">
              <IconUsers className="h-4 w-4 mr-2" />
              Participants
            </TabsTrigger>
            <TabsTrigger value="features">
              <IconFlag className="h-4 w-4 mr-2" />
              Features
            </TabsTrigger>
            <TabsTrigger value="activity">
              <IconActivity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconBuilding className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>Basic company details and registration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-muted-foreground">Company Name</span>
                      <span className="text-sm font-semibold text-right">{tenant.companyName}</span>
                    </div>
                    <div className="border-t my-2" />
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-muted-foreground">Tenant ID</span>
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{tenant.id}</span>
                    </div>
                    {tenant.tenantId && tenant.tenantId !== tenant.id && (
                      <>
                        <div className="border-t my-2" />
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-muted-foreground">Internal ID</span>
                          <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{tenant.tenantId}</span>
                        </div>
                      </>
                    )}
                    <div className="border-t my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">Status</span>
                      <Badge variant="outline">{formatEnum(tenant.status)}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconMail className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>Primary contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <IconMail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium break-all">{tenant.contactEmail}</p>
                    </div>
                  </div>
                  {tenant.contactPhone && (
                    <>
                      <div className="border-t my-2" />
                      <div className="flex items-start gap-3">
                        <IconPhone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">{tenant.contactPhone}</p>
                        </div>
                      </div>
                    </>
                  )}
                  {(tenant.address || tenant.city || tenant.state) && (
                    <>
                      <div className="border-t my-2" />
                      <div className="flex items-start gap-3">
                        <IconMapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Address</p>
                          <p className="text-sm font-medium">
                            {tenant.address && <span>{tenant.address}<br /></span>}
                            {tenant.city && tenant.state && <span>{tenant.city}, {tenant.state} {tenant.zipCode}</span>}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconCalendar className="h-5 w-5" />
                    Timeline
                  </CardTitle>
                  <CardDescription>Important dates and milestones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">Created</span>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {tenant.createdAt ? format(new Date(tenant.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                      {tenant.createdAt && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tenant.createdAt), 'h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                  {tenant.updatedAt && (
                    <>
                      <div className="border-t my-2" />
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(new Date(tenant.updatedAt), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tenant.updatedAt), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  {tenant.lastAccessedAt && (
                    <>
                      <div className="border-t my-2" />
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-muted-foreground">Last Accessed</span>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(new Date(tenant.lastAccessedAt), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tenant.lastAccessedAt), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Subscription Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconKey className="h-5 w-5" />
                    Subscription Details
                  </CardTitle>
                  <CardDescription>Plan and billing information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Plan Tier</span>
                    <span className="text-sm font-semibold">{tenant.subscriptionTier}</span>
                  </div>
                  {tenant.expiresAt && (
                    <>
                      <div className="border-t my-2" />
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-muted-foreground">Expires</span>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(new Date(tenant.expiresAt), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tenant.expiresAt) > new Date() ? `${Math.ceil((new Date(tenant.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining` : 'Expired'}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Plan Configurations */}
            {planDetailsLoading ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconSettings className="h-5 w-5" />
                    Plan Configuration
                  </CardTitle>
                  <CardDescription>Loading plan details...</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-8">
                    <IconLoader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                </CardContent>
              </Card>
            ) : planDetails ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconSettings className="h-5 w-5" />
                    Plan Configuration
                  </CardTitle>
                  <CardDescription>
                    401(k) plan design and contribution settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Plan Type & Status */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Plan Type & Status</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Plan Type</span>
                            <span className="text-sm font-medium text-right">
                              {planDetails.planTypeName || 'N/A'}
                            </span>
                          </div>
                          <div className="border-t" />
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Plan Name</span>
                            <span className="text-sm font-medium text-right">
                              {planDetails.planName || 'N/A'}
                            </span>
                          </div>
                          <div className="border-t" />
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <span className="text-sm font-medium text-right">
                              {formatEnum(planDetails.status) || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Eligibility Requirements */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Eligibility Requirements</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Minimum Age</span>
                            <span className="text-sm font-medium text-right">
                              {planDetails.eligibility?.minimumEntryAge !== undefined
                                ? `${planDetails.eligibility.minimumEntryAge} years`
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="border-t" />
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Time Employed</span>
                            <span className="text-sm font-medium text-right">
                              {planDetails.eligibility?.timeEmployedMonths !== undefined
                                ? `${planDetails.eligibility.timeEmployedMonths} months`
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Employee Contribution Settings */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Employee Contribution Settings</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Auto-Enrollment</span>
                            <span className="text-sm font-medium text-right">
                              {planDetails.employeeContributionConfig?.isAutoEnrollment ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="border-t" />
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Default Rate</span>
                            <span className="text-sm font-medium text-right">
                              {planDetails.employeeContributionConfig?.defaultContributionRate !== undefined
                                ? `${planDetails.employeeContributionConfig.defaultContributionRate}%`
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="border-t" />
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Annual Increase</span>
                            <span className="text-sm font-medium text-right">
                              {planDetails.employeeContributionConfig?.enrollmentAnnualIncrease !== undefined
                                ? `${planDetails.employeeContributionConfig.enrollmentAnnualIncrease}%`
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="border-t" />
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Max Rate</span>
                            <span className="text-sm font-medium text-right">
                              {planDetails.employeeContributionConfig?.enrollmentMaxRate !== undefined
                                ? `${planDetails.employeeContributionConfig.enrollmentMaxRate}%`
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="border-t" />
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Roth Support</span>
                            <span className="text-sm font-medium text-right">
                              {planDetails.employeeContributionConfig?.supportsRoth ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Employer Contribution */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Employer Contribution</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Rule Type</span>
                            <span className="text-sm font-medium text-right">
                              {formatEnum(planDetails.employerContributionRule?.ruleType) || 'N/A'}
                            </span>
                          </div>
                          <div className="border-t" />
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Match %</span>
                            <span className="text-sm font-medium text-right">
                              {planDetails.employerContributionRule?.matchPercentage !== undefined
                                ? `${planDetails.employerContributionRule.matchPercentage}%`
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="border-t" />
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Match Limit</span>
                            <span className="text-sm font-medium text-right">
                              {planDetails.employerContributionRule?.matchLimitPercent !== undefined
                                ? `${planDetails.employerContributionRule.matchLimitPercent}%`
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Exclusions */}
                  {planDetails.eligibility?.exclusions && planDetails.eligibility.exclusions.length > 0 && (
                    <>
                      <div className="border-t my-6" />
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Exclusions</h4>
                        <div className="flex flex-wrap gap-2">
                          {planDetails.eligibility.exclusions.map((exclusion, index) => (
                            <Badge key={index} variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                              {String(exclusion)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : tenant.customConfig && Object.keys(tenant.customConfig).length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconSettings className="h-5 w-5" />
                    Plan Configurations
                  </CardTitle>
                  <CardDescription>
                    Tenant-specific settings and plan configurations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs max-h-96">
                    {JSON.stringify(tenant.customConfig, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Total Employees</CardTitle>
                  <CardDescription>Company workforce size</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{tenant.employeeCount?.toLocaleString() || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Participants</CardTitle>
                  <CardDescription>Enrolled in retirement plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-600">{tenant.participantCount?.toLocaleString() || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Participation Rate</CardTitle>
                  <CardDescription>Enrollment percentage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-600">{participationRate}%</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Participant List</CardTitle>
                    <CardDescription>Detailed list of all participants</CardDescription>
                  </div>
                  <Input
                    placeholder="Search by name..."
                    value={participantSearch}
                    onChange={(e) => {
                      setParticipantSearch(e.target.value);
                      setParticipantPage(0);
                    }}
                    className="max-w-xs"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {participantsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !participantsData?.content || participantsData.content.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <IconUsers className="h-12 w-12 text-muted-foreground mb-3 opacity-20" />
                    <p className="text-sm text-muted-foreground">
                      {participantSearch ? 'No participants found matching your search' : 'No participants found'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account #</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Portfolio Type</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead className="text-right">Deferral Rate</TableHead>
                            <TableHead className="text-right">Roth Rate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {participantsData.content.map((participant: any) => (
                            <TableRow key={participant.accountNumber}>
                              <TableCell className="font-mono text-xs">
                                {participant.accountNumber || 'N/A'}
                              </TableCell>
                              <TableCell className="font-medium">{participant.name || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    participant.status === 'ACTIVE'
                                      ? 'default'
                                      : participant.status === 'TERMINATED'
                                      ? 'destructive'
                                      : 'secondary'
                                  }
                                >
                                  {formatEnum(participant.status) || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>{participant.portfolioType || 'N/A'}</TableCell>
                              <TableCell className="text-right font-medium">
                                {participant.balance
                                  ? `$${participant.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : '$0.00'}
                              </TableCell>
                              <TableCell className="text-right">
                                {participant.employeeDeferralRate !== undefined
                                  ? `${participant.employeeDeferralRate}%`
                                  : 'N/A'}
                              </TableCell>
                              <TableCell className="text-right">
                                {participant.employeeRothContributionRate !== undefined
                                  ? `${participant.employeeRothContributionRate}%`
                                  : 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {(participantsData.totalPages ?? 0) > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Showing {(participantsData.number ?? 0) * (participantsData.size ?? 10) + 1} to{' '}
                          {Math.min(
                            ((participantsData.number ?? 0) + 1) * (participantsData.size ?? 10),
                            participantsData.totalElements ?? 0,
                          )}{' '}
                          of {participantsData.totalElements ?? 0} participants
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setParticipantPage((p) => Math.max(0, p - 1))}
                            disabled={participantPage === 0}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setParticipantPage((p) => p + 1)}
                            disabled={participantPage >= (participantsData.totalPages ?? 1) - 1}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconFlag className="h-5 w-5" />
                  Enabled Features
                </CardTitle>
                <CardDescription>
                  Features and capabilities available for this tenant
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tenant.features && tenant.features.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tenant.features.map((feature: string, index: number) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                      >
                        {formatEnum(feature)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <IconFlag className="h-12 w-12 mx-auto opacity-20 mb-4" />
                    <p>No features configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconActivity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Tenant access and activity history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tenant.lastAccessedAt ? (
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <IconClock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Last Access</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(tenant.lastAccessedAt), 'MMMM dd, yyyy at h:mm a')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <IconActivity className="h-12 w-12 mx-auto opacity-20 mb-4" />
                      <p>No activity data available</p>
                    </div>
                  )}

                  {tenant.createdAt && (
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <IconCircleCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Tenant Created</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(tenant.createdAt), 'MMMM dd, yyyy at h:mm a')}
                        </p>
                      </div>
                    </div>
                  )}

                  {tenant.updatedAt && tenant.updatedAt !== tenant.createdAt && (
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <IconFileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Last Updated</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(tenant.updatedAt), 'MMMM dd, yyyy at h:mm a')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Suspend Tenant Dialog */}
        <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend Tenant</DialogTitle>
              <DialogDescription>
                Please provide a reason for suspending {tenant.companyName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="suspendReason">Reason for Suspension</Label>
                <Textarea
                  id="suspendReason"
                  placeholder="Provide a detailed reason..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setSuspendDialogOpen(false); setSuspendReason(''); }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={onSuspendTenant} disabled={!suspendReason.trim() || suspendMutation.isPending}>
                Suspend Tenant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Impersonate User Dialog */}
        <Dialog open={impersonateDialogOpen} onOpenChange={setImpersonateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <IconShield className="h-6 w-6 text-blue-600" />
                Impersonate User in {tenant.companyName}
              </DialogTitle>
              <DialogDescription className="text-base">
                Start an impersonation session to access this tenant&apos;s data as a specific user
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onStartImpersonation)} className="space-y-6 py-4">
              <div className="space-y-3">
                <Label htmlFor="userEmail" className="text-sm font-semibold">
                  User Email <span className="text-red-600">*</span>
                </Label>
                <Input id="userEmail" type="email" placeholder="user@example.com" {...register('userEmail')} />
                {errors.userEmail && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <IconAlertCircle className="h-4 w-4" />
                    {errors.userEmail.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Enter the email address of the user in this tenant you want to impersonate
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="durationSeconds" className="text-sm font-semibold">
                    Duration (seconds) <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="durationSeconds"
                    type="number"
                    min={IMPERSONATION.MIN_DURATION_SECONDS}
                    max={IMPERSONATION.MAX_DURATION_SECONDS}
                    {...register('durationSeconds', { valueAsNumber: true })}
                  />
                  {errors.durationSeconds && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <IconAlertCircle className="h-4 w-4" />
                      {errors.durationSeconds.message}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <IconClock className="h-4 w-4" />
                    Default: 1 hour (3600s) • Min: 5 min • Max: 8 hours
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="mfaToken" className="text-sm font-semibold">
                    MFA Token <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="mfaToken"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    className="font-mono tracking-widest text-center text-lg"
                    {...register('mfaToken')}
                  />
                  {errors.mfaToken && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <IconAlertCircle className="h-4 w-4" />
                      {errors.mfaToken.message}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="reason" className="text-sm font-semibold">
                  Reason for Impersonation <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="reason"
                  rows={4}
                  placeholder="Provide a detailed reason for this impersonation session (required for audit purposes)..."
                  {...register('reason')}
                />
                {errors.reason && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <IconAlertCircle className="h-4 w-4" />
                    {errors.reason.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  This reason will be logged and may be reviewed during security audits
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setImpersonateDialogOpen(false); reset(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={startImpersonationMutation.isPending}>
                  <IconShield className="mr-2 h-4 w-4" />
                  Start Impersonation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardContent>
  );
}
