'use client';

import { useState } from 'react';
import {
  IconShieldCheck,
  IconAlertTriangle,
  IconRefresh,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconDownload,
  IconActivity,
  IconCalendar,
  IconFileText,
  IconShield,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useGetAuditLogs2 } from '@/api/generated/endpoints/platform-audit-logs/platform-audit-logs';
import { useGetAuditLogs1 } from '@/api/generated/endpoints/impersonation/impersonation';
import type { PlatformAuditLogDTO, ImpersonationAuditLogDTO } from '@/api/generated/models';
import { format, subDays, subMonths } from 'date-fns';
import { toast } from '@/lib/toast';

/**
 * Page Header Component
 */
function PageHeader() {
  const handleExport = () => {
    toast.info('Export', 'Export functionality coming soon');
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Comprehensive audit trail of all platform activities, including impersonation sessions
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <IconDownload className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}

/**
 * Action Badge
 */
function ActionBadge({ action }: { action: string | undefined }) {
  if (!action) return null;

  const actionLower = action.toLowerCase();

  const badgeConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    create: { variant: 'default' },
    update: { variant: 'secondary' },
    delete: { variant: 'destructive' },
    login: { variant: 'outline' },
    logout: { variant: 'outline' },
    suspend: { variant: 'destructive' },
    activate: { variant: 'default' },
  };

  const config = badgeConfig[actionLower] ?? { variant: 'outline' as const };

  return <Badge variant={config.variant}>{action}</Badge>;
}

/**
 * Platform Audit Logs Table Component
 */
function PlatformAuditLogsTable({
  logs,
  isLoading,
}: {
  logs: PlatformAuditLogDTO[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="flex-1 h-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <IconFileText className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-lg font-semibold mb-2">No Audit Logs Found</h3>
        <p className="text-muted-foreground text-center">
          No audit logs match your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">Timestamp</th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">Action</th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">Resource</th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">Performed By</th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">IP Address</th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b hover:bg-muted/50">
                <td className="p-4">
                  <span className="text-sm font-mono">
                    {log.createdAt
                      ? format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')
                      : 'N/A'}
                  </span>
                </td>
                <td className="p-4">
                  <ActionBadge action={log.action} />
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{log.resourceType ?? 'N/A'}</p>
                    {log.resourceId && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {log.resourceId.slice(0, 8)}...
                      </p>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    <p className="text-sm">{log.performedByEmail ?? 'System'}</p>
                    {log.performedBy && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {log.performedBy.slice(0, 8)}...
                      </p>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-sm font-mono">{log.ipAddress ?? 'N/A'}</span>
                </td>
                <td className="p-4 max-w-xs">
                  {log.changes && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-primary hover:underline">
                        View Changes
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-32 text-xs">
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    </details>
                  )}
                  {log.userAgent && (
                    <div className="text-xs text-muted-foreground truncate" title={log.userAgent}>
                      {log.userAgent.slice(0, 40)}...
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Impersonation Audit Logs Table Component
 */
function ImpersonationAuditLogsTable({
  logs,
  isLoading,
}: {
  logs: ImpersonationAuditLogDTO[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="flex-1 h-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <IconShield className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-lg font-semibold mb-2">No Impersonation Logs Found</h3>
        <p className="text-muted-foreground text-center">
          No impersonation audit logs match your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">Timestamp</th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">Action</th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">Session ID</th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">Super Admin</th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">Impersonated User</th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">IP Address</th>
              <th className="text-left p-4 font-medium text-sm text-muted-foreground">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={log.id || index} className="border-b hover:bg-muted/50">
                <td className="p-4">
                  <span className="text-sm font-mono">
                    {log.timestamp
                      ? format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')
                      : 'N/A'}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      log.actionType === 'IMPERSONATION_STARTED'
                        ? 'bg-green-50 text-green-700 ring-green-600/20'
                        : log.actionType === 'IMPERSONATION_ENDED'
                          ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                          : log.actionType === 'SESSION_REVOKED'
                            ? 'bg-red-50 text-red-700 ring-red-600/20'
                            : 'bg-gray-50 text-gray-700 ring-gray-600/20'
                    }`}
                  >
                    {log.actionType}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-mono text-xs">
                    {log.impersonationSessionId
                      ? `${log.impersonationSessionId.slice(0, 8)}...`
                      : 'N/A'}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-sm">{log.superAdminId || 'N/A'}</span>
                </td>
                <td className="p-4">
                  <span className="text-sm">{log.impersonatedUserId || 'N/A'}</span>
                </td>
                <td className="p-4">
                  <span className="text-sm font-mono">{log.ipAddress || 'N/A'}</span>
                </td>
                <td className="p-4 max-w-xs">
                  <span className="text-sm truncate">{log.description || 'No details'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Pagination Component
 */
function Pagination({
  page,
  totalPages,
  pageSize,
  totalElements,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-4 border-t">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page:</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {totalElements > 0 ? `${page * pageSize + 1}-${Math.min((page + 1) * pageSize, totalElements)} of ${totalElements}` : '0 results'}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
        >
          <IconChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
        >
          <IconChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Stats Cards Component
 */
function StatsCards({
  platformTotal,
  impersonationTotal,
}: {
  platformTotal: number;
  impersonationTotal: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          <IconFileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{platformTotal + impersonationTotal}</div>
          <p className="text-xs text-muted-foreground">All audit log entries</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Platform Actions</CardTitle>
          <IconActivity className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{platformTotal}</div>
          <p className="text-xs text-muted-foreground">CRUD operations</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Impersonation Events</CardTitle>
          <IconShield className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{impersonationTotal}</div>
          <p className="text-xs text-muted-foreground">Impersonation activities</p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Audit Log Page
 */
export default function AuditLogPage() {
  const [activeTab, setActiveTab] = useState('platform');
  const [platformPage, setPlatformPage] = useState(0);
  const [impersonationPage, setImpersonationPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [dateRange, setDateRange] = useState('7d');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case '24h':
        return { startDate: format(subDays(now, 1), 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd') };
      case '7d':
        return { startDate: format(subDays(now, 7), 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd') };
      case '30d':
        return { startDate: format(subDays(now, 30), 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd') };
      case '90d':
        return { startDate: format(subMonths(now, 3), 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd') };
      default:
        return { startDate: format(subDays(now, 7), 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd') };
    }
  };

  const { startDate, endDate } = getDateRange();

  // Fetch platform audit logs
  const {
    data: platformAuditData,
    isLoading: platformLoading,
    error: platformError,
    refetch: refetchPlatform,
  } = useGetAuditLogs2({
    pageable: {
      page: platformPage,
      size: pageSize,
    },
    startDate,
    endDate,
    action: actionFilter !== 'all' ? actionFilter : undefined,
    resourceType: resourceFilter !== 'all' ? resourceFilter : undefined,
  });

  // Fetch impersonation audit logs
  const {
    data: impersonationAuditData,
    isLoading: impersonationLoading,
  } = useGetAuditLogs1({
    pageable: {
      page: impersonationPage,
      size: pageSize,
    },
  });

  const platformLogs = (platformAuditData?.content ?? []) as PlatformAuditLogDTO[];
  const platformTotalElements = platformAuditData?.totalElements ?? 0;
  const platformTotalPages = platformAuditData?.totalPages ?? 0;

  const impersonationLogs = (impersonationAuditData?.content ?? []) as ImpersonationAuditLogDTO[];
  const impersonationTotalElements = impersonationAuditData?.totalElements ?? 0;
  const impersonationTotalPages = impersonationAuditData?.totalPages ?? 0;

  if (platformError) {
    return (
      <DashboardContent>
        <PageHeader />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconAlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Audit Logs</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was an error loading the audit logs.
            </p>
            <Button onClick={() => refetchPlatform()}>
              <IconRefresh className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <div className="space-y-8">
        <PageHeader />

        {/* Stats */}
        <StatsCards
          platformTotal={platformTotalElements}
          impersonationTotal={impersonationTotalElements}
        />

        {/* Tabs for Platform and Impersonation Logs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="platform" className="flex items-center gap-2">
              <IconActivity className="h-4 w-4" />
              Platform Logs
            </TabsTrigger>
            <TabsTrigger value="impersonation" className="flex items-center gap-2">
              <IconShield className="h-4 w-4" />
              Impersonation Logs
            </TabsTrigger>
          </TabsList>

          {/* Platform Audit Logs Tab */}
          <TabsContent value="platform" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-40">
                      <IconCalendar className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-40">
                      <IconFilter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="CREATE">Create</SelectItem>
                      <SelectItem value="UPDATE">Update</SelectItem>
                      <SelectItem value="DELETE">Delete</SelectItem>
                      <SelectItem value="LOGIN">Login</SelectItem>
                      <SelectItem value="LOGOUT">Logout</SelectItem>
                      <SelectItem value="SUSPEND">Suspend</SelectItem>
                      <SelectItem value="ACTIVATE">Activate</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={resourceFilter} onValueChange={setResourceFilter}>
                    <SelectTrigger className="w-40">
                      <IconActivity className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Resource" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Resources</SelectItem>
                      <SelectItem value="TENANT">Tenant</SelectItem>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="PARTICIPANT">Participant</SelectItem>
                      <SelectItem value="PLAN">Plan</SelectItem>
                      <SelectItem value="CONTRIBUTION">Contribution</SelectItem>
                      <SelectItem value="CONFIG">Config</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1" />
                  <div className="text-sm text-muted-foreground">
                    Showing {platformLogs.length} of {platformTotalElements} entries
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Audit Logs Table */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Activity Log</CardTitle>
                <CardDescription>
                  CRUD operations and administrative actions ({startDate} to {endDate})
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <PlatformAuditLogsTable logs={platformLogs} isLoading={platformLoading} />
                {!platformLoading && platformLogs.length > 0 && (
                  <Pagination
                    page={platformPage}
                    totalPages={platformTotalPages}
                    pageSize={pageSize}
                    totalElements={platformTotalElements}
                    onPageChange={setPlatformPage}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      setPlatformPage(0);
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Impersonation Audit Logs Tab */}
          <TabsContent value="impersonation" className="space-y-6">
            {/* Impersonation Audit Logs Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Impersonation Activity Log</CardTitle>
                    <CardDescription>
                      Complete audit trail of impersonation sessions and actions
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <IconFilter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ImpersonationAuditLogsTable
                  logs={impersonationLogs}
                  isLoading={impersonationLoading}
                />
                {!impersonationLoading && impersonationLogs.length > 0 && (
                  <Pagination
                    page={impersonationPage}
                    totalPages={impersonationTotalPages}
                    pageSize={pageSize}
                    totalElements={impersonationTotalElements}
                    onPageChange={setImpersonationPage}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      setImpersonationPage(0);
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardContent>
  );
}
