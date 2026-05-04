'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconUsers,
  IconCash,
  IconTrendingUp,
  IconShieldCheck,
  IconDownload,
  IconPlus,
  IconAlertTriangle,
  IconCheck,
  IconBell,
  IconArrowRight,
  IconCalendar,
  IconFileText,
  IconChartBar,
  IconClock,
  IconReceipt,
  IconUserPlus,
  IconUpload,
  IconX,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, KpiCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCard, MetricCardGrid } from '@/components/dashboard/metric-card';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { OnboardingStatusModal } from '@/components/onboarding';
import { PlanAssetsChart, ContributionsBarChart, ParticipantsDonutChart } from '@/components/dashboard/charts';
import { useGetDashboard } from '@/api/generated/endpoints/plan-sponsor-dashboard/plan-sponsor-dashboard';
import { useGetComplianceStatus } from '@/api/generated/endpoints/compliance-testing/compliance-testing';
import { useGetActivities } from '@/api/generated/endpoints/activity-log/activity-log';
import { useGetOnBoardingState } from '@/api/generated/endpoints/plan-sponsor-details/plan-sponsor-details';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import type { ActivityDTO } from '@/api/generated/models';
import Link from "next/link";
import {useGetAllNotifications} from "@/api/generated/endpoints/notifications/notifications";


/**
 * Quick Actions Component
 */
function QuickActionsCard() {
  const actions = [
    {
      icon: IconUpload,
      label: 'Upload Payroll',
      description: 'Process new contributions',
      href: '/payrolls',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: IconUserPlus,
      label: 'Add Participant',
      description: 'Invite new employee',
      onClick: () => toast.info('Add Participant', 'Feature coming soon'),
      color: 'bg-green-50 text-green-600',
    },
    {
      icon: IconFileText,
      label: 'View Reports',
      description: 'Access plan reports',
      href: '/reports',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      icon: IconDownload,
      label: 'Export Data',
      description: 'Download plan data',
      onClick: () => toast.info('Export', 'Feature coming soon'),
      color: 'bg-orange-50 text-orange-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconChartBar className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
        <CardDescription>Common tasks for plan management</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-all hover:shadow-md text-left group"
            >
              <div
                className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                  action.color
                )}
              >
                <action.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-0.5 group-hover:text-primary transition-colors">
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationCard() {
  const { data, isLoading } = useGetAllNotifications({
    page: 0,
    size: 2,
  });
  const router = useRouter();

  const notifications = data?.content ?? [];

  return (
      <Card className="rounded-2xl border border-blue-200 bg-blue-50 shadow-sm">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
          <CardTitle className="text-base font-semibold text-gray-900">
            Notifications
          </CardTitle>

          <span
              onClick={() => router.push("/notifications")} 
              className="text-sm font-medium text-blue-600 hover:underline inline-flex items-center cursor-pointer"
          >
            View all
          </span>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-4 pt-2">

          {isLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>

          ) : notifications.length === 0 ? (
              <p className="text-sm text-gray-500">No notifications</p>

          ) : (
              <div className="space-y-4">
                {notifications.map((item, index) => (
                    <div key={item.id || index}>

                      {/* Title */}
                      <p className="text-sm font-medium text-gray-900">
                        {item.title}
                      </p>

                      {/* Message */}
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {item.message}
                      </p>

                      {/* Date */}
                      <p className="text-xs text-gray-400 mt-1">
                        {item.createdAt || ""}
                      </p>

                      {/* Time ago */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span className="text-xs text-gray-500">
                    {item.timeAgo}
                  </span>
                      </div>

                      {/* Divider */}
                      {index !== notifications.length - 1 && (
                          <div className="border-t border-gray-200 mt-4"></div>
                      )}
                    </div>
                ))}
              </div>
          )}
        </CardContent>
      </Card>
  )
}
/**
 * Alert Banner Component
 */
function AlertBanner({ complianceData }: { complianceData: any }) {
  const needsAttention = complianceData?.needsAttention ?? 0;
  const warning = complianceData?.warning ?? 0;

  if (needsAttention === 0 && warning === 0) return null;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <IconAlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900 mb-1">Action Required</h3>
            <p className="text-sm text-orange-800 mb-3">
              {needsAttention > 0
                ? `${needsAttention} compliance ${needsAttention === 1 ? 'test requires' : 'tests require'} immediate attention.`
                : `${warning} compliance ${warning === 1 ? 'warning' : 'warnings'} detected.`}
            </p>
            <Button size="sm" variant="outline" className="bg-white hover:bg-orange-50 border-orange-300">
              View Details
              <IconArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0">
            <IconX className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Upcoming Tasks Component
 */
function UpcomingTasksCard() {
  const tasks = [
    {
      title: 'Q1 Compliance Testing Due',
      date: 'March 31, 2026',
      priority: 'high' as const,
      icon: IconShieldCheck,
    },
    {
      title: 'February Payroll Upload',
      date: 'February 28, 2026',
      priority: 'medium' as const,
      icon: IconReceipt,
    },
    {
      title: 'Quarterly Plan Review',
      date: 'March 15, 2026',
      priority: 'low' as const,
      icon: IconFileText,
    },
  ];

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconClock className="h-5 w-5 text-primary" />
          Upcoming Deadlines
        </CardTitle>
        <CardDescription>Important dates and tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <task.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-sm">{task.title}</p>
                  <Badge variant="outline" className={cn('text-xs shrink-0', priorityColors[task.priority])}>
                    {task.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <IconCalendar className="h-3 w-3" />
                  {task.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading Skeleton for Dashboard
 */
function DashboardSkeleton() {
  return (
    <DashboardContent>
      <MetricCardGrid columns={4}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </MetricCardGrid>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardContent>
  );
}

/**
 * Error State Component
 */
function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <DashboardContent>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconAlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Dashboard</h3>
          <p className="text-muted-foreground text-center mb-4">
            There was an error loading the dashboard data. Please try again.
          </p>
          <Button onClick={onRetry}>Retry</Button>
        </CardContent>
      </Card>
    </DashboardContent>
  );
}

/**
 * Compliance Status Card Component
 */
function ComplianceStatusCard() {
  const { data: complianceData, isLoading } = useGetComplianceStatus();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
          <CardDescription>Annual testing results</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const needsAttention = complianceData?.needsAttention ?? 0;
  const warning = complianceData?.warning ?? 0;
  const passed = complianceData?.passes ?? 0;
  const total = passed + warning + needsAttention;
  const router = useRouter();

  const overallStatus = needsAttention > 0 ? 'attention' : warning > 0 ? 'warning' : 'compliant';

  const stats = [
    { label: 'Passed', value: passed, color: 'bg-green-500', textColor: 'text-green-700' },
    { label: 'Warnings', value: warning, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
    { label: 'Issues', value: needsAttention, color: 'bg-red-500', textColor: 'text-red-700' },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle>Compliance Status</CardTitle>
        <CardDescription>Annual testing results</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {/* Status Badge */}
        <div className="flex items-center justify-center mb-6">
          <div
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl p-6 w-full',
              overallStatus === 'compliant'
                ? 'bg-green-50 border-2 border-green-200'
                : overallStatus === 'warning'
                  ? 'bg-yellow-50 border-2 border-yellow-200'
                  : 'bg-red-50 border-2 border-red-200'
            )}
          >
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full mb-3',
                overallStatus === 'compliant'
                  ? 'bg-green-100'
                  : overallStatus === 'warning'
                    ? 'bg-yellow-100'
                    : 'bg-red-100'
              )}
            >
              {overallStatus === 'compliant' ? (
                <IconCheck
                  className={cn(
                    'h-6 w-6',
                    overallStatus === 'compliant' ? 'text-green-600' : ''
                  )}
                />
              ) : (
                <IconAlertTriangle
                  className={cn(
                    'h-6 w-6',
                    overallStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  )}
                />
              )}
            </div>
            <p
              className={cn(
                'text-xl font-bold mb-1',
                overallStatus === 'compliant'
                  ? 'text-green-900'
                  : overallStatus === 'warning'
                    ? 'text-yellow-900'
                    : 'text-red-900'
              )}
            >
              {overallStatus === 'compliant'
                ? 'All Tests Passed'
                : overallStatus === 'warning'
                  ? 'Needs Review'
                  : 'Action Required'}
            </p>
            <p className="text-sm text-muted-foreground">
              {passed} of {total} tests passed
            </p>
          </div>
        </div>

        {/* Stats Breakdown */}
        <div className="space-y-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('h-2 w-2 rounded-full', stat.color)} />
                <span className="text-sm font-medium">{stat.label}</span>
              </div>
              <span className={cn('text-sm font-bold', stat.textColor)}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* View Details Button */}
        {total > 0 && (
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All Tests
            <IconArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}

        <div className="mt-4 text-center">
          <span
              onClick={() => router.push("/compliance")} // 👉 update route if needed
              className="text-sm font-medium text-blue-600 hover:underline inline-flex items-center cursor-pointer"
          >
            View compliance dashboard
            <IconArrowRight className="ml-1 h-4 w-4" />
          </span>
        </div>

      </CardContent>
    </Card>
  );
}

/**
 * Activity Feed Component
 */
function ActivityFeedCard() {
  const { data: activitiesData, isLoading } = useGetActivities({ size: 6 });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activities = activitiesData?.content ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconBell className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest updates in your plan</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <IconBell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity: ActivityDTO) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <IconCheck className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight mb-1">
                    {activity.message ?? activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.timeAgo ?? 'Recently'}
                  </p>
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
 * Sponsor Dashboard Page
 */
export default function SponsorDashboardPage() {
  const router = useRouter();

  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = useGetDashboard();

  const { data: complianceData } = useGetComplianceStatus();

  // Check onboarding state and redirect if incomplete
  const { data: onboardingState } = useGetOnBoardingState();

  useEffect(() => {
    const documentsStatus = sessionStorage.getItem('documentsStatus');

    if (onboardingState?.currentState && onboardingState.currentState !== 'DASHBOARD') {
      const stateRouteMap: Record<string, string> = {
        COMPANY_BASIC_DETAILS: ROUTES.GET_STARTED.COMPANY_INFO,
        EMPLOYMENT_STATUS: ROUTES.GET_STARTED.EMPLOYMENT_STATUS,
        BUSINESS_SIZE: ROUTES.GET_STARTED.BUSINESS_SIZE,
        EXISTING_PLAN: ROUTES.GET_STARTED.EXISTING_PLAN,
        MULTIPLE_BUSINESSES: ROUTES.GET_STARTED.MULTIPLE_BUSINESSES,
        PAYROLL_PROVIDER: ROUTES.GET_STARTED.PAYROLL_PROVIDER,
        PLAN_RECOMMENDATION: ROUTES.GET_STARTED.PLAN_RECOMMENDATION,
        PLAN_DETAILS: ROUTES.GET_STARTED.PLAN_RECOMMENDATION,
        BUSINESS_DETAILS: ROUTES.GET_STARTED.BUSINESS_DETAILS,
        PRICING: ROUTES.GET_STARTED.REVIEW_PRICING,
        CHECKOUT: ROUTES.GET_STARTED.CHECKOUT,
        PLAN_START_DATE: ROUTES.GET_STARTED.CONFIRM_PLAN_START_DATE,
        TRUSTEE: ROUTES.GET_STARTED.CONFIRM_TRUSTEE,
        AUTHORIZE_PROVIDER: ROUTES.GET_STARTED.AUTHORIZE_PROVIDER,
        SIGN: ROUTES.GET_STARTED.REVIEW_AND_SIGN_DOCUMENT,
        BANK_VERIFICATION: ROUTES.GET_STARTED.BANK_ACCOUNT,
        FINCH: ROUTES.GET_STARTED.FINCH_CONNECT,
      };

      const redirectRoute = stateRouteMap[onboardingState.currentState];

      if (redirectRoute && !(onboardingState.currentState === 'SIGN' && documentsStatus === 'pending')) {
        console.log('Onboarding incomplete, redirecting to:', onboardingState.currentState, '→', redirectRoute);
        router.push(redirectRoute);
      } else if (onboardingState.currentState === 'SIGN' && documentsStatus === 'pending') {
        console.log('Documents pending - staying on metrics, showing status modal');
      }
    }
  }, [onboardingState, router]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError onRetry={() => refetch()} />;
  }

  const totalAssets = dashboardData?.planAssets?.totalAssets ?? 0;
  const changePercent = dashboardData?.planAssets?.changePercent ?? 0;
  const totalParticipants = dashboardData?.participants?.totalParticipants ?? 0;
  const participationRate = dashboardData?.participants?.participationRate ?? 0;
  const needsAttention = dashboardData?.complianceStatus?.needsAttention ?? 0;

  return (
    <>
      <OnboardingStatusModal />
      <DashboardContent>
        {/* Alert Banner */}
        <AlertBanner complianceData={complianceData} />

        {/* Key Metrics - LPI cards commented out per request */}
        {/*
        <MetricCardGrid columns={4}>
          <KpiCard
            label="Total Plan Assets"
            value={formatCurrency(totalAssets)}
            description={
              changePercent !== 0
                ? `${changePercent > 0 ? '+' : ''}${changePercent}% vs last month`
                : 'Total plan balance'
            }
          />
          <KpiCard
            label="Total Participants"
            value={totalParticipants.toLocaleString()}
            description="Active enrollees"
          />
          <KpiCard
            label="Participation Rate"
            value={formatPercent(participationRate)}
            description="Of eligible employees"
          />
          <KpiCard
            label="Compliance Status"
            value={needsAttention === 0 ? 'Compliant' : `${needsAttention} Issues`}
            description={needsAttention === 0 ? 'All tests passed' : 'Needs attention'}
          />
        </MetricCardGrid>
        */}

        {/* Main Dashboard Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Charts and Analytics (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plan Assets Chart */}
            <PlanAssetsChart
                data={{
                  historicalData: dashboardData?.planAssets?.history?.map((h) => ({
                    date: h.date,
                    total: (h.employeeValue ?? 0) + (h.employerValue ?? 0),
                  })) ?? [],
                  totalAssets: dashboardData?.planAssets?.totalAssets,
                }}
            />

            {/* Bottom Row - Two Charts Side by Side */}
            <div className="grid gap-6 md:grid-cols-2">
              <ParticipantsDonutChart data={dashboardData?.participants} />
              <ComplianceStatusCard />
            </div>

            {/* Contributions Chart */}
            <ContributionsBarChart
              data={{
                monthlyContributions: dashboardData?.contributions?.monthlyContributions
                  ? Object.values(dashboardData.contributions.monthlyContributions).map((mc) => ({
                      month: mc.month,
                      employeeContributions: mc.employeeAmount,
                      employerContributions: mc.employerAmount,
                    }))
                  : []
              }}
            />
          </div>

          {/* Right Column - Sidebar (1/3 width) */}
          <div className="space-y-6">
            {/* Quick Actions */}
            {/*<QuickActionsCard />*/}
            <NotificationCard />

            {/* Upcoming Tasks */}
            <UpcomingTasksCard />

            {/* Activity Feed */}
            <ActivityFeedCard />
          </div>
        </div>
      </DashboardContent>
    </>
  );
}
