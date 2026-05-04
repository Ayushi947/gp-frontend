'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  IconSettings,
  IconBuilding,
  IconClipboardList,
  IconUsers,
  IconKey,
  IconLink,
  IconLock,
  IconEdit,
  IconCheck,
  IconX,
  IconPlus,
  IconTrash,
  IconRefresh,
  IconShieldCheck,
  IconBell,
  IconLoader2,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatEnum, cn } from '@/lib/utils';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { toast } from '@/lib/toast';
import { useSyncEmployees } from '@/api/generated/endpoints/finch-data-integration/finch-data-integration';
import { getFinchRedirectUrl } from '@/api/generated/endpoints/finch-oauth-authentication/finch-oauth-authentication';
import { useGetDetails } from '@/api/generated/endpoints/plan-sponsor-details/plan-sponsor-details';
import type { AdministratorDTO } from '@/api/generated/models/administratorDTO';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string>('company');
  const [isEditing, setIsEditing] = useState(false);

  // Fetch company details with plan design from API
  const {
    data: companyData,
    isLoading,
    isError,
    refetch,
  } = useGetDetails();

  const companyDetails = companyData?.companyDetails;
  const planDesign = companyData?.planDesign;
  const administrators: AdministratorDTO[] = companyData?.administrators || [];
  const btPassportCredentials = companyData?.btPassportCredentials;
  const lastSyncTimestamp = companyData?.lastSyncTimestamp;

  const type = planDesign?.employerContributionType?.trim();
  const percent = planDesign?.employerContributionPercent;

  // Format business address
  const businessAddress = companyDetails?.businessAddress
    ? `${companyDetails.businessAddress.street || ''}, ${companyDetails.businessAddress.city || ''}, ${companyDetails.businessAddress.state || ''} ${companyDetails.businessAddress.postalCode || ''}`.trim().replace(/^,\s*/, '')
    : 'Not provided';

  const syncEmployeesMutation = useSyncEmployees();

  const handleSave = () => {
    setIsEditing(false);
    toast.success('Settings updated successfully');
  };

  const handleCancel = () => {
    setIsEditing(false);
    toast.info('Changes discarded');
  };

  const handleSyncNow = () => {
    syncEmployeesMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Sync started', 'Employee data is being synced in the background.');
      },
      onError: (error: unknown) => {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(
          'Sync failed',
          err?.response?.data?.message || 'Failed to start employee sync. Please try again.'
        );
      },
    });
  };

  const handleManageConnection = async () => {
    try {
      const response = await getFinchRedirectUrl();
      if (response.url) {
        // Redirect to Finch for reauthorization/management
        window.location.href = response.url;
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        'Connection management failed',
        err?.response?.data?.message || 'Failed to manage Finch connection. Please try again.'
      );
    }
  };

  const hasEmployerContribution =
      planDesign?.employerContributionType != null &&
      planDesign?.employerContributionPercent != null;

  return (
    <DashboardContent>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <IconSettings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your plan configuration and preferences
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <IconRefresh className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading settings...</span>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center">
              <IconAlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load settings</h3>
              <p className="text-muted-foreground mb-4">
                Unable to fetch company details. Please try again.
              </p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs - Only show when not loading and no error */}
      {!isLoading && !isError && (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="company" className="gap-2">
            <IconBuilding className="h-4 w-4" />
            <span className="hidden sm:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="gap-2">
            <IconClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Plan Design</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <IconUsers className="h-4 w-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <IconLink className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <IconLock className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Info Tab */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Your business details and configuration</CardDescription>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                  <IconEdit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm">
                    <IconCheck className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={handleCancel} size="sm" variant="outline">
                    <IconX className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  {isEditing ? (
                    <Input id="businessName" defaultValue={companyDetails?.legalName || ''} />
                  ) : (
                    <p className="text-sm font-medium">{companyDetails?.legalName || 'Not provided'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entityType">Entity Type</Label>
                  {isEditing ? (
                    <Input id="entityType" defaultValue={companyDetails?.entityType || ''} />
                  ) : (
                    <p className="text-sm font-medium">{companyDetails?.entityType || 'Not provided'}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  {isEditing ? (
                    <Input id="businessAddress" defaultValue={businessAddress} />
                  ) : (
                    <p className="text-sm font-medium">{businessAddress}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedEmployees">Estimated Employees</Label>
                  {isEditing ? (
                    <Input id="estimatedEmployees" type="number" defaultValue={companyDetails?.estimatedEmployeeCount || ''} />
                  ) : (
                    <p className="text-sm font-medium">{companyDetails?.estimatedEmployeeCount ?? 'Not provided'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payrollSchedule">Payroll Schedule</Label>
                  {isEditing ? (
                    <Input id="payrollSchedule" defaultValue={companyDetails?.payrollSchedule?.schedule || ''} />
                  ) : (
                    <p className="text-sm font-medium">{companyDetails?.payrollSchedule?.schedule || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan Settings</CardTitle>
              <CardDescription>Basic plan configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Payroll Provider</p>
                  <p className="text-sm text-muted-foreground">Your connected payroll system</p>
                </div>
                <Badge variant="outline">{companyDetails?.payrollProvider || 'Not connected'}</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Existing retirement plan</p>
                  <p className="text-sm text-muted-foreground">Do you have an existing 401(k) plan?</p>
                </div>
                <Badge variant="outline">{companyDetails?.existingRetirementPlan ? 'Yes' : 'No'}</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Related entities</p>
                  <p className="text-sm text-muted-foreground">Any related business entities</p>
                </div>
                <Badge variant="outline">{companyDetails?.relatedEntities ? 'Yes' : 'No'}</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plan Design Tab */}
        <TabsContent value="plan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan Type & Configuration</CardTitle>
              <CardDescription>Your 401(k) plan design and contribution arrangement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Plan Type</p>
                  <p className="text-xl font-semibold">{planDesign?.planType || 'Not configured'}</p>
                </div>
                <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Contribution Arrangement</p>
                  <p className="text-xl font-semibold">{planDesign?.contributionArrangement || 'Not configured'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eligibility Requirements</CardTitle>
              <CardDescription>Criteria for plan participation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Minimum Age</p>
                    <p className="text-sm text-muted-foreground">Required age to participate</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold">{planDesign?.minimumAge}</p>
                    <p className="text-xs text-muted-foreground">years</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Service Requirement</p>
                    <p className="text-sm text-muted-foreground">Time employed before eligibility</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{planDesign?.timeEmployed ?? '0'}</p>
                    <p className="text-xs text-muted-foreground">months</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Exclusions</p>
                    <p className="text-sm text-muted-foreground">Employee categories excluded from plan</p>
                  </div>
                  <Badge variant="outline">{planDesign?.exclusions?.length ? planDesign.exclusions.join(', ') : 'None'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auto-Enrollment Settings</CardTitle>
              <CardDescription>Automatic enrollment configuration for new employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">

                {/* Default Deferral Rate */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">Default Deferral Rate</p>
                    <p className="text-sm text-muted-foreground">
                      Initial contribution percentage for auto-enrolled employees
                    </p>
                  </div>
                  <div className="text-right">
                    {planDesign?.defaultDeferralPercent != null ? (
                        <p className="text-3xl font-bold text-primary">
                          {planDesign.defaultDeferralPercent}%
                        </p>
                    ) : (
                        <p className="text-base italic text-muted-foreground">
                         None
                        </p>
                    )}
                  </div>
                </div>

                {/* Annual Auto-Increase */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">Annual Auto-Increase</p>
                    <p className="text-sm text-muted-foreground">
                      Automatic yearly increase until reaching cap
                    </p>
                  </div>
                  <div className="text-right">
                    {planDesign?.annualIncreasePercent != null ? (
                        <>
                          <p className="text-xl font-semibold text-foreground">
                            +{planDesign.annualIncreasePercent}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            until {planDesign?.maxDeferralPercent != null
                              ? `${planDesign.maxDeferralPercent}%`
                              : 'None'}
                          </p>
                        </>
                    ) : (
                        <p className="text-base italic text-muted-foreground">
                          None
                        </p>
                    )}
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employer Contribution</CardTitle>
              <CardDescription>Company matching and contribution details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-start gap-3">
                    <IconCheck className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold text-green-900 mb-1">
                        {type
                            ? type.includes('%')
                                ? type
                                : percent != null
                                    ? `${type} (${percent}%)`
                                    : type
                            : 'No Employer Contribution'}
                      </p>
                      <p className="text-sm text-green-700">
                        Employer matches employee contributions
                      </p>
                    </div>
                  </div>
                </div>

                {/* 🔥 Hide this entire section if no contribution */}
                {hasEmployerContribution && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <div className="p-4 border rounded-lg bg-muted/20">
                        <p className="text-sm text-muted-foreground mb-1">Match Percentage</p>
                        <p className="text-2xl font-semibold text-foreground">
                          {planDesign.employerContributionPercent}%
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg bg-muted/20">
                        <p className="text-sm text-muted-foreground mb-1">Vesting Schedule</p>
                        <p className="text-2xl font-semibold text-foreground">
                          {planDesign.vestingSchedule}
                        </p>
                      </div>

                    </div>
                )}

              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Plan Administrators</CardTitle>
                <CardDescription>Manage team members who can access and administer the plan</CardDescription>
              </div>
              <Button size="sm">
                <IconPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {administrators.length > 0 ? (
                  administrators.map((admin, index) => (
                    <div key={admin.email || index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {admin.name ? admin.name.split(' ').map(n => n[0]).join('') : '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{admin.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{admin.email || 'No email'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{formatEnum(admin.role || 'Member')}</Badge>
                        {admin.status && (
                          <Badge variant={admin.status === 'ACTIVE' ? 'default' : 'outline'}>
                            {formatEnum(admin.status)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <IconUsers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No administrators configured</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>BT Passport Credentials</CardTitle>
              <CardDescription>Access credentials for BT Passport custodian portal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {btPassportCredentials ? (
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3 mb-4">
                    <IconKey className="h-5 w-5 text-primary" />
                    <p className="font-semibold">Portal Access</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Username</Label>
                      <p className="font-mono font-medium mt-1">{btPassportCredentials.username || 'Not available'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Password</Label>
                      <p className="font-mono font-medium mt-1">{btPassportCredentials.password ? '••••••••••••' : 'Not available'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <IconKey className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>BT Passport credentials not configured</p>
                </div>
              )}
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <IconShieldCheck className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  Only your original assigned password is available through GlidingPath. For questions about subsequent passwords, contact BT Passport directly.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Provider</CardTitle>
              <CardDescription>Manage your payroll integration for seamless contribution processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-6 border-2 border-primary/20 rounded-lg bg-primary/5">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-24 rounded-lg bg-white flex items-center justify-center p-3 border border-gray-200">
                    <div className="relative h-full w-full">
                      <Image
                        src="/assets/images/finch-logo-black.svg"
                        alt="Finch"
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Connected Provider</p>
                    <p className="text-2xl font-bold">Finch</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800">
                  <IconCheck className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Last Sync</p>
                  <p className="font-semibold">
                    {lastSyncTimestamp
                      ? new Date(lastSyncTimestamp).toLocaleString()
                      : 'No sync recorded'}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Sync Status</p>
                  <p className="font-semibold">Automatic</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSyncNow}
                  disabled={syncEmployeesMutation.isPending}
                  loading={syncEmployeesMutation.isPending}
                  loadingText="Syncing..."
                >
                  <IconRefresh className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleManageConnection}
                >
                  <IconEdit className="h-4 w-4 mr-2" />
                  Manage Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Integrations</CardTitle>
              <CardDescription>Connect additional services to enhance your plan administration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <IconBell className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Automated participant communications</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password & Authentication</CardTitle>
              <CardDescription>Manage your account security and authentication methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                </div>
                <Button variant="outline">
                  <IconLock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive alerts about account activity</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage devices and sessions with access to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">Chrome on macOS • San Francisco, CA</p>
                    <p className="text-xs text-muted-foreground mt-1">Last active: Just now</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions that affect your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">Permanently remove your account and all data</p>
                </div>
                <Button variant="destructive" size="sm">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}
    </DashboardContent>
  );
}
