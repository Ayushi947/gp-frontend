'use client';

import { useState, useMemo } from 'react';
import {
  IconReceipt,
  IconDownload,
  IconFilter,
  IconRefresh,
  IconAlertCircle,
  IconRotateClockwise,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/lib/toast';
import {
  useGetCalculationsByTenant,
  useReprocessFailedCalculations,
} from '@/api/generated/endpoints/pre-payroll-processing/pre-payroll-processing';
import type { PrePayrollCalculationDTO } from '@/api/generated/models';

type ProcessingStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

function getStatusBadge(status: ProcessingStatus) {
  const variants: Record<ProcessingStatus, {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    label: string;
    className: string;
  }> = {
    SUCCESS: {
      variant: 'default',
      label: 'Success',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    PENDING: {
      variant: 'outline',
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    FAILED: {
      variant: 'destructive',
      label: 'Failed',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  };

  const config = variants[status];
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

export default function PayrollsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch pre-payroll calculations from backend
  const {
    data: calculations = [],
    isLoading,
    error,
    refetch,
  } = useGetCalculationsByTenant<PrePayrollCalculationDTO[]>({
    query: {
      staleTime: 2 * 60 * 1000, // 2 minutes
    },
  });

  // Reprocess failed calculations mutation
  const reprocessMutation = useReprocessFailedCalculations({
    mutation: {
      onSuccess: () => {
        toast.success('Reprocessing Started', 'Failed calculations are being reprocessed');
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to reprocess calculations';
        toast.error('Reprocess Failed', message);
      },
    },
  });

  const filteredCalculations = useMemo(() => {
    if (!calculations || calculations.length === 0) return [];
    if (statusFilter === 'all') return calculations;
    return calculations.filter((calc) => calc.status === statusFilter);
  }, [calculations, statusFilter]);

  // Count failed calculations
  const failedCount = useMemo(() => {
    if (!calculations) return 0;
    return calculations.filter((calc) => calc.status === 'FAILED').length;
  }, [calculations]);

  const handleExportPayroll = () => {
    toast.info('Export', 'Exporting payroll data...');
  };

  const handleReprocess = () => {
    reprocessMutation.mutate();
  };

  const handleRefresh = () => {
    refetch();
    toast.info('Refreshing', 'Refreshing payroll calculations...');
  };

  return (
    <DashboardContent>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <IconReceipt className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payroll Processing</h1>
            <p className="text-muted-foreground mt-1">
              Automatic payroll processing via Finch integration and Drools rule engine
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {failedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReprocess}
              disabled={reprocessMutation.isPending}
            >
              <IconRotateClockwise className="mr-2 h-4 w-4" />
              {reprocessMutation.isPending ? 'Reprocessing...' : `Reprocess (${failedCount})`}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportPayroll}>
            <IconDownload className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <IconAlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <div className="font-semibold text-blue-900 mb-1">Automatic Processing</div>
              <p className="text-sm text-blue-800">
                Payroll contributions are automatically calculated from Finch payroll data using the Drools business rules engine.
                Employee contributions, employer matching, and profit sharing are computed based on your plan rules.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Calculations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pre-Payroll Calculations</CardTitle>
              <CardDescription className="mt-2">
                View automatic payroll contribution calculations processed by the rule engine
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <IconFilter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading}>
                <IconRefresh className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <IconAlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Failed to load payroll calculations</p>
              <Button variant="outline" onClick={handleRefresh}>
                Try Again
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payroll Period</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Employee Contribution</TableHead>
                    <TableHead className="text-right">Employer Match</TableHead>
                    <TableHead className="text-right">Profit Sharing</TableHead>
                    <TableHead className="text-right">Total Contribution</TableHead>
                    <TableHead>Processed Date</TableHead> 
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalculations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        {statusFilter === 'all'
                          ? 'No payroll calculations found. Calculations will appear here after Finch syncs payroll data.'
                          : `No ${statusFilter.toLowerCase()} calculations found`}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCalculations.map((calc) => (
                      <TableRow key={calc.calculationId} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {calc.payrollPeriodStart && calc.payrollPeriodEnd
                            ? `${formatDate(calc.payrollPeriodStart)} - ${formatDate(calc.payrollPeriodEnd)}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {calc.employeeId || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(calc.status as ProcessingStatus)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(calc.employeeContributionAmount || 0)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(calc.employerMatchAmount || 0)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(calc.profitSharingAmount || 0)}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatCurrency(
                            (calc.employeeContributionAmount || 0) +
                            (calc.employerMatchAmount || 0) +
                            (calc.profitSharingAmount || 0)
                          )}
                        </TableCell>
                        <TableCell>
                          {calc.processedAt ? formatDate(calc.processedAt) : 'Pending'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardContent>
  );
}
