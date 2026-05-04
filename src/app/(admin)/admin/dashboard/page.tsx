'use client';

import { lazy, Suspense } from 'react';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useGetDashboardMetrics, useGetDashboardTrends } from '@/api/generated/endpoints/super-admin-dashboard/super-admin-dashboard';
import { Card, CardContent, CardHeader, CardTitle, KpiCard } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { IconTrendingUp, IconTrendingDown, IconMinus, IconAlertTriangle } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

// Lazy load chart components for better performance
const DashboardCharts = lazy(() => import('./components/DashboardCharts'));

/**
 * Metric Card Component
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  valuePrefix?: string;
  valueSuffix?: string;
}

function MetricCard({ title, value, subtitle, trend, icon, valuePrefix = '', valueSuffix = '' }: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <IconMinus className="h-4 w-4 text-muted-foreground" />;
    if (trend > 0) return <IconTrendingUp className="h-4 w-4 text-success" />;
    return <IconTrendingDown className="h-4 w-4 text-destructive" />;
  };

  const formattedValue =
    typeof value === 'number' ? `${valuePrefix}${value.toLocaleString()}${valueSuffix}` : `${valuePrefix}${value}${valueSuffix}`;

  const trendText =
    trend !== undefined
      ? `${trend > 0 ? '+' : trend < 0 ? '-' : ''}${Math.abs(trend).toFixed(1)}% vs last period`
      : undefined;

  const descriptionParts = [];
  if (subtitle) descriptionParts.push(subtitle);
  if (trendText) descriptionParts.push(trendText);
  const description = descriptionParts.length ? descriptionParts.join(' • ') : undefined;

  return (
    <KpiCard
      label={title}
      value={formattedValue}
      description={description}
      className="hover:shadow-md transition-shadow"
    />
  );
}

/**
 * Platform Metrics Section
 */
function PlatformMetricsSection({ data }: { data: any }) {
  if (!data?.platformMetrics) return null;

  const { platformMetrics } = data;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Platform Overview</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Tenants"
          value={platformMetrics.totalTenants || 0}
          subtitle={`${platformMetrics.activeTenants || 0} active`}
          trend={platformMetrics.tenantGrowthPercent}
          icon={<IconTrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Total Users"
          value={platformMetrics.totalUsers || 0}
          subtitle={`${platformMetrics.activeUsers || 0} active`}
          trend={platformMetrics.userGrowthPercent}
          icon={<IconTrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Participants"
          value={platformMetrics.totalParticipants || 0}
          subtitle={`${platformMetrics.activeParticipants || 0} active`}
          trend={platformMetrics.participantGrowthPercent}
          icon={<IconTrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Active Plans"
          value={platformMetrics.activePlans || 0}
          subtitle={`${(platformMetrics.avgParticipantsPerPlan || 0).toFixed(1)} avg participants`}
          icon={<IconTrendingUp className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}

/**
 * Financial Metrics Section
 */
function FinancialMetricsSection({ data }: { data: any }) {
  if (!data?.financialMetrics) return null;

  const { financialMetrics } = data;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Financial Metrics</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Assets Under Management"
          value={formatCurrency(parseFloat(financialMetrics.totalAUM || '0'))}
          trend={financialMetrics.aumGrowthPercent}
          icon={<IconTrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Contributions (Month)"
          value={formatCurrency(parseFloat(financialMetrics.contributionsThisMonth || '0'))}
          subtitle={`${formatCurrency(parseFloat(financialMetrics.contributionsThisYear || '0'))} YTD`}
          trend={financialMetrics.contributionGrowthPercent}
          icon={<IconTrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Distributions (Month)"
          value={formatCurrency(parseFloat(financialMetrics.distributionsThisMonth || '0'))}
          subtitle={`${formatCurrency(parseFloat(financialMetrics.distributionsThisYear || '0'))} YTD`}
          trend={financialMetrics.distributionGrowthPercent}
          icon={<IconTrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Payrolls Processed"
          value={financialMetrics.payrollsThisMonth || 0}
          subtitle={`${financialMetrics.payrollsThisYear || 0} this year`}
          icon={<IconTrendingUp className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}

/**
 * Activity Metrics Section
 */
function ActivityMetricsSection({ data }: { data: any }) {
  if (!data?.activityMetrics) return null;

  const { activityMetrics } = data;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Activity & Performance</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="API Calls (Today)"
          value={activityMetrics.apiCallsToday || 0}
          subtitle={`${activityMetrics.apiCallsThisWeek || 0} this week`}
          icon={<IconTrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Avg Response Time"
          value={activityMetrics.avgApiResponseTimeMs || 0}
          valueSuffix="ms"
          subtitle={`${activityMetrics.errorRatePercent?.toFixed(2)}% error rate`}
          icon={<IconTrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Active Sessions"
          value={activityMetrics.activeSessionsLastHour || 0}
          subtitle={`${activityMetrics.loginsToday || 0} logins today`}
          icon={<IconTrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Storage Used"
          value={activityMetrics.storageUsedGB?.toFixed(2) || '0.0'}
          valueSuffix=" GB"
          trend={activityMetrics.storageGrowthPercent}
          icon={<IconTrendingUp className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}

/**
 * Page Header (removed - not needed)
 */

/**
 * Loading State
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-96 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((card) => (
              <Card key={card}>
                <CardHeader className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-40" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Error State
 */
function DashboardError({ error, refetch }: { error: any; refetch: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <IconAlertTriangle className="h-16 w-16 text-destructive mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Failed to Load Dashboard</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        {error?.message || 'Unable to fetch dashboard metrics. Please try again.'}
      </p>
      <Button onClick={refetch}>Retry</Button>
    </div>
  );
}

/**
 * Admin Dashboard Page
 */
export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useGetDashboardMetrics({
    query: {
      staleTime: 60000, // 1 minute cache
      refetchInterval: 300000, // Refresh every 5 minutes
    },
  });

  const { data: trendsData } = useGetDashboardTrends(
    { days: 30 },
    {
      query: {
        staleTime: 300000, // 5 minute cache for trends
        enabled: !!data, // Only fetch trends after main data loads
      },
    }
  );

  if (isLoading) {
    return (
      <DashboardContent>
        <DashboardSkeleton />
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent>
        <DashboardError error={error} refetch={refetch} />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <div className="space-y-8">
        <PlatformMetricsSection data={data} />

        <FinancialMetricsSection data={data} />

        <ActivityMetricsSection data={data} />

        {/* Lazy-loaded charts section */}
        <Suspense
          fallback={
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        >
          {trendsData && <DashboardCharts trendsData={trendsData} />}
        </Suspense>
      </div>
    </DashboardContent>
  );
}
