'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconDownload,
  IconAlertTriangle,
  IconRefresh,
  IconUsers,
  IconChevronLeft,
  IconChevronRight,
  IconArrowLeft,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useGenerateReport2 } from '@/api/generated/endpoints/participant-roster-report/participant-roster-report';
import type { ParticipantRosterRowDTO } from '@/api/generated/models';
import { formatCurrency, formatPercentFromBackend } from '@/lib/utils';
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
 * Participant Roster Page
 */
export default function ParticipantRosterPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const {
    data: rosterData,
    isLoading,
    error,
    refetch,
  } = useGenerateReport2({ page, size: pageSize });

  const participants = rosterData?.participantRows ?? [];
  const totalElements = rosterData?.totalElements ?? 0;
  const totalPages = rosterData?.totalPages ?? 0;

  const handleExport = async (exportFormat: 'csv' | 'excel' | 'pdf') => {
    if (participants.length === 0) {
      toast.error('Export Error', 'No data to export');
      return;
    }

    try {
      const exportData = participants.map((participant: ParticipantRosterRowDTO) => ({
        'Account Number': participant.accountNumber ?? '',
        'Employee Name': participant.employeeName ?? '',
        'Status': participant.planStatus ?? '',
        'Balance': participant.accountBalance !== undefined ? formatCurrency(participant.accountBalance) : '',
        'Pre-Tax Rate': participant.employeePreTaxContributionRate !== undefined ? formatPercentFromBackend(participant.employeePreTaxContributionRate) : '',
        'Roth Rate': participant.employeeRothContributionRate !== undefined ? formatPercentFromBackend(participant.employeeRothContributionRate) : '',
        'Entry Date': participant.planStartDate ? format(new Date(participant.planStartDate), 'MM/dd/yyyy') : '',
      }));

      await exportReportData(exportData, exportFormat, 'Participant_Roster');
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
          <h1 className="text-2xl font-bold tracking-tight">Participant Roster</h1>
          <p className="text-muted-foreground">
            Complete list of participants with enrollment status and deferral rates
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
                  <Skeleton className="h-4 w-16" />
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
          <h1 className="text-2xl font-bold tracking-tight">Participant Roster</h1>
          <p className="text-muted-foreground">
            Complete list of participants with enrollment status and deferral rates
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconAlertTriangle className="h-12 w-12 text-error mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Roster</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was an error loading the participant roster.
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
          <h1 className="text-2xl font-bold tracking-tight">Participant Roster</h1>
          <p className="text-muted-foreground">
            As of {rosterData?.asOfDate ? format(new Date(rosterData.asOfDate), 'MMMM d, yyyy') : 'Current'}
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

      {participants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconUsers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Participants</h3>
            <p className="text-muted-foreground text-center">
              No participant data available for the roster report.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Participant Roster ({totalElements})</CardTitle>
            <CardDescription>
              Current enrollment status and contribution elections
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
                    <th className="text-left p-3 font-medium text-muted-foreground text-sm">
                      Status
                    </th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-sm">
                      Balance
                    </th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-sm">
                      Pre-Tax %
                    </th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-sm">
                      Roth %
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground text-sm">
                      Entry Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant: ParticipantRosterRowDTO, index: number) => (
                    <tr key={participant.accountNumber ?? index} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-sm">{participant.employeeName ?? 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{participant.accountNumber}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge
                          className={
                            participant.planStatus === 'Active'
                              ? 'text-xs bg-green-100 text-green-800 border border-green-200'
                              : participant.planStatus === 'Terminated'
                                ? 'text-xs bg-red-100 text-red-800 border border-red-200'
                                : 'text-xs bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }
                        >
                          {participant.planStatus ?? '-'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right tabular-nums text-sm font-medium">
                        {participant.accountBalance !== undefined
                          ? formatCurrency(participant.accountBalance)
                          : '-'}
                      </td>
                      <td className="p-3 text-right tabular-nums text-sm">
                        {participant.employeePreTaxContributionRate !== undefined
                          ? formatPercentFromBackend(participant.employeePreTaxContributionRate)
                          : '-'}
                      </td>
                      <td className="p-3 text-right tabular-nums text-sm">
                        {participant.employeeRothContributionRate !== undefined
                          ? formatPercentFromBackend(participant.employeeRothContributionRate)
                          : '-'}
                      </td>
                      <td className="p-3 text-sm">
                        {participant.planStartDate
                          ? format(new Date(participant.planStartDate), 'MM/dd/yyyy')
                          : '-'}
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
