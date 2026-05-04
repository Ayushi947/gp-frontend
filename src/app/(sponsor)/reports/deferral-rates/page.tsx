'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { IconDownload, IconPercentage, IconAlertCircle, IconInfoCircle, IconArrowLeft } from '@tabler/icons-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useGenerateReport4 } from '@/api/generated/endpoints/deferral-rates-report-controller/deferral-rates-report-controller';
import { formatDate } from '@/lib/utils';
import { exportReportData } from '@/lib/report-export';
import { toast } from '@/lib/toast';

interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

function YearSelector({ selectedYear, onYearChange }: YearSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];

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
          <IconPercentage className="h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight">Deferral Rates Report</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Track participant deferral rates for ADP/ACP compliance testing
        </p>
      </div>
    </div>
  );
}

function formatPercent(value: number | undefined): string {
  if (value === undefined || value === null) return '0.00%';
  return `${value.toFixed(2)}%`;
}

export default function DeferralRatesReportPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Fetch deferral rates data
  const { data: deferralData, isLoading, error } = useGenerateReport4({
    year: selectedYear,
    page,
    size: pageSize,
  });

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!deferralData?.participantRates) {
      return {
        participantCount: 0,
        avgPreTaxRate: 0,
        avgRothRate: 0,
        avgEmployerRate: 0,
        avgTotalRate: 0,
      };
    }

    const rates = deferralData.participantRates;
    let totalPreTax = 0;
    let totalRoth = 0;
    let totalEmployer = 0;

    rates.forEach((rate) => {
      totalPreTax += rate.preTaxContributionRate || 0;
      totalRoth += rate.rothContributionRate || 0;
      totalEmployer += rate.employerContributionRate || 0;
    });

    const count = rates.length;

    return {
      participantCount: count,
      avgPreTaxRate: count > 0 ? totalPreTax / count : 0,
      avgRothRate: count > 0 ? totalRoth / count : 0,
      avgEmployerRate: count > 0 ? totalEmployer / count : 0,
      avgTotalRate: count > 0 ? (totalPreTax + totalRoth + totalEmployer) / count : 0,
    };
  }, [deferralData]);

  // Export handler
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!deferralData?.participantRates || deferralData.participantRates.length === 0) {
      toast.error('No data to export', 'Please wait for data to load');
      return;
    }

    const exportData_array = deferralData.participantRates.map((rate) => ({
      'Employee Name': rate.employeeName || 'N/A',
      'Account Number': rate.accountNumber || 'N/A',
      'Election Date': rate.contributionElectionDate ? formatDate(rate.contributionElectionDate) : 'N/A',
      'Pre-Tax Deferral Rate (%)': formatPercent(rate.preTaxContributionRate),
      'Roth Contribution Rate (%)': formatPercent(rate.rothContributionRate),
      'Employer Contribution Rate (%)': formatPercent(rate.employerContributionRate),
      'Total Rate (%)': formatPercent((rate.preTaxContributionRate || 0) + (rate.rothContributionRate || 0) + (rate.employerContributionRate || 0)),
    }));

    await await exportReportData(exportData_array, format, `Deferral_Rates_Report_${selectedYear}`);
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
            <IconAlertCircle className="h-12 w-12 text-error mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Report</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was an error loading the deferral rates report. Please try again.
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

      {/* Compliance Notice */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <IconInfoCircle className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-semibold">ADP/ACP Testing Information</p>
              <p className="text-sm text-muted-foreground mt-1">
                <strong>ADP Test (§401(k)):</strong> Actual Deferral Percentage - Compares HCE vs NHCE pre-tax and Roth
                deferral rates
                <br />
                <strong>ACP Test (§401(m)):</strong> Actual Contribution Percentage - Compares HCE vs NHCE employer
                matching rates
                <br />
                These tests ensure highly compensated employees don't defer disproportionately more than non-HCEs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{summary.participantCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Total in plan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Pre-Tax Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{formatPercent(summary.avgPreTaxRate)}</div>
              <p className="text-xs text-muted-foreground mt-1">ADP testing input</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Roth Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{formatPercent(summary.avgRothRate)}</div>
              <p className="text-xs text-muted-foreground mt-1">ADP testing input</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Employer Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{formatPercent(summary.avgEmployerRate)}</div>
              <p className="text-xs text-muted-foreground mt-1">ACP testing input</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Total Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{formatPercent(summary.avgTotalRate)}</div>
              <p className="text-xs text-muted-foreground mt-1">Combined average</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Deferral Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Participant Deferral Rates</CardTitle>
          <CardDescription>
            Showing {deferralData?.participantRates?.length || 0} participant rates for {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : deferralData?.participantRates && deferralData.participantRates.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Employee Name</th>
                      <th className="text-left p-3 font-medium">Account Number</th>
                      <th className="text-left p-3 font-medium">Election Date</th>
                      <th className="text-right p-3 font-medium">Pre-Tax Rate</th>
                      <th className="text-right p-3 font-medium">Roth Rate</th>
                      <th className="text-right p-3 font-medium">Employer Rate</th>
                      <th className="text-right p-3 font-medium">Total Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deferralData.participantRates.map((rate, index) => {
                      const totalRate = (rate.preTaxContributionRate || 0) + (rate.rothContributionRate || 0) + (rate.employerContributionRate || 0);

                      return (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-3">{rate.employeeName || 'N/A'}</td>
                          <td className="p-3">{rate.accountNumber || 'N/A'}</td>
                          <td className="p-3">{rate.contributionElectionDate ? formatDate(rate.contributionElectionDate) : 'N/A'}</td>
                          <td className="p-3 text-right tabular-nums">{formatPercent(rate.preTaxContributionRate)}</td>
                          <td className="p-3 text-right tabular-nums">{formatPercent(rate.rothContributionRate)}</td>
                          <td className="p-3 text-right tabular-nums">{formatPercent(rate.employerContributionRate)}</td>
                          <td className="p-3 text-right tabular-nums font-medium">{formatPercent(totalRate)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {(deferralData.totalPages ?? 0) > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {deferralData.totalPages}
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
                      disabled={page >= ((deferralData.totalPages ?? 1) - 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No deferral rate data available for {selectedYear}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardContent>
  );
}
