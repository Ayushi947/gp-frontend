'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  IconArrowLeft,
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconBriefcase,
  IconCalendar,
  IconCurrencyDollar,
  IconPercentage,
  IconChartBar,
  IconEdit,
  IconDownload,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconX,
  IconSend,
  IconHistory,
  IconShieldCheck,
  IconTrendingUp,
  IconUsers,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useGetParticipantDetails } from '@/api/generated/endpoints/participants/participants';
import { formatCurrency, formatPercentFromBackend, formatDate, formatEnum, cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

/**
 * Format annual compensation amount
 * Backend returns annualCompensation as BigDecimal in dollars (already converted)
 */
function formatAnnualCompensation(amount: number | null | undefined): string {
  if (!amount) return '$0.00';
  // annualCompensation from backend is already in dollars, just format it
  return formatCurrency(amount);
}

/**
 * Enrollment Status Badge Component
 */
function EnrollmentStatusBadge({
  balance,
  eligibilityStatus,
}: {
  balance: number | null | undefined;
  eligibilityStatus: string | null | undefined;
}) {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
  let className = '';
  let label = 'Pending';
  let Icon = IconClock;

  if (balance && balance > 0) {
    variant = 'default';
    className = 'bg-green-100 text-green-800 border-green-200';
    label = 'Enrolled';
    Icon = IconCheck;
  } else if (eligibilityStatus?.toUpperCase() === 'ELIGIBLE') {
    variant = 'secondary';
    className = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    label = 'Invited';
    Icon = IconClock;
  } else if (eligibilityStatus?.toUpperCase() === 'NOT_ELIGIBLE') {
    variant = 'outline';
    className = 'bg-gray-100 text-gray-500 border-gray-200';
    label = 'Not Eligible';
    Icon = IconX;
  }

  return (
    <Badge variant={variant} className={cn('text-sm px-3 py-1', className)}>
      <Icon className="h-4 w-4 mr-1.5" />
      {label}
    </Badge>
  );
}

/**
 * Employment Status Badge Component
 */
function EmploymentStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;

  const statusUpper = status.toUpperCase();
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
  let className = '';
  let Icon = IconCheck;

  if (statusUpper === 'ACTIVE') {
    variant = 'default';
    className = 'bg-green-100 text-green-800 border-green-200';
    Icon = IconCheck;
  } else if (statusUpper === 'INACTIVE' || statusUpper === 'TERMINATED') {
    variant = 'destructive';
    className = 'bg-red-100 text-red-800 border-red-200';
    Icon = IconX;
  } else if (statusUpper === 'PENDING') {
    variant = 'secondary';
    className = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    Icon = IconClock;
  }

  return (
    <Badge variant={variant} className={cn('text-sm px-3 py-1', className)}>
      <Icon className="h-4 w-4 mr-1.5" />
      {formatEnum(status)}
    </Badge>
  );
}

/**
 * Stat Card Component
 */
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  variant = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down';
  variant?: 'default' | 'primary' | 'success';
}) {
  const bgColors = {
    default: 'bg-muted',
    primary: 'bg-primary/10',
    success: 'bg-green-50',
  };

  const iconColors = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    success: 'text-green-600',
  };

  return (
    <Card className="h-full">
      <CardContent className="pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
            <p className="text-2xl font-bold tracking-tight truncate">{value}</p>
            {subValue && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1 truncate">
                {trend && <IconTrendingUp className={cn('h-3 w-3 shrink-0', trend === 'up' ? 'text-green-600' : 'text-red-600 rotate-180')} />}
                {subValue}
              </p>
            )}
          </div>
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', bgColors[variant])}>
            <Icon className={cn('h-5 w-5', iconColors[variant])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Info Row Component
 */
function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number | null | undefined;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-medium text-right">{value ?? '-'}</span>
    </div>
  );
}

/**
 * Loading Skeleton
 */
function ParticipantDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

/**
 * Error State Component
 */
function ParticipantDetailError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <IconAlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to Load Participant</h3>
        <p className="text-muted-foreground text-center mb-4">
          There was an error loading the participant details. Please try again.
        </p>
        <Button onClick={onRetry}>Retry</Button>
      </CardContent>
    </Card>
  );
}

/**
 * Participant Details Page
 */
export default function ParticipantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const participantId = params.id as string;
  const [activeTab, setActiveTab] = useState<string>('overview');

  const {
    data: participant,
    isLoading,
    error,
    refetch,
  } = useGetParticipantDetails(participantId);

  const handleBack = () => {
    router.push('/participants');
  };

  if (error) {
    return (
      <DashboardContent>
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back to Participants
        </Button>
        <ParticipantDetailError onRetry={() => refetch()} />
      </DashboardContent>
    );
  }

  if (isLoading) {
    return (
      <DashboardContent>
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back to Participants
        </Button>
        <ParticipantDetailSkeleton />
      </DashboardContent>
    );
  }

  if (!participant) {
    return (
      <DashboardContent>
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back to Participants
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconUser className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Participant Not Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              The requested participant could not be found.
            </p>
          </CardContent>
        </Card>
      </DashboardContent>
    );
  }

  const primaryEmail = participant.emails?.[0]?.email;
  const primaryPhone = participant.phoneNumbers?.[0]?.phoneNumber;
  const totalDeferral = (participant.preTaxDeferralPercentage ?? 0) + (participant.rothDeferralPercentage ?? 0);

  return (
    <DashboardContent>
      {/* Header */}
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack}>
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Participants
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.info('Send Email', 'Feature coming soon')}>
              <IconSend className="mr-2 h-4 w-4" />
              Send Email
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info('Export', 'Feature coming soon')}>
              <IconDownload className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" onClick={() => toast.info('Edit', 'Feature coming soon')}>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex items-start gap-6">
          <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold shrink-0">
            {participant.firstName?.[0] ?? 'P'}
            {participant.lastName?.[0] ?? ''}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight mb-1.5">
              {participant.fullName ?? 'Unknown Participant'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1.5">
                <IconBriefcase className="h-4 w-4" />
                {participant.title ?? 'Participant'}
              </span>
              <span className="text-muted-foreground/50">|</span>
              <span className="flex items-center gap-1.5">
                <IconUsers className="h-4 w-4" />
                {participant.departmentName ?? 'No Department'}
              </span>
              <span className="text-muted-foreground/50">|</span>
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{participant.accountNumber ?? 'No Account'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <EnrollmentStatusBadge
                balance={participant.balance}
                eligibilityStatus={participant.eligibilityStatus}
              />
              <EmploymentStatusBadge status={participant.employmentStatus} />
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            icon={IconCurrencyDollar}
            label="Account Balance"
            value={participant.balance ? formatCurrency(participant.balance) : '$0.00'}
            variant="primary"
          />
          <StatCard
            icon={IconPercentage}
            label="Total Deferral"
            value={formatPercentFromBackend(totalDeferral)}
            subValue={`Pre-tax: ${formatPercentFromBackend(participant.preTaxDeferralPercentage)} • Roth: ${formatPercentFromBackend(participant.rothDeferralPercentage)}`}
          />
          <StatCard
            icon={IconCurrencyDollar}
            label="Annual Compensation"
            value={participant.annualCompensation ? formatCurrency(participant.annualCompensation) : 'N/A'}
            subValue={participant.title || participant.departmentName || undefined}
          />
          <StatCard
            icon={IconCalendar}
            label="Years of Service"
            value={participant.startDate ? `${Math.floor((new Date().getTime() - new Date(participant.startDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yrs` : 'N/A'}
            subValue={participant.startDate ? `Since ${formatDate(participant.startDate)}` : undefined}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <IconUser className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="employment">
            <IconBriefcase className="h-4 w-4 mr-2" />
            Employment
          </TabsTrigger>
          <TabsTrigger value="account">
            <IconChartBar className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="activity">
            <IconHistory className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <IconMail className="h-4 w-4 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  <InfoRow label="Full Name" value={participant.fullName} icon={IconUser} />
                  {participant.middleName && (
                    <InfoRow label="Middle Name" value={participant.middleName} icon={IconUser} />
                  )}
                  {participant.preferredName && (
                    <InfoRow label="Preferred Name" value={participant.preferredName} icon={IconUser} />
                  )}
                  <InfoRow label="Email" value={primaryEmail} icon={IconMail} />
                  {primaryPhone && <InfoRow label="Phone" value={primaryPhone} icon={IconPhone} />}
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <IconShieldCheck className="h-4 w-4 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  <InfoRow
                    label="Date of Birth"
                    value={participant.dateOfBirth ? formatDate(participant.dateOfBirth) : null}
                    icon={IconCalendar}
                  />
                  <InfoRow label="SSN" value={participant.ssnMasked} icon={IconShieldCheck} />
                  {participant.gender && <InfoRow label="Gender" value={formatEnum(participant.gender)} />}
                  {participant.ethnicity && <InfoRow label="Ethnicity" value={formatEnum(participant.ethnicity)} />}
                  {participant.maritalStatus && (
                    <InfoRow label="Marital Status" value={formatEnum(participant.maritalStatus)} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <IconMapPin className="h-4 w-4 text-primary" />
                  Addresses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Residence */}
                  {participant.residence && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <IconMapPin className="h-4 w-4" />
                        Residence Address
                      </p>
                      <div className="space-y-1 text-sm">
                        {participant.residence.line1 && <p>{participant.residence.line1}</p>}
                        {participant.residence.line2 && <p>{participant.residence.line2}</p>}
                        <p>
                          {participant.residence.city && `${participant.residence.city}`}
                          {participant.residence.state && `, ${participant.residence.state}`}
                          {participant.residence.postalCode && ` ${participant.residence.postalCode}`}
                        </p>
                        {participant.residence.country && <p>{participant.residence.country}</p>}
                      </div>
                    </div>
                  )}

                  {/* Work Location */}
                  {participant.workLocationName && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <IconBriefcase className="h-4 w-4" />
                        Work Location
                      </p>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">{participant.workLocationName}</p>
                        {participant.workLocationLine1 && <p>{participant.workLocationLine1}</p>}
                        {participant.workLocationCity && (
                          <p>
                            {participant.workLocationCity}
                            {participant.workLocationState && `, ${participant.workLocationState}`}
                            {participant.workLocationPostalCode && ` ${participant.workLocationPostalCode}`}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
                <CardDescription>Current position and work information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <InfoRow label="Title" value={participant.title} icon={IconBriefcase} />
                  {participant.departmentName && (
                    <InfoRow label="Department" value={participant.departmentName} icon={IconUsers} />
                  )}
                  {participant.employmentType && (
                    <InfoRow label="Employment Type" value={formatEnum(participant.employmentType)} icon={IconBriefcase} />
                  )}
                  <InfoRow label="Employment Status" value={formatEnum(participant.employmentStatus)} icon={IconCheck} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employment Timeline</CardTitle>
                <CardDescription>Important employment dates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <InfoRow
                    label="Start Date"
                    value={participant.startDate ? formatDate(participant.startDate) : null}
                    icon={IconCalendar}
                  />
                  {participant.endDate && (
                    <InfoRow label="End Date" value={formatDate(participant.endDate)} icon={IconCalendar} />
                  )}
                  {participant.latestRehireDate && (
                    <InfoRow label="Latest Rehire" value={formatDate(participant.latestRehireDate)} icon={IconCalendar} />
                  )}
                  <InfoRow
                    label="Eligibility Date"
                    value={participant.eligibilityDate ? formatDate(participant.eligibilityDate) : null}
                    icon={IconCheck}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Compensation</CardTitle>
                <CardDescription>Salary and compensation details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 border-2 border-primary/20 rounded-lg bg-primary/5 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Annual Compensation</p>
                  <p className="text-4xl font-bold text-primary">
                    {formatAnnualCompensation(participant.annualCompensation)}
                  </p>
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <InfoRow
                      label="Base Rate"
                      value={
                        participant.incomeAmount
                          ? `${formatCurrency(participant.incomeAmount / 100)} ${participant.incomeCurrency || 'USD'}`
                          : null
                      }
                      icon={IconCurrencyDollar}
                    />
                    <InfoRow label="Pay Frequency" value={formatEnum(participant.incomeUnit)} icon={IconCalendar} />
                  </div>
                  <div className="space-y-1">
                    <InfoRow
                      label="Effective Date"
                      value={participant.incomeEffectiveDate}
                      icon={IconCalendar}
                    />
                    {participant.managerId && <InfoRow label="Manager ID" value={participant.managerId} />}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contribution Rates</CardTitle>
                <CardDescription>Current deferral percentages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Pre-Tax Deferral</span>
                    <span className="text-2xl font-bold text-blue-900">
                      {formatPercentFromBackend(participant.preTaxDeferralPercentage)}
                    </span>
                  </div>
                  <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${Math.min((participant.preTaxDeferralPercentage ?? 0) / 20 * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-purple-50 border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-900">Roth Deferral</span>
                    <span className="text-2xl font-bold text-purple-900">
                      {formatPercentFromBackend(participant.rothDeferralPercentage)}
                    </span>
                  </div>
                  <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${Math.min((participant.rothDeferralPercentage ?? 0) / 20 * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-900">Employer Match Rate</span>
                    <span className="text-2xl font-bold text-green-900">
                      {formatPercentFromBackend(participant.employerContributionRate)}
                    </span>
                  </div>
                  <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full"
                      style={{ width: `${Math.min((participant.employerContributionRate ?? 0) / 10 * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
                <CardDescription>Balance and portfolio information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 border-2 border-primary/20 rounded-lg bg-primary/5 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Current Balance</p>
                  <p className="text-4xl font-bold text-primary mb-1">
                    {participant.balance ? formatCurrency(participant.balance) : '$0.00'}
                  </p>
                  <p className="text-xs text-muted-foreground">As of today</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <InfoRow
                    label="Portfolio Type"
                    value={participant.portfolioType ?? 'Not Selected'}
                    icon={IconChartBar}
                  />
                  {participant.eligibilityReason && (
                    <InfoRow label="Eligibility Reason" value={participant.eligibilityReason} icon={IconCheck} />
                  )}
                </div>
                {(participant.vestedEmployerContributionPercent !== null &&
                  participant.vestedEmployerContributionPercent !== undefined) ||
                (participant.vestedProfitSharingPercent !== null &&
                  participant.vestedProfitSharingPercent !== undefined) ? (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-3">Vesting Details</p>
                      <div className="space-y-1">
                        {participant.vestedEmployerContributionPercent !== null &&
                          participant.vestedEmployerContributionPercent !== undefined && (
                            <InfoRow
                              label="Vested Employer Contribution"
                              value={formatPercentFromBackend(participant.vestedEmployerContributionPercent)}
                            />
                          )}
                        {participant.vestedProfitSharingPercent !== null &&
                          participant.vestedProfitSharingPercent !== undefined && (
                            <InfoRow
                              label="Vested Profit Sharing"
                              value={formatPercentFromBackend(participant.vestedProfitSharingPercent)}
                            />
                          )}
                      </div>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Contribution and account activity timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <IconHistory className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
                <p className="text-muted-foreground">
                  Activity timeline will appear here once contributions and transactions are recorded
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardContent>
  );
}
