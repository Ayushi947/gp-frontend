'use client';

import { useState, useMemo } from 'react';
import {
  IconUsers,
  IconSearch,
  IconPlus,
  IconDownload,
  IconFilter,
  IconAlertTriangle,
  IconRefresh,
  IconEye,
  IconMail,
  IconUserCheck,
  IconClock,
  IconUserX,
  IconChevronLeft,
  IconChevronRight,
  IconSend,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, KpiCard } from '@/components/ui/card';
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
import {
  useGetParticipants,
  useGetParticipantStats,
} from '@/api/generated/endpoints/participants/participants';
import {
  useSendInvitationsToAllEligible,
  useSendInvitationToParticipant,
} from '@/api/generated/endpoints/participant-invitations/participant-invitations';
import { useSyncEmployees } from '@/api/generated/endpoints/finch-data-integration/finch-data-integration';
import type { ParticipantResponseDTO } from '@/api/generated/models';
import { formatCurrency, formatPercentFromBackend, formatEnum, cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

/**
 * Helper functions to determine participant status
 */
function isEnrolled(participant: ParticipantResponseDTO): boolean {
  const hasPreTax = !!(participant.employeeDeferralRate && participant.employeeDeferralRate > 0);
  const hasRoth = !!(participant.employeeRothContributionRate && participant.employeeRothContributionRate > 0);
  return hasPreTax || hasRoth;
}

function canInvite(participant: ParticipantResponseDTO): boolean {
  return participant.eligibilityStatus === 'ELIGIBLE' && !isEnrolled(participant);
}

/**
 * Page Header Component
 */
function PageHeader({
  onSendAllInvitations,
  sendingAll,
  onSyncEmployees,
  syncing
}: {
  onSendAllInvitations: () => void;
  sendingAll: boolean;
  onSyncEmployees: () => void;
  syncing: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Participants</h1>
        <p className="text-muted-foreground mt-2">
          Manage participant eligibility, enrollment status, and send invitations
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSyncEmployees}
          disabled={syncing}
        >
          <IconRefresh className={cn("mr-2 h-4 w-4", syncing && "animate-spin")} />
          {syncing ? 'Syncing...' : 'Sync from Finch'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast.info('Export', 'Feature coming soon')}>
          <IconDownload className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button
          size="sm"
          onClick={onSendAllInvitations}
          disabled={sendingAll}
        >
          <IconSend className="mr-2 h-4 w-4" />
          {sendingAll ? 'Sending...' : 'Send All Invitations'}
        </Button>
      </div>
    </div>
  );
}

/**
 * Employment Status Badge Component
 */
function EmploymentStatusBadge({ status }: { status: string | undefined }) {
  if (!status) {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
        Unknown
      </Badge>
    );
  }

  const statusUpper = status.toUpperCase();

  if (statusUpper === 'ACTIVE') {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        {formatEnum(status)}
      </Badge>
    );
  }

  if (statusUpper === 'INACTIVE' || statusUpper === 'TERMINATED') {
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
        {formatEnum(status)}
      </Badge>
    );
  }

  if (statusUpper === 'LOA') {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
        {formatEnum(status)}
      </Badge>
    );
  }

  return (
    <Badge variant="outline">
      {formatEnum(status)}
    </Badge>
  );
}

/**
 * Eligibility Status Badge (uses eligibilityStatus field)
 */
function EligibilityBadge({ status }: { status: string | undefined }) {
  if (!status) return <Badge variant="secondary">Pending</Badge>;

  const statusUpper = status.toUpperCase();

  if (statusUpper === 'ELIGIBLE') {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        Eligible
      </Badge>
    );
  } else if (statusUpper === 'NOT_ELIGIBLE') {
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
        Not Eligible
      </Badge>
    );
  } else if (statusUpper === 'SUSPENDED') {
    return (
      <Badge variant="destructive">
        Suspended
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
      Pending
    </Badge>
  );
}

/**
 * Enrollment Status Badge (calculated from deferral percentages)
 */
function EnrollmentBadge({ participant }: { participant: ParticipantResponseDTO }) {
  if (isEnrolled(participant)) {
    return (
      <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
        <IconUserCheck className="h-3 w-3 mr-1" />
        Enrolled
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <IconUserX className="h-3 w-3 mr-1" />
      Not Enrolled
    </Badge>
  );
}

/**
 * Participant Row Component
 */
function ParticipantRow({
  participant,
  onClick,
  onSendInvitation,
  sendingInvitation,
}: {
  participant: ParticipantResponseDTO;
  onClick: () => void;
  onSendInvitation: () => void;
  sendingInvitation: boolean;
}) {
  return (
    <tr
      className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className="p-4">
        <div className="flex flex-col">
          <span className="font-medium">{participant.name ?? 'Unknown'}</span>
          <span className="text-xs text-muted-foreground">
            {participant.accountNumber ?? 'No Account'}
          </span>
        </div>
      </td>
      <td className="p-4">
        <EmploymentStatusBadge status={participant.status} />
      </td>
      <td className="p-4">
        <EligibilityBadge status={participant.eligibilityStatus} />
      </td>
      <td className="p-4">
        <EnrollmentBadge participant={participant} />
      </td>
      <td className="p-4 text-right tabular-nums">
        {participant.employeeDeferralRate !== undefined && participant.employeeDeferralRate > 0
          ? formatPercentFromBackend(participant.employeeDeferralRate)
          : '-'}
      </td>
      <td className="p-4 text-right tabular-nums">
        {participant.employeeRothContributionRate !== undefined && participant.employeeRothContributionRate > 0
          ? formatPercentFromBackend(participant.employeeRothContributionRate)
          : '-'}
      </td>
      <td className="p-4 text-right font-medium tabular-nums">
        {participant.balance !== undefined ? formatCurrency(participant.balance) : '-'}
      </td>
      <td className="p-4">
        <span className="text-sm">{participant.portfolioType ? formatEnum(participant.portfolioType) : '-'}</span>
      </td>
      <td className="p-4">
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {canInvite(participant) && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSendInvitation}
              disabled={sendingInvitation}
            >
              <IconMail className="h-4 w-4 mr-1" />
              {sendingInvitation ? 'Sending...' : 'Send Invite'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (participant.accountNumber) {
                window.location.href = `/participants/${participant.accountNumber}`;
              }
            }}
          >
            <IconEye className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

/**
 * Loading Skeleton
 */
function ParticipantsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * Error State Component
 */
function ParticipantsError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <IconAlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to Load Participants</h3>
        <p className="text-muted-foreground text-center mb-4">
          There was an error loading the participants list. Please try again.
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
 * Empty State Component
 */
function ParticipantsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <IconUsers className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
      <h3 className="text-lg font-semibold mb-2">No Participants Found</h3>
      <p className="text-muted-foreground text-center mb-4">
        There are no participants matching your search criteria.
      </p>
    </div>
  );
}

/**
 * Participants Page
 */
export default function ParticipantsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sendingInvitationFor, setSendingInvitationFor] = useState<string | null>(null);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Update debounced search
  useMemo(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Fetch participants for current page
  const {
    data: participantsData,
    isLoading,
    error,
    refetch,
  } = useGetParticipants({
    page,
    size: pageSize,
    search: debouncedSearch || undefined,
  });

  // Fetch participant stats (totals across all participants)
  const { data: statsData } = useGetParticipantStats();

  // Send all invitations mutation
  const sendAllInvitationsMutation = useSendInvitationsToAllEligible({
    mutation: {
      onSuccess: (data: any) => {
        const emailsSent = data?.emailsSent || 0;
        toast.success('Invitations Sent', `Successfully sent ${emailsSent} invitation email(s)`);
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to send invitations';
        toast.error('Send Failed', message);
      },
    },
  });

  // Send individual invitation mutation
  const sendInvitationMutation = useSendInvitationToParticipant({
    mutation: {
      onSuccess: () => {
        toast.success('Invitation Sent', 'Invitation email sent successfully');
        setSendingInvitationFor(null);
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to send invitation';
        toast.error('Send Failed', message);
        setSendingInvitationFor(null);
      },
    },
  });

  // Sync employees from Finch mutation
  const syncEmployeesMutation = useSyncEmployees({
    mutation: {
      onSuccess: (data: any) => {
        const message = data?.message || 'Employee sync job started. Processing will continue in the background.';
        toast.success('Sync Started', message);
        // Refetch after a short delay to allow backend to process
        setTimeout(() => refetch(), 3000);
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to start employee sync';
        toast.error('Sync Failed', message);
      },
    },
  });

  // Type cast the content to ParticipantResponseDTO[]
  const allParticipants = (participantsData?.content ?? []) as ParticipantResponseDTO[];
  const totalElements = participantsData?.totalElements ?? 0;
  const totalPages = participantsData?.totalPages ?? 0;

  // Get stats from API (totals across ALL participants, not just current page)
  const total = (statsData?.total as number) ?? totalElements;
  const eligibleCount = (statsData?.eligible as number) ?? 0;
  const enrolledCount = (statsData?.enrolled as number) ?? 0;
  const notEnrolledCount = (statsData?.notEnrolled as number) ?? 0;
  const pendingCount = (statsData?.pending as number) ?? 0;

  // Filter participants by tab
  const filteredParticipants = useMemo(() => {
    if (activeTab === 'all') return allParticipants;
    if (activeTab === 'eligible') return allParticipants.filter((p) => p.eligibilityStatus === 'ELIGIBLE');
    if (activeTab === 'enrolled') return allParticipants.filter(isEnrolled);
    if (activeTab === 'not-enrolled') return allParticipants.filter((p) => p.eligibilityStatus === 'ELIGIBLE' && !isEnrolled(p));
    if (activeTab === 'pending') return allParticipants.filter((p) => p.eligibilityStatus === 'PENDING');
    return allParticipants;
  }, [allParticipants, activeTab]);

  const handleParticipantClick = (participant: ParticipantResponseDTO) => {
    if (participant.accountNumber) {
      window.location.href = `/participants/${participant.accountNumber}`;
    } else {
      toast.error('Error', 'Participant ID not found');
    }
  };

  const handleSendAllInvitations = () => {
    sendAllInvitationsMutation.mutate();
  };

  const handleSendInvitation = (participantId: string) => {
    setSendingInvitationFor(participantId);
    sendInvitationMutation.mutate({ participantId });
  };

  const handleSyncEmployees = () => {
    syncEmployeesMutation.mutate();
  };

  if (error) {
    return (
      <DashboardContent>
        <PageHeader
          onSendAllInvitations={handleSendAllInvitations}
          sendingAll={sendAllInvitationsMutation.isPending}
          onSyncEmployees={handleSyncEmployees}
          syncing={syncEmployeesMutation.isPending}
        />
        <ParticipantsError onRetry={() => refetch()} />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <PageHeader
        onSendAllInvitations={handleSendAllInvitations}
        sendingAll={sendAllInvitationsMutation.isPending}
        onSyncEmployees={handleSyncEmployees}
        syncing={syncEmployeesMutation.isPending}
      />

      {/* Summary Cards - LPI/KPI cards commented out per request */}
      {/*
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <KpiCard
          label="Total Participants"
          value={total.toLocaleString()}
          description="All participants"
        />
        <KpiCard
          label="Eligible"
          value={eligibleCount.toLocaleString()}
          description="Eligible for 401(k)"
        />
        <KpiCard
          label="Enrolled"
          value={enrolledCount.toLocaleString()}
          description="Actively enrolled"
        />
        <KpiCard
          label="Not Enrolled"
          value={notEnrolledCount.toLocaleString()}
          description="Can send invitation"
        />
      </div>
      */}

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <IconRefresh className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="all">All ({totalElements})</TabsTrigger>
              <TabsTrigger value="eligible">Eligible ({eligibleCount})</TabsTrigger>
              <TabsTrigger value="enrolled">Enrolled ({enrolledCount})</TabsTrigger>
              <TabsTrigger value="not-enrolled">Not Enrolled ({notEnrolledCount})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <ParticipantsSkeleton />
              ) : filteredParticipants.length === 0 ? (
                <ParticipantsEmpty />
              ) : (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="p-4 text-left text-sm font-medium">Participant</th>
                        <th className="p-4 text-left text-sm font-medium">Employment</th>
                        <th className="p-4 text-left text-sm font-medium">Eligibility</th>
                        <th className="p-4 text-left text-sm font-medium">Enrollment</th>
                        <th className="p-4 text-right text-sm font-medium">Pre-Tax %</th>
                        <th className="p-4 text-right text-sm font-medium">Roth %</th>
                        <th className="p-4 text-right text-sm font-medium">Balance</th>
                        <th className="p-4 text-left text-sm font-medium">Portfolio</th>
                        <th className="p-4 text-right text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParticipants.map((participant) => (
                        <ParticipantRow
                          key={participant.accountNumber}
                          participant={participant}
                          onClick={() => handleParticipantClick(participant)}
                          onSendInvitation={() => handleSendInvitation(participant.accountNumber || '')}
                          sendingInvitation={sendingInvitationFor === participant.accountNumber}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of{' '}
                    {totalElements} participants
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <IconChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                      <IconChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardContent>
  );
}
