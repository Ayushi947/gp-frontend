'use client';

import { useState } from 'react';
import {
  IconReceipt,
  IconAlertTriangle,
  IconRefresh,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
  IconFilter,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useGetTransactionContributions } from '@/api/generated/endpoints/contributions-reporting/contributions-reporting';
import { useGetParticipantActivities } from '@/api/generated/endpoints/participant-portal/participant-portal';
import type { TransactionContributionDTO, ActivityDTO } from '@/api/generated/models';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { format, subMonths, startOfYear } from 'date-fns';

/**
 * Page Header Component
 */
function PageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          View your account transaction history
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => toast.info('Export', 'Feature coming soon')}>
          <IconDownload className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}

/**
 * Transaction Type Badge
 */
function TransactionTypeBadge({ type }: { type: string | undefined }) {
  if (!type) return null;

  const typeLower = type.toLowerCase();

  const badgeConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    contribution: { variant: 'default', label: 'Contribution' },
    employer_contribution: { variant: 'default', label: 'Employer Match' },
    withdrawal: { variant: 'destructive', label: 'Withdrawal' },
    distribution: { variant: 'destructive', label: 'Distribution' },
    transfer: { variant: 'secondary', label: 'Transfer' },
    fee: { variant: 'outline', label: 'Fee' },
  };

  const config = badgeConfig[typeLower] ?? { variant: 'outline' as const, label: type };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * Transactions Table Component
 */
function TransactionsTable({
  transactions,
  isLoading,
}: {
  transactions: TransactionContributionDTO[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="flex-1 h-4" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <IconReceipt className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
        <p className="text-muted-foreground text-center">
          No transactions match your selected criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Description</th>
            <th className="text-right p-4 font-medium text-muted-foreground">Employee</th>
            <th className="text-right p-4 font-medium text-muted-foreground">Employer</th>
            <th className="text-right p-4 font-medium text-muted-foreground">Total</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => (
            <tr key={transaction.transactionId ?? index} className="border-b hover:bg-muted/50">
              <td className="p-4">
                <span className="font-medium">
                  {transaction.transactionDate
                    ? format(new Date(transaction.transactionDate), 'MMM d, yyyy')
                    : '-'}
                </span>
              </td>
              <td className="p-4">
                <TransactionTypeBadge type={transaction.transactionCodeName ?? transaction.transactionCode} />
              </td>
              <td className="p-4">
                <span className="text-sm">
                  {transaction.transactionCodeName ?? transaction.transactionCode ?? 'Transaction'}
                </span>
              </td>
              <td className="p-4 text-right tabular-nums">
                {transaction.employee !== undefined ? (
                  <span className={transaction.employee > 0 ? 'text-success' : ''}>
                    {transaction.employee > 0 ? '+' : ''}{formatCurrency(transaction.employee)}
                  </span>
                ) : (
                  '-'
                )}
              </td>
              <td className="p-4 text-right tabular-nums">
                {transaction.employer !== undefined ? (
                  <span className={transaction.employer > 0 ? 'text-success' : ''}>
                    {transaction.employer > 0 ? '+' : ''}{formatCurrency(transaction.employer)}
                  </span>
                ) : (
                  '-'
                )}
              </td>
              <td className="p-4 text-right tabular-nums font-medium">
                {transaction.contributions !== undefined ? (
                  <span className={transaction.contributions > 0 ? 'text-success' : 'text-error'}>
                    {transaction.contributions > 0 ? '+' : ''}{formatCurrency(transaction.contributions)}
                  </span>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Activity History Section
 */
function ActivityHistory() {
  const { data: activitiesData, isLoading } = useGetParticipantActivities({ size: 10 });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activities = (activitiesData?.content ?? []) as ActivityDTO[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Your recent account activities</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{activity.title ?? activity.message}</p>
                  {activity.message && activity.title && (
                    <p className="text-xs text-muted-foreground mt-1">{activity.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.timeAgo ?? (activity.createdAt ? format(new Date(activity.createdAt), 'MMM d, yyyy') : 'Recently')}
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
 * Transactions Page
 */
export default function TransactionsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dateRange, setDateRange] = useState('ytd');

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case '30d':
        return { startDate: format(subMonths(now, 1), 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd') };
      case '90d':
        return { startDate: format(subMonths(now, 3), 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd') };
      case 'ytd':
      default:
        return { startDate: format(startOfYear(now), 'yyyy-MM-dd'), endDate: format(now, 'yyyy-MM-dd') };
    }
  };

  const { startDate, endDate } = getDateRange();

  const {
    data: transactionsData,
    isLoading,
    error,
    refetch,
  } = useGetTransactionContributions({
    page,
    size: pageSize,
    startDate,
    endDate,
  });

  const transactions = (transactionsData?.content ?? []) as TransactionContributionDTO[];
  const totalElements = transactionsData?.totalElements ?? 0;
  const totalPages = transactionsData?.totalPages ?? 0;

  if (error) {
    return (
      <DashboardContent>
        <PageHeader />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconAlertTriangle className="h-12 w-12 text-error mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Transactions</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was an error loading your transaction history.
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
      <PageHeader />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <IconFilter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {transactions.length} of {totalElements} transactions
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transactions Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaction History</CardTitle>
              <CardDescription>
                {startDate} to {endDate}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <TransactionsTable transactions={transactions} isLoading={isLoading} />
              {!isLoading && transactions.length > 0 && (
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
        </div>

        {/* Activity History */}
        <div>
          <ActivityHistory />
        </div>
      </div>
    </DashboardContent>
  );
}
