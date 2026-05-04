'use client';

import {
  IconServer,
  IconDatabase,
  IconStack3,
  IconMessage,
  IconAlertTriangle,
  IconRefresh,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconActivity,
  IconCpu,
  IconUsers,
  IconBuildingBank,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useGetSystemHealth, useGetDashboardStats } from '@/api/generated/endpoints/super-admin-dashboard/super-admin-dashboard';
import type { SystemHealthDTO, DashboardStatsDTO } from '@/api/generated/models';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * Page Header Component
 */
function PageHeader({ onRefresh, isRefreshing }: { onRefresh: () => void; isRefreshing: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
        <p className="text-muted-foreground">
          Monitor system status and service health
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          <IconRefresh className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>
    </div>
  );
}

/**
 * Overall Status Card
 */
function OverallStatusCard({ health }: { health: SystemHealthDTO | undefined }) {
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'UP':
      case 'HEALTHY':
        return 'text-success';
      case 'DOWN':
      case 'UNHEALTHY':
        return 'text-error';
      case 'DEGRADED':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'UP':
      case 'HEALTHY':
        return <IconCircleCheck className="h-8 w-8 text-success" />;
      case 'DOWN':
      case 'UNHEALTHY':
        return <IconCircleX className="h-8 w-8 text-error" />;
      case 'DEGRADED':
        return <IconAlertTriangle className="h-8 w-8 text-warning" />;
      default:
        return <IconServer className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const formatUptime = (seconds: number | undefined) => {
    if (!seconds) return 'Unknown';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">System Status</CardTitle>
        <CardDescription>Overall platform health</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          {getStatusIcon(health?.status)}
          <div>
            <p className={cn("text-2xl font-bold", getStatusColor(health?.status))}>
              {health?.status ?? 'UNKNOWN'}
            </p>
            <p className="text-sm text-muted-foreground">
              Version {health?.version ?? 'Unknown'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <IconClock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Uptime</span>
            </div>
            <p className="text-lg font-semibold">{formatUptime(health?.uptime)}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <IconActivity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">API Requests/min</span>
            </div>
            <p className="text-lg font-semibold">{health?.apiRequestsPerMinute ?? 0}</p>
          </div>
        </div>

        {health?.lastCheckedAt && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Last checked: {format(new Date(health.lastCheckedAt), 'MMM d, yyyy HH:mm:ss')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Service Status Card
 */
function ServiceStatusCard({
  name,
  status,
  icon: Icon,
  description,
}: {
  name: string;
  status: string | undefined;
  icon: typeof IconDatabase;
  description: string;
}) {
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'UP':
      case 'HEALTHY':
      case 'CONNECTED':
        return 'text-success bg-success/10';
      case 'DOWN':
      case 'UNHEALTHY':
      case 'DISCONNECTED':
        return 'text-error bg-error/10';
      case 'DEGRADED':
        return 'text-warning bg-warning/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusBadgeClasses = (status: string | undefined) => {
    switch (status) {
      case 'UP':
      case 'HEALTHY':
      case 'CONNECTED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DOWN':
      case 'UNHEALTHY':
      case 'DISCONNECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'DEGRADED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", getStatusColor(status))}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">{name}</h3>
              <Badge variant="outline" className={getStatusBadgeClasses(status)}>
                {status ?? 'UNKNOWN'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Platform Stats Card
 */
function PlatformStatsCard({ stats }: { stats: DashboardStatsDTO | undefined }) {
  const statItems = [
    {
      label: 'Active Tenants',
      value: stats?.activeTenants ?? 0,
      total: stats?.totalTenants ?? 0,
      icon: IconBuildingBank,
    },
    {
      label: 'Active Users',
      value: stats?.activeUsers ?? 0,
      total: stats?.totalUsers ?? 0,
      icon: IconUsers,
    },
    {
      label: 'API Calls Today',
      value: stats?.apiCallsToday ?? 0,
      icon: IconActivity,
    },
    {
      label: 'Storage Used',
      value: `${stats?.storageUsedGB ?? 0} GB`,
      icon: IconDatabase,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Platform Statistics</CardTitle>
        <CardDescription>Current platform usage metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statItems.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{stat.label}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </span>
                {stat.total !== undefined && (
                  <span className="text-muted-foreground text-sm ml-1">
                    / {stat.total.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * System Health Page
 */
export default function SystemHealthPage() {
  const {
    data: healthData,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
    isRefetching: isRefetchingHealth,
  } = useGetSystemHealth();

  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
    isRefetching: isRefetchingStats,
  } = useGetDashboardStats();

  const handleRefresh = () => {
    refetchHealth();
    refetchStats();
  };

  const isRefreshing = isRefetchingHealth || isRefetchingStats;

  if (healthLoading) {
    return (
      <DashboardContent>
        <PageHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </DashboardContent>
    );
  }

  if (healthError) {
    return (
      <DashboardContent>
        <PageHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconAlertTriangle className="h-12 w-12 text-error mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load System Health</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was an error loading system health information.
            </p>
            <Button onClick={() => refetchHealth()}>
              <IconRefresh className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </DashboardContent>
    );
  }

  const health = healthData as SystemHealthDTO;
  const stats = statsData as DashboardStatsDTO;

  const services = [
    {
      name: 'PostgreSQL Database',
      status: health.databaseStatus,
      icon: IconDatabase,
      description: 'Primary database for application data storage',
    },
    {
      name: 'Redis Cache',
      status: health.cacheStatus,
      icon: IconStack3,
      description: 'Distributed cache and session storage',
    },
    {
      name: 'Kafka Message Queue',
      status: health.queueStatus,
      icon: IconMessage,
      description: 'Event-driven messaging and async processing',
    },
  ];

  return (
    <DashboardContent>
      <PageHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      {/* Main Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        <OverallStatusCard health={health} />
        <PlatformStatsCard stats={stats} />
      </div>

      {/* Service Status */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Service Health</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {services.map((service) => (
            <ServiceStatusCard
              key={service.name}
              name={service.name}
              status={service.status}
              icon={service.icon}
              description={service.description}
            />
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Application Version</p>
              <p className="font-semibold">{health.version ?? 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Participants</p>
              <p className="font-semibold">{stats?.totalParticipants?.toLocaleString() ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recent Impersonations</p>
              <p className="font-semibold">{stats?.recentImpersonations ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Health Check</p>
              <p className="font-semibold">
                {health.lastCheckedAt
                  ? format(new Date(health.lastCheckedAt), 'HH:mm:ss')
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardContent>
  );
}
