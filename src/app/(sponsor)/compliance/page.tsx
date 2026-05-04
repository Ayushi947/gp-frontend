'use client';

import {
  IconShieldCheck,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconRefresh,
  IconDownload,
  IconCalendar,
  IconInfoCircle,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import {
  useGetComplianceStatus,
  useGetEmployeeComplianceData,
} from '@/api/generated/endpoints/compliance-testing/compliance-testing';
import type { ComplianceTestSummaryDTO, EmployeeComplianceDataDTO } from '@/api/generated/models';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';

/**
 * Page Header Component
 */
function PageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
        <p className="text-muted-foreground">
          Monitor IRS compliance tests and requirements
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => toast.info('Export', 'Feature coming soon')}>
          <IconDownload className="mr-2 h-4 w-4" />
          Export Report
        </Button>
        <Button size="sm" onClick={() => toast.info('Run Tests', 'Feature coming soon')}>
          <IconRefresh className="mr-2 h-4 w-4" />
          Run Tests
        </Button>
      </div>
    </div>
  );
}

/**
 * Status Badge Component
 */
function TestStatusBadge({ status }: { status: string | undefined }) {
  if (!status) return null;

  const statusLower = status.toLowerCase();
  const variant = statusLower === 'pass' || statusLower === 'passed' ? 'default' :
    statusLower === 'fail' || statusLower === 'failed' ? 'destructive' :
      statusLower === 'warning' ? 'secondary' : 'outline';

  const icon = statusLower === 'pass' || statusLower === 'passed' ? (
    <IconCheck className="h-3 w-3 mr-1" />
  ) : statusLower === 'fail' || statusLower === 'failed' ? (
    <IconX className="h-3 w-3 mr-1" />
  ) : statusLower === 'warning' ? (
    <IconAlertTriangle className="h-3 w-3 mr-1" />
  ) : null;

  return (
    <Badge variant={variant} className="capitalize flex items-center">
      {icon}
      {status}
    </Badge>
  );
}

/**
 * Compliance Summary Cards
 */
function ComplianceSummary({
  needsAttention,
  warning,
  passes,
  loading,
}: {
  needsAttention: number;
  warning: number;
  passes: number;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-success/50 bg-success/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tests Passed
          </CardTitle>
          <IconCheck className="h-5 w-5 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-success">{passes}</div>
          <p className="text-xs text-muted-foreground mt-1">All requirements met</p>
        </CardContent>
      </Card>

      <Card className="border-warning/50 bg-warning/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Warnings
          </CardTitle>
          <IconAlertTriangle className="h-5 w-5 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-warning">{warning}</div>
          <p className="text-xs text-muted-foreground mt-1">Review recommended</p>
        </CardContent>
      </Card>

      <Card className="border-error/50 bg-error/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Needs Attention
          </CardTitle>
          <IconX className="h-5 w-5 text-error" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-error">{needsAttention}</div>
          <p className="text-xs text-muted-foreground mt-1">Action required</p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Compliance Tests Table
 */
function ComplianceTestsTable({
  tests,
  loading,
}: {
  tests: ComplianceTestSummaryDTO[] | undefined;
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
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="flex-1 h-4" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const testsList = tests ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Compliance Tests</CardTitle>
        <CardDescription>Annual IRS compliance test results</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {testsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <IconShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tests Available</h3>
            <p className="text-muted-foreground text-center">
              No compliance tests have been run yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Test Name</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">HCE Avg</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">NHCE Avg</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Max Allowed</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Test Date</th>
                </tr>
              </thead>
              <tbody>
                {testsList.map((test, index) => (
                  <tr key={test.id ?? index} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <span className="font-medium">{test.testName ?? '-'}</span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {test.testType ?? '-'}
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {test.hceAverage !== undefined ? formatPercent(test.hceAverage) : '-'}
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {test.nhcAverage !== undefined ? formatPercent(test.nhcAverage) : '-'}
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {test.maxAllowed !== undefined ? formatPercent(test.maxAllowed) : '-'}
                    </td>
                    <td className="p-4">
                      <TestStatusBadge status={test.status} />
                    </td>
                    <td className="p-4 text-sm">
                      {test.testDate
                        ? format(new Date(test.testDate), 'MMM d, yyyy')
                        : '-'}
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
 * Employee Compliance Data Table
 */
function EmployeeComplianceTable({
  employees,
  loading,
}: {
  employees: EmployeeComplianceDataDTO[] | undefined;
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
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const employeeList = employees ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Employee Compliance Data</CardTitle>
        <CardDescription>HCE/NHCE breakdown and deferral rates</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {employeeList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <IconInfoCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Employee Data</h3>
            <p className="text-muted-foreground text-center">
              No employee compliance data available.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Employee</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Classification</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">ADP %</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">ACP %</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Balance</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">YTD Contributions</th>
                </tr>
              </thead>
              <tbody>
                {employeeList.slice(0, 20).map((employee, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {employee.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <span className="font-medium">{employee.name ?? 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={employee.isHce ? 'default' : 'secondary'}>
                        {employee.isHce ? 'HCE' : 'NHCE'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {employee.adpValue !== undefined
                        ? formatPercent(employee.adpValue)
                        : '-'}
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {employee.acpValue !== undefined
                        ? formatPercent(employee.acpValue)
                        : '-'}
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {employee.adjustedBalanceValue !== undefined
                        ? formatCurrency(employee.adjustedBalanceValue)
                        : '-'}
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {employee.employeeDeferralsValue !== undefined
                        ? formatCurrency(employee.employeeDeferralsValue)
                        : '-'}
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
function ComplianceError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <IconAlertTriangle className="h-12 w-12 text-error mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to Load Compliance Data</h3>
        <p className="text-muted-foreground text-center mb-4">
          There was an error loading the compliance data. Please try again.
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
 * Compliance Page
 */
export default function CompliancePage() {
  const {
    data: complianceStatus,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus,
  } = useGetComplianceStatus();

  const {
    data: employeeData,
    isLoading: isLoadingEmployees,
  } = useGetEmployeeComplianceData();

  const isLoading = isLoadingStatus || isLoadingEmployees;

  if (statusError) {
    return (
      <DashboardContent>
        <PageHeader />
        <ComplianceError onRetry={() => refetchStatus()} />
      </DashboardContent>
    );
  }

  const needsAttention = complianceStatus?.needsAttention ?? 0;
  const warning = complianceStatus?.warning ?? 0;
  const passes = complianceStatus?.passes ?? 0;

  return (
    <DashboardContent>
      <PageHeader />

      {/* Overall Status Banner */}
      {!isLoading && (
        <Card
          className={`border-2 ${
            needsAttention > 0
              ? 'border-error/50 bg-error/5'
              : warning > 0
                ? 'border-warning/50 bg-warning/5'
                : 'border-success/50 bg-success/5'
          }`}
        >
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  needsAttention > 0
                    ? 'bg-error/10 text-error'
                    : warning > 0
                      ? 'bg-warning/10 text-warning'
                      : 'bg-success/10 text-success'
                }`}
              >
                {needsAttention > 0 ? (
                  <IconX className="h-6 w-6" />
                ) : warning > 0 ? (
                  <IconAlertTriangle className="h-6 w-6" />
                ) : (
                  <IconCheck className="h-6 w-6" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {needsAttention > 0
                    ? 'Compliance Issues Detected'
                    : warning > 0
                      ? 'Compliance Warnings Present'
                      : 'Plan is Compliant'}
                </h2>
                <p className="text-muted-foreground">
                  {needsAttention > 0
                    ? `${needsAttention} test(s) require immediate attention`
                    : warning > 0
                      ? `${warning} warning(s) should be reviewed`
                      : 'All compliance tests have passed'}
                </p>
              </div>
              {complianceStatus?.lastUpdated && (
                <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                  <IconCalendar className="h-4 w-4" />
                  <span>
                    Last updated: {format(new Date(complianceStatus.lastUpdated), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <ComplianceSummary
        needsAttention={needsAttention}
        warning={warning}
        passes={passes}
        loading={isLoadingStatus}
      />

      {/* Tests Table */}
      <ComplianceTestsTable tests={complianceStatus?.tests} loading={isLoadingStatus} />

      {/* Employee Data Table */}
      <EmployeeComplianceTable employees={employeeData} loading={isLoadingEmployees} />
    </DashboardContent>
  );
}
