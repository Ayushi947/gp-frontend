'use client';

import { useState } from 'react';
import {
  IconCash,
  IconDownload,
  IconUpload,
  IconCalendar,
  IconAlertTriangle,
  IconRefresh,
  IconTrendingUp,
  IconTrendingDown,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, KpiCard } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useGetDashboardContributions } from '@/api/generated/endpoints/contributions-reporting/contributions-reporting';
import type { ContributionsReportDTO, ContributionDateSummaryDTO } from '@/api/generated/models';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { format, subMonths, startOfYear } from 'date-fns';

/**
 * Page Header Component
 */
function PageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contributions</h1>
        <p className="text-muted-foreground">
          View and manage plan contributions
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => toast.info('Export', 'Feature coming soon')}>
          <IconDownload className="mr-2 h-4 w-4" />
          Export Report
        </Button>
        <Button size="sm" onClick={() => toast.info('Upload Payroll', 'Feature coming soon')}>
          <IconUpload className="mr-2 h-4 w-4" />
          Upload Payroll
        </Button>
      </div>
    </div>
  );
}

/**
 * Summary Card Component
 */
function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading,
}: {
  title: string;
  value: number | undefined;
  description: string;
  icon: typeof IconCash;
  trend?: { value: number; label: string };
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  const formattedValue =
    value !== undefined ? formatCurrency(value) : '-';

  const trendText = trend
    ? `${trend.value > 0 ? '+' : ''}${formatPercent(trend.value)} ${trend.label}`
    : null;

  const fullDescription = trendText
    ? `${description} • ${trendText}`
    : description;

  return (
    <KpiCard
      label={title}
      value={formattedValue}
      description={fullDescription}
    />
  );
}

/**
 * Contribution Breakdown Chart Component
 */
function ContributionBreakdown({
  data,
  loading,
}: {
  data: ContributionsReportDTO | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const preTax = data?.preTaxEmployeeContributions ?? 0;
  const roth = data?.rothEmployeeContributions ?? 0;
  const employer = data?.employerContributions ?? 0;
  const total = data?.totalContributions ?? 0;

  const breakdown = [
    { label: 'Pre-Tax Deferrals', value: preTax, color: 'bg-primary' },
    { label: 'Roth Deferrals', value: roth, color: 'bg-success' },
    { label: 'Employer Contributions', value: employer, color: 'bg-info' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contribution Breakdown</CardTitle>
        <CardDescription>Year-to-date contribution types</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {breakdown.map((item) => {
            const percentage = total > 0 ? (item.value / total) : 0;
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-sm tabular-nums">
                    {formatCurrency(item.value)} ({formatPercent(percentage)})
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} transition-all`}
                    style={{ width: `${percentage * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total Contributions</span>
            <span className="text-xl font-bold tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Recent Contributions Table
 */
function RecentContributionsTable({
  data,
  loading,
}: {
  data: ContributionDateSummaryDTO[] | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="flex-1 h-4" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const contributions = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Contributions</CardTitle>
        <CardDescription>Contributions by date</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {contributions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <IconCalendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Contributions Found</h3>
            <p className="text-muted-foreground text-center">
              No contribution records available for the selected period.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Pre-Tax</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Roth</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Employer</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {contributions.slice(0, 10).map((contribution, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <span className="font-medium">
                        {contribution.contributionDate
                          ? format(new Date(contribution.contributionDate), 'MMM d, yyyy')
                          : '-'}
                      </span>
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {formatCurrency(contribution.employee ?? 0)}
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      -
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {formatCurrency(contribution.employer ?? 0)}
                    </td>
                    <td className="p-4 text-right tabular-nums font-medium">
                      {formatCurrency(contribution.contributions ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Error State Component
 */
function ContributionsError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <IconAlertTriangle className="h-12 w-12 text-error mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to Load Contributions</h3>
        <p className="text-muted-foreground text-center mb-4">
          There was an error loading the contribution data. Please try again.
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
 * Contributions Page
 */
export default function ContributionsPage() {
  const currentYear = new Date().getFullYear();
  const startDate = format(startOfYear(new Date()), 'yyyy-MM-dd');
  const endDate = `${currentYear + 1}-12-31`;

  const {
    data: contributionsData,
    isLoading,
    error,
    refetch,
  } = useGetDashboardContributions({
    startDate,
    endDate,
  });

  if (error) {
    return (
      <DashboardContent>
        <PageHeader />
        <ContributionsError onRetry={() => refetch()} />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <PageHeader />

      {/* Summary Cards - LPI/KPI cards commented out per request */}
      {/*
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title="Total YTD Contributions"
          value={contributionsData?.totalContributions}
          description="Year-to-date total"
          icon={IconCash}
          loading={isLoading}
        />
        <SummaryCard
          title="Employee Contributions"
          value={contributionsData?.totalEmployeeContributions}
          description="Pre-tax + Roth deferrals"
          icon={IconTrendingUp}
          loading={isLoading}
        />
        <SummaryCard
          title="Employer Contributions"
          value={contributionsData?.employerContributions}
          description="Match + Profit sharing"
          icon={IconTrendingUp}
          loading={isLoading}
        />
        <SummaryCard
          title="Pre-Tax Deferrals"
          value={contributionsData?.preTaxEmployeeContributions}
          description="Traditional 401(k)"
          icon={IconCash}
          loading={isLoading}
        />
      </div>
      */}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ContributionBreakdown data={contributionsData} loading={isLoading} />
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contribution Period</CardTitle>
            <CardDescription>Current reporting period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {contributionsData?.startDate
                      ? format(new Date(contributionsData.startDate), 'MMMM d, yyyy')
                      : format(new Date(startDate), 'MMMM d, yyyy')}
                  </p>
                </div>
                <IconCalendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {contributionsData?.endDate
                      ? format(new Date(contributionsData.endDate), 'MMMM d, yyyy')
                      : format(new Date(endDate), 'MMMM d, yyyy')}
                  </p>
                </div>
                <IconCalendar className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Contributions Table */}
      <RecentContributionsTable
        data={contributionsData?.summaryByDate}
        loading={isLoading}
      />
    </DashboardContent>
  );
}
