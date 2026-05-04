'use client';

import {
  IconBuilding,
  IconSettings,
  IconShieldCheck,
  IconUsers,
  IconCash,
  IconCalendar,
  IconAlertTriangle,
  IconRefresh,
  IconEdit,
  IconCheck,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useGetDetails, useGetByTenant } from '@/api/generated/endpoints/plan-sponsor-details/plan-sponsor-details';
import type { CompanyPlanResponseDTO } from '@/api/generated/models';
import { formatPercent } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';

/**
 * Page Header Component
 */
function PageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plan Settings</h1>
        <p className="text-muted-foreground">
          View and manage your 401(k) plan configuration
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={() => toast.info('Edit Settings', 'Contact support to modify plan settings')}>
        <IconEdit className="mr-2 h-4 w-4" />
        Request Changes
      </Button>
    </div>
  );
}

/**
 * Detail Row Component
 */
function DetailRow({
  label,
  value,
  badge,
}: {
  label: string;
  value: string | number | undefined | null;
  badge?: boolean;
}) {
  return (
    <div className="flex justify-between py-3 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      {badge ? (
        <Badge variant="outline">{value ?? '-'}</Badge>
      ) : (
        <span className="text-sm font-medium text-right max-w-[60%] truncate">
          {value ?? '-'}
        </span>
      )}
    </div>
  );
}

/**
 * Loading Skeleton
 */
function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Error State Component
 */
function SettingsError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <IconAlertTriangle className="h-12 w-12 text-error mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to Load Settings</h3>
        <p className="text-muted-foreground text-center mb-4">
          There was an error loading the plan settings.
        </p>
        <Button onClick={onRetry}>
          <IconRefresh className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Company Information Card
 */
function CompanyInfoCard() {
  const { data: detailsData, isLoading } = useGetDetails();
  const company = detailsData?.companyDetails;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const address = company?.businessAddress;
  const fullAddress = address
    ? `${address.street ?? ''}${address.apt ? `, ${address.apt}` : ''}, ${address.city ?? ''}, ${address.state ?? ''} ${address.postalCode ?? ''}`
    : '-';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <IconBuilding className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-lg">Company Information</CardTitle>
          <CardDescription>Business and contact details</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <DetailRow label="Legal Name" value={company?.legalName} />
        <DetailRow label="EIN" value={company?.ein} />
        <DetailRow label="Email" value={company?.email} />
        <DetailRow label="Entity Type" value={company?.entityType} badge />
        <DetailRow label="Address" value={fullAddress} />
        <DetailRow label="Employees" value={company?.estimatedEmployeeCount} />
      </CardContent>
    </Card>
  );
}

/**
 * Payroll Information Card
 */
function PayrollInfoCard() {
  const { data: detailsData, isLoading } = useGetDetails();
  const company = detailsData?.companyDetails;
  const payroll = company?.payrollSchedule;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info">
          <IconCalendar className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-lg">Payroll Settings</CardTitle>
          <CardDescription>Payroll provider and schedule</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <DetailRow label="Provider" value={company?.payrollProvider} badge />
        <DetailRow label="Schedule" value={payroll?.schedule} />
        <DetailRow label="Pay Period Days" value={payroll?.numberOfDays?.toString()} />
        <DetailRow label="Union Employees" value={company?.unionEmployees ? 'Yes' : 'No'} />
        <DetailRow label="Leased Employees" value={company?.leasedEmployees ? 'Yes' : 'No'} />
      </CardContent>
    </Card>
  );
}

/**
 * Plan Design Card
 */
function PlanDesignCard() {
  const { data: detailsData, isLoading } = useGetDetails();
  const planDesign = detailsData?.planDesign;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
          <IconSettings className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-lg">Plan Design</CardTitle>
          <CardDescription>Core plan structure and features</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <DetailRow label="Plan Type" value={planDesign?.planType} badge />
        <DetailRow label="Contribution Type" value={planDesign?.contributionArrangement} />
        <DetailRow label="Min. Age" value={planDesign?.minimumAge ? `${planDesign.minimumAge} years` : undefined} />
        <DetailRow label="Service Requirement" value={planDesign?.timeEmployed} />
        <DetailRow label="Vesting Schedule" value={planDesign?.vestingSchedule} />
      </CardContent>
    </Card>
  );
}

/**
 * Auto-Enrollment Card
 */
function AutoEnrollmentCard() {
  const { data: detailsData, isLoading } = useGetDetails();
  const planDesign = detailsData?.planDesign;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAutoEnrollment = planDesign?.defaultDeferralPercent !== undefined && planDesign.defaultDeferralPercent > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
          <IconUsers className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-lg">Auto-Enrollment</CardTitle>
          <CardDescription>Automatic enrollment settings</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <DetailRow
          label="Status"
          value={hasAutoEnrollment ? 'Enabled' : 'Disabled'}
          badge
        />
        <DetailRow
          label="Default Deferral"
          value={planDesign?.defaultDeferralPercent !== undefined ? formatPercent(planDesign.defaultDeferralPercent) : undefined}
        />
        <DetailRow
          label="Annual Increase"
          value={planDesign?.annualIncreasePercent !== undefined ? formatPercent(planDesign.annualIncreasePercent) : undefined}
        />
        <DetailRow
          label="Max Deferral"
          value={planDesign?.maxDeferralPercent !== undefined ? formatPercent(planDesign.maxDeferralPercent) : undefined}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Employer Contributions Card
 */
function EmployerContributionsCard() {
  const { data: detailsData, isLoading } = useGetDetails();
  const planDesign = detailsData?.planDesign;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <IconCash className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-lg">Employer Contributions</CardTitle>
          <CardDescription>Matching and profit sharing</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <DetailRow label="Contribution Type" value={planDesign?.employerContributionType} badge />
        <DetailRow
          label="Match Rate"
          value={planDesign?.employerContributionPercent !== undefined ? formatPercent(planDesign.employerContributionPercent) : undefined}
        />
        <DetailRow label="Vesting" value={planDesign?.vestingSchedule} />
      </CardContent>
    </Card>
  );
}

/**
 * Plan Configurations Tab
 */
function PlanConfigurationsTab() {
  const {
    data: plansData,
    isLoading,
    error,
    refetch,
  } = useGetByTenant();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconAlertTriangle className="h-12 w-12 text-error mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Configurations</h3>
          <Button onClick={() => refetch()}>
            <IconRefresh className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const plans = plansData ?? [];

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconSettings className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Plan Configurations</h3>
          <p className="text-muted-foreground text-center">
            No plan configurations have been set up yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {plans.map((plan: CompanyPlanResponseDTO) => (
        <Card key={plan.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <IconShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    Plan Year {plan.planYear}
                  </CardTitle>
                  <CardDescription>
                    Effective {plan.effectiveDate ? format(new Date(plan.effectiveDate), 'MMMM d, yyyy') : '-'}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant={plan.status === 'ACTIVE' ? 'default' : 'secondary'}
              >
                {plan.status ?? 'Unknown'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Eligibility Section */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <IconUsers className="h-4 w-4 text-muted-foreground" />
                  Eligibility Requirements
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Minimum Age</span>
                    <span className="font-medium">
                      {plan.eligibility?.minimumEntryAge !== undefined
                        ? `${plan.eligibility.minimumEntryAge} years`
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Service Requirement</span>
                    <span className="font-medium">
                      {plan.eligibility?.timeEmployedMonths !== undefined
                        ? `${plan.eligibility.timeEmployedMonths} months`
                        : '-'}
                    </span>
                  </div>
                  {plan.eligibility?.exclusions && plan.eligibility.exclusions.length > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Exclusions</span>
                      <span className="font-medium text-right">
                        {plan.eligibility.exclusions.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contribution Limits Section */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <IconCash className="h-4 w-4 text-muted-foreground" />
                  Contribution Settings
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Max Contribution Rate</span>
                    <span className="font-medium">
                      {plan.employeeContributionConfig?.enrollmentMaxContributionRate !== undefined
                        ? formatPercent(plan.employeeContributionConfig.enrollmentMaxContributionRate)
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Roth Allowed</span>
                    <span className="font-medium">
                      {plan.employeeContributionConfig?.supportsRoth ? (
                        <IconCheck className="h-4 w-4 text-success" />
                      ) : (
                        '-'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Auto Enrollment</span>
                    <span className="font-medium">
                      {plan.employeeContributionConfig?.isAutoEnrollment ? (
                        <IconCheck className="h-4 w-4 text-success" />
                      ) : (
                        '-'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Employer Match Section */}
              {plan.employerContributionRule && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <IconBuilding className="h-4 w-4 text-muted-foreground" />
                    Employer Match
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Rule Type</span>
                      <Badge variant="outline">
                        {plan.employerContributionRule.ruleType ?? '-'}
                      </Badge>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">
                        {plan.employerContributionRule.ruleType === 'FLEXIBLE_MATCH'
                          ? 'Match % (of compensation)'
                          : plan.employerContributionRule.ruleType === 'BASIC_MATCH'
                            ? 'Match % (of employee contribution)'
                            : 'Match %'}
                      </span>
                      <span className="font-medium">
                        {plan.employerContributionRule.matchPercentage !== undefined
                          ? formatPercent(plan.employerContributionRule.matchPercentage)
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Match Limit</span>
                      <span className="font-medium">
                        {plan.employerContributionRule.matchLimitPercent !== undefined
                          ? formatPercent(plan.employerContributionRule.matchLimitPercent)
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Profit Sharing Section */}
              {plan.profitSharingConfig && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <IconCash className="h-4 w-4 text-muted-foreground" />
                    Profit Sharing
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Formula</span>
                      <Badge variant="outline">
                        {plan.profitSharingConfig.formula ?? '-'}
                      </Badge>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Rate</span>
                      <span className="font-medium">
                        {plan.profitSharingConfig.proRataPercentage !== undefined
                          ? formatPercent(plan.profitSharingConfig.proRataPercentage)
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Plan Settings Page
 */
export default function PlanSettingsPage() {
  const {
    isLoading,
    error,
    refetch,
  } = useGetDetails();

  if (isLoading) {
    return (
      <DashboardContent>
        <PageHeader />
        <SettingsSkeleton />
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent>
        <PageHeader />
        <SettingsError onRetry={() => refetch()} />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <PageHeader />

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <IconBuilding className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="configurations" className="flex items-center gap-2">
            <IconSettings className="h-4 w-4" />
            <span>Plan Configurations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <CompanyInfoCard />
            <PayrollInfoCard />
            <PlanDesignCard />
            <AutoEnrollmentCard />
            <EmployerContributionsCard />
          </div>
        </TabsContent>

        <TabsContent value="configurations" className="mt-6">
          <PlanConfigurationsTab />
        </TabsContent>
      </Tabs>
    </DashboardContent>
  );
}
