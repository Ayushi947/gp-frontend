'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { IconDownload, IconChartBar, IconAlertTriangle, IconArrowLeft } from '@tabler/icons-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, KpiCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useGetTransactionContributions, useGetDashboardContributions } from '@/api/generated/endpoints/contributions-reporting/contributions-reporting';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportReportData } from '@/lib/report-export';
import { toast } from '@/lib/toast';
import { getIRSLimitsForYear } from '@/config/retirement';

interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

function YearSelector({ selectedYear, onYearChange }: YearSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

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

function PageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <IconChartBar className="h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight">Contributions Report</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          View and analyze employee and employer contribution data with IRS limit tracking
        </p>
      </div>
    </div>
  );
}

function ComplianceAlert({ message, type = 'warning' }: { message: string; type?: 'warning' | 'error' }) {
  return (
    <Card className={`border-l-4 ${type === 'error' ? 'border-l-error' : 'border-l-warning'}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <IconAlertTriangle className={`h-5 w-5 ${type === 'error' ? 'text-error' : 'text-warning'}`} />
          <div>
            <p className="font-semibold">401(k) Compliance Alert</p>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({ title, value, description }: { title: string; value: string; description?: string }) {
  return (
    <KpiCard
      label={title}
      value={value}
      description={description}
    />
  );
}

export default function ContributionsReportPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Get IRS limits dynamically based on selected year
  const yearLimits = useMemo(() => getIRSLimitsForYear(selectedYear), [selectedYear]);
  const IRS_LIMITS = useMemo(() => ({
    ELECTIVE_DEFERRAL: yearLimits.EMPLOYEE_DEFERRAL,
    CATCH_UP: yearLimits.CATCH_UP_50_PLUS,
    TOTAL_ANNUAL: yearLimits.TOTAL_CONTRIBUTION,
  }), [yearLimits]);

  // Calculate date range for selected year
  const startDate = `${selectedYear}-01-01`;
  const endDate = `${selectedYear}-12-31`;

  // Fetch transaction-level contributions for the table
  const { data: contributionsData, isLoading: isLoadingTransactions, error } = useGetTransactionContributions({
    startDate,
    endDate,
    page,
    size: pageSize,
  });

  // Fetch aggregated summary data (correct totals across ALL transactions)
  const { data: dashboardData, isLoading: isLoadingSummary } = useGetDashboardContributions({
    startDate,
    endDate,
    page: 0,
    size: 1, // Only need summary totals, not employee details
  });

  const isLoading = isLoadingTransactions || isLoadingSummary;

  // Use dashboard data for accurate summary statistics (includes ALL transactions, not just current page)
  const summary = useMemo(() => {
    if (!dashboardData) {
      return {
        totalContributions: 0,
        employeePreTax: 0,
        employeeRoth: 0,
        employerContributions: 0,
        participantCount: 0,
        avgContribution: 0,
      };
    }

    const totalContributions = dashboardData.totalContributions || 0;
    const employeePreTax = dashboardData.preTaxEmployeeContributions || 0;
    const employeeRoth = dashboardData.rothEmployeeContributions || 0;
    const employerContributions = dashboardData.employerContributions || 0;
    const participantCount = dashboardData.totalElements || contributionsData?.totalElements || 0;
    const avgContribution = participantCount > 0 ? totalContributions / participantCount : 0;

    return {
      totalContributions,
      employeePreTax,
      employeeRoth,
      employerContributions,
      participantCount,
      avgContribution,
    };
  }, [dashboardData, contributionsData]);

  // Check for IRS limit compliance
  const complianceIssues = useMemo(() => {
    const issues: string[] = [];

    if (summary.employeePreTax + summary.employeeRoth > IRS_LIMITS.ELECTIVE_DEFERRAL) {
      issues.push(
        `Total employee deferrals (${formatCurrency(summary.employeePreTax + summary.employeeRoth)}) exceed IRS §402(g) limit of ${formatCurrency(IRS_LIMITS.ELECTIVE_DEFERRAL)} for ${selectedYear}`
      );
    }

    if (summary.totalContributions > IRS_LIMITS.TOTAL_ANNUAL * summary.participantCount) {
      issues.push(
        `Total contributions may exceed IRS §415 annual limit of ${formatCurrency(IRS_LIMITS.TOTAL_ANNUAL)} per participant`
      );
    }

    return issues;
  }, [summary, selectedYear]);

  // Export handler
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!contributionsData?.content || contributionsData.content.length === 0) {
      toast.error('No data to export', 'Please wait for data to load');
      return;
    }

    const exportData_array = contributionsData.content.map((transaction) => ({
      'Transaction Date': formatDate(transaction.transactionDate),
      'Participant Name': transaction.participantName || 'N/A',
      'Transaction Code': transaction.transactionCodeName || transaction.transactionCode || 'N/A',
      'Total Contributions': formatCurrency(transaction.contributions || 0),
      'Employee Contributions': formatCurrency(transaction.employee || 0),
      'Employer Contributions': formatCurrency(transaction.employer || 0),
    }));

    await await exportReportData(exportData_array, format, `Contributions_Report_${selectedYear}`);
    toast.success('Export successful', `Report exported as ${format.toUpperCase()}`);
  };

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
        <PageHeader />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconAlertTriangle className="h-12 w-12 text-error mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Report</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was an error loading the contributions report. Please try again.
            </p>
          </CardContent>
        </Card>
      </DashboardContent>
    );
  }

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
      <PageHeader />

      {/* Year Selector and Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
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

      {/* Compliance Alerts */}
      {complianceIssues.length > 0 && (
        <div className="space-y-2">
          {complianceIssues.map((issue, index) => (
            <ComplianceAlert key={index} message={issue} type="warning" />
          ))}
        </div>
      )}

      {/* Summary Cards */}
      {isLoading ? (
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Contributions"
            value={formatCurrency(summary.totalContributions)}
            description={`${summary.participantCount} participants`}
          />
          <SummaryCard
            title="Employee Pre-Tax"
            value={formatCurrency(summary.employeePreTax)}
            description={`IRS limit: ${formatCurrency(IRS_LIMITS.ELECTIVE_DEFERRAL)}`}
          />
          <SummaryCard
            title="Employee Roth"
            value={formatCurrency(summary.employeeRoth)}
            description="After-tax contributions"
          />
          <SummaryCard
            title="Employer Match"
            value={formatCurrency(summary.employerContributions)}
            description={`Avg: ${formatCurrency(summary.avgContribution)}`}
          />
        </div>
      )}

      {/* Contributions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>
            All contribution transactions for {selectedYear} (showing {contributionsData?.content?.length || 0} of{' '}
            {contributionsData?.totalElements || 0})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : contributionsData?.content && contributionsData.content.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Participant</th>
                      <th className="text-left p-3 font-medium">Transaction Type</th>
                      <th className="text-right p-3 font-medium">Employee</th>
                      <th className="text-right p-3 font-medium">Employer</th>
                      <th className="text-right p-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributionsData.content.map((transaction, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-3">{formatDate(transaction.transactionDate)}</td>
                        <td className="p-3">{transaction.participantName || 'N/A'}</td>
                        <td className="p-3">
                          <Badge variant="outline">
                            {transaction.transactionCodeName || transaction.transactionCode || 'N/A'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right tabular-nums">
                          {formatCurrency(transaction.employee || 0)}
                        </td>
                        <td className="p-3 text-right tabular-nums">
                          {formatCurrency(transaction.employer || 0)}
                        </td>
                        <td className="p-3 text-right tabular-nums font-medium">
                          {formatCurrency(transaction.contributions || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {(contributionsData.totalPages ?? 0) > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {contributionsData.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= ((contributionsData.totalPages ?? 1) - 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No contribution data available for {selectedYear}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardContent>
  );
}
