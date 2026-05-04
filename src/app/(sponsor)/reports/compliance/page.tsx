'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconShieldCheck,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconX,
  IconDownload,
  IconInfoCircle,
  IconArrowLeft,
  IconRefresh,
} from '@tabler/icons-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useGetComplianceStatusForYear } from '@/api/generated/endpoints/compliance-testing/compliance-testing';
import { formatDate } from '@/lib/utils';
import { exportReportData } from '@/lib/report-export';
import { toast } from '@/lib/toast';

interface YearSelectorProps {
  selectedYear: number | undefined;
  onYearChange: (year: number) => void;
}

function YearSelector({ selectedYear, onYearChange }: YearSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  return (
    <div className="flex gap-2">
      {years.map((year) => (
        <Button
          key={year}
          variant={selectedYear === year ? 'default' : 'outline'}
          size="sm"
          onClick={() => onYearChange(year)}
        >
          {year}
        </Button>
      ))}
    </div>
  );
}

function getStatusBadge(status: string | undefined) {
  const statusUpper = status?.toUpperCase() || 'UNKNOWN';

  const variants: Record<
    string,
    { variant: 'default' | 'destructive' | 'outline' | 'secondary'; icon: any; label: string }
  > = {
    PASSED: { variant: 'default', icon: IconCheck, label: 'PASSED' },
    FAILED: { variant: 'destructive', icon: IconX, label: 'FAILED' },
    PENDING: { variant: 'secondary', icon: IconClock, label: 'PENDING' },
    IN_PROGRESS: { variant: 'secondary', icon: IconClock, label: 'IN PROGRESS' },
    CORRECTED: { variant: 'outline', icon: IconCheck, label: 'CORRECTED' },
    WAIVED: { variant: 'outline', icon: IconCheck, label: 'WAIVED' },
  };

  const config = variants[statusUpper] || { variant: 'outline' as const, icon: IconAlertTriangle, label: statusUpper };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      {Icon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}

function formatPercentage(value: number | string | undefined): string {
  if (value === undefined || value === null) return 'N/A';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return `${numValue.toFixed(2)}%`;
}

function ComplianceInfoCard() {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <IconInfoCircle className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">401(k) Compliance Requirements</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>ADP Test (§401(k)):</strong> Actual Deferral Percentage test compares HCE vs NHCE deferrals
              </p>
              <p>
                <strong>ACP Test (§401(m)):</strong> Actual Contribution Percentage test for matching and after-tax contributions
              </p>
              <p>
                <strong>Top Heavy Test (§416):</strong> Key employee benefits cannot exceed 60% of total plan assets
              </p>
              <p>
                <strong>410(b) Coverage Test:</strong> Plan must benefit a minimum percentage of non-HCEs
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ComplianceTestingPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Fetch compliance status for selected year
  const { data: complianceData, isLoading, error, refetch } = useGetComplianceStatusForYear(selectedYear, {
    query: {
      // Disable automatic retries to avoid console spam
      retry: false,
      // Show stale data while refetching
      refetchOnWindowFocus: false,
    },
  });

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!complianceData) {
      return {
        needsAttention: 0,
        warnings: 0,
        passed: 0,
        total: 0,
      };
    }

    return {
      needsAttention: complianceData.needsAttention || 0,
      warnings: complianceData.warning || 0,
      passed: complianceData.passes || 0,
      total: (complianceData.needsAttention || 0) + (complianceData.warning || 0) + (complianceData.passes || 0),
    };
  }, [complianceData]);

  // Export handler
  const handleExport = async (exportFormat: 'csv' | 'excel' | 'pdf') => {
    if (!complianceData?.tests || complianceData.tests.length === 0) {
      toast.error('No data to export', 'Please wait for data to load');
      return;
    }

    try {
      const exportData_array = complianceData.tests.map((test) => ({
        'Test Name': test.testName || 'N/A',
        Status: test.status || 'N/A',
        'HCE Average': test.hceAverage || 'N/A',
        'NHCE Average': test.nhcAverage || 'N/A',
        'Top Heavy Ratio': test.topHeavyRatio || 'N/A',
        'Coverage Ratio': test.coverageRatio || 'N/A',
        'Corrective Action': test.correctiveAction || 'None',
      }));

      const year = selectedYear || complianceData.testYear || currentYear;
      await exportReportData(exportData_array, exportFormat, `Compliance_Tests_${year}`);
      toast.success('Export successful', `Report exported as ${exportFormat.toUpperCase()}`);
    } catch (err) {
      toast.error('Export Failed', 'Failed to export report');
    }
  };

  // Error state
  if (error) {
    return (
      <DashboardContent>
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
            onClick={() => router.push('/reports')}
          >
            <IconArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <IconShieldCheck className="h-6 w-6" />
              <h1 className="text-2xl font-bold tracking-tight">Compliance Testing Dashboard</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Monitor IRS compliance test results for ADP, ACP, Top Heavy, and 410(b) Coverage
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconAlertTriangle className="h-12 w-12 text-warning mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Compliance Data Available</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Compliance testing data for {selectedYear} is not available yet. This could be because:
            </p>
            <ul className="text-sm text-muted-foreground text-left mb-4 space-y-1">
              <li>• Testing has not been performed for this year</li>
              <li>• Payroll data is insufficient for testing</li>
              <li>• Tests are still being processed</li>
            </ul>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()}>
                <IconRefresh className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button onClick={() => router.push('/reports')}>
                Back to Reports
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <ComplianceInfoCard />
      </DashboardContent>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardContent>
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
            onClick={() => router.push('/reports')}
          >
            <IconArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <IconShieldCheck className="h-6 w-6" />
              <h1 className="text-2xl font-bold tracking-tight">Compliance Testing Dashboard</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Monitor IRS compliance test results for ADP, ACP, Top Heavy, and 410(b) Coverage
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Test Year:</span>
            <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="space-y-4 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </DashboardContent>
    );
  }

  // Empty state (no tests data)
  if (!complianceData?.tests || complianceData.tests.length === 0) {
    return (
      <DashboardContent>
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
            onClick={() => router.push('/reports')}
          >
            <IconArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <IconShieldCheck className="h-6 w-6" />
              <h1 className="text-2xl font-bold tracking-tight">Compliance Testing Dashboard</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Monitor IRS compliance test results for ADP, ACP, Top Heavy, and 410(b) Coverage
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Test Year:</span>
            <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tests Run for {selectedYear}</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Compliance tests have not been run for this year yet. Tests are typically performed annually.
            </p>
          </CardContent>
        </Card>

        <ComplianceInfoCard />
      </DashboardContent>
    );
  }

  // Success state with data
  return (
    <DashboardContent>
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          className="inline-flex items-center gap-2"
          onClick={() => router.push('/reports')}
        >
          <IconArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <IconShieldCheck className="h-6 w-6" />
            <h1 className="text-2xl font-bold tracking-tight">Compliance Testing Dashboard</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Monitor IRS compliance test results for ADP, ACP, Top Heavy, and 410(b) Coverage
          </p>
        </div>
      </div>

      {/* Year Selector and Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Test Year:</span>
          <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <IconDownload className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            <IconDownload className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <IconDownload className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Compliance Info Card */}
      <ComplianceInfoCard />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-error">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-error">{summary.needsAttention}</div>
            <p className="text-xs text-muted-foreground mt-1">Failed tests</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-warning">{summary.warnings}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending/In progress</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-success">{summary.passed}</div>
            <p className="text-xs text-muted-foreground mt-1">Tests passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{summary.total}</div>
            <p className="text-xs text-muted-foreground mt-1">For {complianceData?.testYear || currentYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Test Results</CardTitle>
          <CardDescription>
            Test results for {complianceData?.testYear || selectedYear} ({complianceData.tests.length} tests)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceData.tests.map((test, index) => (
              <Card key={index} className="border-l-4" style={{
                borderLeftColor: test.status?.toUpperCase() === 'PASSED' ? 'hsl(var(--success))' :
                  test.status?.toUpperCase() === 'FAILED' ? 'hsl(var(--error))' : 'hsl(var(--warning))'
              }}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{test.testName || 'Unnamed Test'}</h3>
                        {getStatusBadge(test.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">HCE Average</p>
                          <p className="font-medium tabular-nums">{formatPercentage(test.hceAverage)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">NHCE Average</p>
                          <p className="font-medium tabular-nums">{formatPercentage(test.nhcAverage)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Top Heavy Ratio</p>
                          <p className="font-medium tabular-nums">{formatPercentage(test.topHeavyRatio)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Coverage Ratio</p>
                          <p className="font-medium tabular-nums">{formatPercentage(test.coverageRatio)}</p>
                        </div>
                      </div>
                      {test.correctiveAction && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-md">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Corrective Action:</p>
                          <p className="text-sm">{test.correctiveAction}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardContent>
  );
}
