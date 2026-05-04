'use client';

import React from 'react';
import {
  IconWallet,
  IconCash,
  IconTrendingUp,
  IconTrendingDown,
  IconCalendar,
  IconCheck,
  IconAlertTriangle,
  IconRefresh,
  IconChevronRight,
  IconArrowUpRight,
  IconArrowDownRight,
  IconBell,
  IconFileText,
  IconSettings,
} from '@tabler/icons-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useGetParticipantPersonalDetails, useContributionProjectionForCurrentUser } from '@/api/generated/endpoints/participants/participants';
import { useGetParticipantTasks, useGetParticipantActivities } from '@/api/generated/endpoints/participant-portal/participant-portal';
import { useGetMyParticipantBalance, useGetMyPortfolioHistory } from '@/api/generated/endpoints/investment-management/investment-management';
import { useGetEffectivePortfolio } from '@/api/generated/endpoints/participant-portfolio-assignment/participant-portfolio-assignment';
import type { TaskDTO, ActivityDTO, ModelPortfolioDTO } from '@/api/generated/models';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { customInstance } from '@/api/client';

const chartConfig = {
  value: {
    label: 'Portfolio Value',
    color: 'hsl(221 83% 53%)',
  },
} satisfies ChartConfig;

/**
 * Portfolio Overview Card with Chart
 */
function PortfolioOverviewCard() {
  const { data: balanceData, isLoading, error, refetch } = useGetMyParticipantBalance();
  const { data: historyData, isLoading: historyLoading } = useGetMyPortfolioHistory({ days: 30 });

  const chartData = React.useMemo(() => {
    if (!historyData || !Array.isArray(historyData)) return [];
    return historyData.map((point: any) => ({
      date: point.date ?? '',
      value: point.value ?? 0,
    }));
  }, [historyData]);

  const totalValue = balanceData?.totalInvestmentValue ?? 0;
  const totalGainLoss = balanceData?.totalGainLoss ?? 0;
  const totalGainLossPercent = balanceData?.totalGainLossPercentage ?? 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconAlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Portfolio</h3>
          <Button onClick={() => refetch()} variant="outline">
            <IconRefresh className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>Portfolio Balance</CardTitle>
            <CardDescription>Your total retirement savings</CardDescription>
            <div className="mt-4">
              <div className="text-4xl font-bold mb-2">{formatCurrency(totalValue)}</div>
              {totalGainLossPercent !== 0 && (
                <div className="flex items-center gap-2">
                  {totalGainLossPercent > 0 ? (
                    <IconTrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <IconTrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  <span className={cn('text-base font-semibold', totalGainLossPercent > 0 ? 'text-green-600' : 'text-red-600')}>
                    {totalGainLossPercent > 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
                  </span>
                  <span className={cn('text-sm', totalGainLossPercent > 0 ? 'text-green-600' : 'text-red-600')}>
                    ({totalGainLossPercent > 0 ? '+' : ''}{formatPercent(totalGainLossPercent)})
                  </span>
                </div>
              )}
            </div>
          </div>
          <Link href="/participant/portfolio">
            <Button variant="outline">
              Manage Portfolio
              <IconChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          {historyLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">Loading chart...</p>
            </div>
          ) : chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return format(date, 'MMM d');
                  }}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                    else if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                    return `$${value}`;
                  }}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">No chart data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Contribution Card
 */
function ContributionCard() {
  const { data: projectionData, isLoading } = useContributionProjectionForCurrentUser();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!projectionData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Unable to load contribution data</p>
        </CardContent>
      </Card>
    );
  }

  const projection = projectionData as any;
  const perPeriod = projection?.perPeriod ?? {};
  const perPeriodEmployee = (perPeriod.employeePreTax ?? 0) + (perPeriod.employeeRoth ?? 0);
  const perPeriodEmployer = perPeriod.employer ?? 0;
  const perPeriodTotal = perPeriod.total ?? perPeriodEmployee + perPeriodEmployer;

  const annual = projection?.annual ?? {};
  const annualEmployee = annual.employee ?? 0;
  const annualEmployer = annual.employer ?? 0;
  const annualTotal = annual.total ?? annualEmployee + annualEmployer; // Already capped by backend
  const cappedAtIrsLimit = projection?.cappedAtIrsLimit ?? false;


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Contributions</CardTitle>
            <CardDescription>Current savings plan</CardDescription>
          </div>
          <Link href="/participant/contributions">
            <Button variant="outline" size="sm">
              Update
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Per Paycheck */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <p className="text-sm font-medium text-blue-900 mb-2">Per Paycheck</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-blue-900">{formatCurrency(perPeriodTotal)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/80 rounded-lg p-3">
              <p className="text-xs text-blue-700 mb-1">You contribute</p>
              <p className="text-lg font-bold text-blue-900">{formatCurrency(perPeriodEmployee)}</p>
            </div>
            <div className="bg-white/80 rounded-lg p-3">
              <p className="text-xs text-blue-700 mb-1">Employer Contribution</p>
              <p className="text-lg font-bold text-blue-900">{formatCurrency(perPeriodEmployer)}</p>
            </div>
          </div>
        </div>

        {/* Annual Projection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Annual Projection</p>
            <p className="text-xl font-bold">{formatCurrency(annualTotal)}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm py-2">
              <span className="text-muted-foreground">Your Contributions</span>
              <span className="font-semibold">{formatCurrency(annualEmployee)}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-t">
              <span className="text-muted-foreground">Employer Contribution</span>
              <span className="font-semibold">{formatCurrency(annualEmployer)}</span>
            </div>
          </div>
          {cappedAtIrsLimit && (
            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 mt-3">
              <IconCheck className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-green-700 dark:text-green-300">
                On track to maximize your contribution limits.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Quick Actions Card
 */
function QuickActionsCard() {
  const actions = [
    {
      href: '/participant/contributions',
      icon: IconCash,
      label: 'Contributions',
      description: 'Update your contribution rate',
      color: 'bg-blue-500',
    },
    {
      href: '/participant/portfolio',
      icon: IconWallet,
      label: 'Investments',
      description: 'View and manage funds',
      color: 'bg-green-500',
    },
    {
      href: '/participant/transactions',
      icon: IconFileText,
      label: 'Transactions',
      description: 'View transaction history',
      color: 'bg-purple-500',
    },
    {
      href: '/participant/profile',
      icon: IconSettings,
      label: 'Settings',
      description: 'Update your profile',
      color: 'bg-orange-500',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Manage your account</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <button className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-all hover:shadow-sm w-full text-left group">
              <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center text-white shrink-0', action.color)}>
                <action.icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold mb-0.5 group-hover:text-primary transition-colors">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
              <IconChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Helper function to fetch portfolio allocations
 */
async function getPortfolioAllocations(portfolioId: string) {
  return customInstance<ModelPortfolioDTO['allocations']>({
    url: `/model-portfolios/${portfolioId}/allocations`,
    method: 'GET',
  });
}

/**
 * Investment Holdings Card
 */
function InvestmentHoldingsCard() {
  const { data: personalDetails } = useGetParticipantPersonalDetails();
  const participantId = personalDetails?.participantId || '';
  
  const { data: effectivePortfolio, isLoading: portfolioLoading } = useGetEffectivePortfolio(
    participantId,
    {
      query: {
        enabled: !!participantId,
      },
    }
  );

  const portfolioId = effectivePortfolio?.id;
  
  const { data: allocations, isLoading: allocationsLoading } = useQuery({
    queryKey: ['portfolio-allocations', portfolioId],
    queryFn: () => getPortfolioAllocations(portfolioId!),
    enabled: !!portfolioId,
  });

  const { data: balanceData, isLoading: balanceLoading } = useGetMyParticipantBalance();

  const isLoading = balanceLoading || portfolioLoading || allocationsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Build holdings from balance data fundMarketValue as the source of truth
  // so displayed values always sum to totalInvestmentValue
  const fundCurrentWeight = balanceData?.fundCurrentWeight ?? {};
  const fundMarketValues = (balanceData?.fundMarketValue ?? {}) as Record<string, number>;
  const fundNamesMap = (balanceData?.fundNames ?? {}) as Record<string, string>;

  // Build a lookup from portfolio allocations for extra metadata
  const allocMap = new Map<string, { name: string; allocationPercent: number }>();
  if (allocations && allocations.length > 0) {
    for (const alloc of allocations) {
      if (alloc.fundId) {
        allocMap.set(alloc.fundId, {
          name: alloc.fundName ?? 'Unknown Fund',
          allocationPercent: Number(alloc.allocationPercentage || 0),
        });
      }
    }
  }

  const holdings = Object.entries(fundMarketValues).map(([fundId, value]) => {
    const allocInfo = allocMap.get(fundId);
    return {
      fundName: allocInfo?.name ?? fundNamesMap[fundId] ?? fundId,
      value: value ?? 0,
      allocationPercent: allocInfo?.allocationPercent ?? 0,
      currentWeight: (fundCurrentWeight as Record<string, number | undefined>)?.[fundId] ?? 0,
    };
  });
  const totalValue = balanceData?.totalInvestmentValue ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Investment Holdings</CardTitle>
            <CardDescription>Your current fund allocations</CardDescription>
          </div>
          <Link href="/participant/portfolio">
            <Button variant="ghost" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {holdings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
              <IconWallet className="h-8 w-8 text-blue-600" />
            </div>
            <p className="font-semibold mb-1">No Investments Yet</p>
            <p className="text-sm text-muted-foreground mb-4">Start investing to grow your retirement savings</p>
            <Link href="/participant/portfolio">
              <Button size="sm">
                View Investment Options
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {holdings.slice(0, 5).map((holding: any, index: number) => {
              const fundValue = holding.value ?? 0;
              // Use allocation percentage from portfolio if available, otherwise calculate from market value
              const percentage = holding.allocationPercent > 0 
                ? holding.allocationPercent 
                : (totalValue > 0 ? (fundValue / totalValue) * 100 : 0);
              
              // Use actual current weight for progress bar (based on market values)
              const progressBarWidth = holding.currentWeight > 0
                ? holding.currentWeight
                : (totalValue > 0 ? (fundValue / totalValue) * 100 : 0);

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{holding.fundName ?? 'Unknown Fund'}</p>
                      <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}% allocation</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold">{formatCurrency(fundValue)}</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${progressBarWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {holdings.length > 5 && (
              <Link href="/participant/portfolio">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View All {holdings.length} Holdings
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Tasks Card
 */
function TasksCard() {
  const { data: tasksData, isLoading } = useGetParticipantTasks({ size: 5 });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const tasks = (tasksData?.content ?? []) as TaskDTO[];
  const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tasks & Alerts</CardTitle>
            <CardDescription>
              {pendingTasks.length > 0 ? `${pendingTasks.length} pending` : 'All caught up'}
            </CardDescription>
          </div>
          {tasks.length > 0 && (
            <Link href="/participant/tasks">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <IconCheck className="h-8 w-8 text-green-600" />
            </div>
            <p className="font-semibold mb-1">All Caught Up!</p>
            <p className="text-sm text-muted-foreground">No pending tasks</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => toast.info('Task', task.description ?? task.title)}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    task.status?.toLowerCase() === 'completed'
                      ? 'bg-green-100 text-green-600'
                      : task.overdue
                        ? 'bg-red-100 text-red-600'
                        : 'bg-blue-100 text-blue-600'
                  )}
                >
                  {task.status?.toLowerCase() === 'completed' ? (
                    <IconCheck className="h-5 w-5" />
                  ) : task.overdue ? (
                    <IconAlertTriangle className="h-5 w-5" />
                  ) : (
                    <IconBell className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1">{task.description ?? task.title}</p>
                  {task.dueDate && (
                    <p className={cn('text-xs', task.overdue ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                      {task.overdue ? 'Overdue: ' : 'Due: '}{task.dueDate}
                    </p>
                  )}
                </div>
                <Badge
                  variant={
                    task.status?.toLowerCase() === 'completed'
                      ? 'default'
                      : task.overdue
                        ? 'destructive'
                        : 'secondary'
                  }
                  className="shrink-0"
                >
                  {task.status?.toLowerCase() === 'completed' ? 'Done' : task.overdue ? 'Overdue' : 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Activity Feed Card
 */
function ActivityFeedCard() {
  const { data: activitiesData, isLoading } = useGetParticipantActivities({ size: 10 });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activities = (activitiesData?.content ?? []) as ActivityDTO[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest account updates</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <IconBell className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-1 min-h-[400px]">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <IconCheck className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-tight mb-1">{activity.message ?? activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.timeAgo ?? 'Recently'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Participant Dashboard Page
 */
export default function ParticipantDashboardPage() {
  const { data: personalDetails, isLoading } = useGetParticipantPersonalDetails();
  const { data: balanceData } = useGetMyParticipantBalance();
  const { data: projectionData } = useContributionProjectionForCurrentUser();

  const totalValue = balanceData?.totalInvestmentValue ?? 0;
  const totalGainLossPercent = balanceData?.totalGainLossPercentage ?? 0;

  const projection = projectionData as any;
  const perPeriodTotal = projection?.perPeriod?.total ?? ((projection?.perPeriod?.employeePreTax ?? 0) + (projection?.perPeriod?.employeeRoth ?? 0) + (projection?.perPeriod?.employer ?? 0));

  if (isLoading) {
    return (
      <DashboardContent>
        <div className="grid gap-6">
          <Skeleton className="h-64" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Portfolio & Tasks (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <PortfolioOverviewCard />
          <TasksCard />
          <InvestmentHoldingsCard />
        </div>

        {/* Right Column - Sidebar (1/3 width) */}
        <div className="space-y-6">
          <ContributionCard />
          {/* <QuickActionsCard /> */}
          <ActivityFeedCard />
        </div>
      </div>
    </DashboardContent>
  );
}
