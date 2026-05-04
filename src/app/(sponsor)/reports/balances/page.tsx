'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconDownload,
  IconAlertTriangle,
  IconRefresh,
  IconCash,
  IconChevronLeft,
  IconChevronRight,
  IconArrowLeft,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, KpiCard } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useGenerateReport3 } from '@/api/generated/endpoints/participant-balance-report-controller/participant-balance-report-controller';
import type { ParticipantBalanceDetailDTO } from '@/api/generated/models';
import { formatCurrency } from '@/lib/utils';
import { exportReportData } from '@/lib/report-export';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';

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
  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalElements);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 py-4 border-t">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Showing {startItem}-{endItem} of {totalElements}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2">
            {page + 1} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Balance Report Page
 */
export default function BalanceReportPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const {
    data: balanceData,
    isLoading,
    error,
    refetch,
  } = useGenerateReport3({ page, size: pageSize });

  const participants = balanceData?.participantBalances ?? [];
  const totalElements = balanceData?.totalElements ?? 0;
  const totalPages = balanceData?.totalPages ?? 0;

  const handleExport = async (exportFormat: 'csv' | 'excel' | 'pdf') => {
    if (participants.length === 0) {
      toast.error('Export Error', 'No data to export');
      return;
    }

    try {
      const exportData = participants.map((participant: ParticipantBalanceDetailDTO) => ({
        'Account Number': participant.accountNumber ?? '',
        'Employee Name': participant.employeeName ?? '',
        'Pre-Tax Balance': formatCurrency(participant.preTaxEmployeeBalance ?? 0),
        'Roth Balance': formatCurrency(participant.rothEmployeeBalance ?? 0),
        'Employer Contribution': formatCurrency(participant.employerContributionBalance ?? 0),
        'Vested Balance': formatCurrency(participant.vestedBalance ?? 0),
        'Total Balance': formatCurrency(participant.totalBalance ?? 0),
      }));

      await exportReportData(exportData, exportFormat, 'Participant_Balances');
      toast.success('Export Successful', `Report exported as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      toast.error('Export Failed', 'Failed to export report');
    }
  };

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Balance Report</h1>
          <p className="text-muted-foreground">
            Detailed account balances by source with vesting information
          </p>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-4 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="flex-1 h-4" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </DashboardContent>
    );
  }

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Balance Report</h1>
          <p className="text-muted-foreground">
            Detailed account balances by source with vesting information
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconAlertTriangle className="h-12 w-12 text-error mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Balances</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was an error loading the balance report.
            </p>
            <Button onClick={() => refetch()}>
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
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Balance Report</h1>
          <p className="text-muted-foreground">
            As of {balanceData?.asOfDate ? format(new Date(balanceData.asOfDate), 'MMMM d, yyyy') : 'Current'}
          </p>
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard
          label="Total Balance"
          value={formatCurrency(balanceData?.totalBalance ?? 0)}
        />
        <KpiCard
          label="Employee Total"
          value={formatCurrency(balanceData?.totalEmployeeBalance ?? 0)}
        />
        <KpiCard
          label="Employer Total"
          value={formatCurrency(balanceData?.totalEmployerContributionBalance ?? 0)}
        />
        <KpiCard
          label="Vested Total"
          value={formatCurrency(balanceData?.totalVestedBalance ?? 0)}
        />
      </div>

      {participants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconCash className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Balance Data</h3>
            <p className="text-muted-foreground text-center">
              No participant balance data available.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Participant Balances ({totalElements})</CardTitle>
            <CardDescription>
              Account balances by source with vesting details
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground text-sm">
                      Employee
                    </th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-sm">
                      Pre-Tax
                    </th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-sm">
                      Roth
                    </th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-sm">
                      Employer
                    </th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-sm">
                      Vested
                    </th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-sm">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant: ParticipantBalanceDetailDTO, index: number) => (
                    <tr key={participant.accountNumber ?? index} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-sm">{participant.employeeName ?? 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{participant.accountNumber}</p>
                        </div>
                      </td>
                      <td className="p-3 text-right tabular-nums text-sm">
                        {formatCurrency(participant.preTaxEmployeeBalance ?? 0)}
                      </td>
                      <td className="p-3 text-right tabular-nums text-sm">
                        {formatCurrency(participant.rothEmployeeBalance ?? 0)}
                      </td>
                      <td className="p-3 text-right tabular-nums text-sm">
                        {formatCurrency(participant.employerContributionBalance ?? 0)}
                      </td>
                      <td className="p-3 text-right tabular-nums text-sm text-success font-medium">
                        {formatCurrency(participant.vestedBalance ?? 0)}
                      </td>
                      <td className="p-3 text-right tabular-nums text-sm font-bold">
                        {formatCurrency(participant.totalBalance ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalElements={totalElements}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(0);
                }}
              />
            )}
          </CardContent>
        </Card>
      )}
    </DashboardContent>
  );
}
