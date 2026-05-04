'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconTicket,
  IconUser,
  IconCalendar,
  IconMessage,
  IconPaperclip,
  IconDownload,
  IconTrash,
  IconFileText,
  IconRefresh,
  IconX,
  IconArrowLeft,
  IconUserPlus,
  IconCheck,
  IconAlertCircle,
  IconChartBar,
  IconEdit,
  IconSend,
  IconShield,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { toast } from '@/lib/toast';
import { formatDate, formatEnum, formatRelativeTime, cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes';
import { useGetStatus } from '@/api/generated/endpoints/impersonation/impersonation';
import {
  useListAllTicketsAcrossAllTenants,
  useListAllUnassignedTicketsAcrossAllTenants,
  useGetAllTickets,
  useListUnassignedTickets,
  useClaimTicket,
  useAssignTicket,
  useUpdateTicket,
  useCloseTicket,
  useReopenTicket,
  useGetAllTenantsMetrics,
  useGetMetrics,
} from '@/api/generated/endpoints/support-tickets/support-tickets';
import {
  useListComments,
  useAddComment,
  useAddInternalNote,
  useDeleteComment,
} from '@/api/generated/endpoints/ticket-comments/ticket-comments';
import {
  useListAttachments,
  getDownloadUrl,
  useDeleteAttachment,
} from '@/api/generated/endpoints/ticket-attachments/ticket-attachments';
import type {
  TicketDTO,
  CreateCommentRequestDTO,
  AssignTicketRequestDTO,
  UpdateTicketRequestDTO,
} from '@/api/generated/models';
import { TicketDTOPriority, TicketDTOStatus } from '@/api/generated/models';

// Status badge with proper styling and formatEnum
function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;

  const config = {
    OPEN: { variant: 'default' as const, className: 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200' },
    ACTIVE: { variant: 'secondary' as const, className: 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200' },
    CLOSED: { variant: 'outline' as const, className: 'bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200' },
  };

  const statusConfig = config[status as keyof typeof config] ?? config.OPEN;

  return (
    <Badge variant={statusConfig.variant} className={cn('text-xs font-medium', statusConfig.className)}>
      {formatEnum(status)}
    </Badge>
  );
}

// Priority badge with proper styling and formatEnum
function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return null;

  const config: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    LOW: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config[priority] || config.MEDIUM)}>
      {formatEnum(priority)}
    </Badge>
  );
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'unassigned' | 'metrics'>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'OPEN' | 'ACTIVE' | 'CLOSED'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Assign dialog state
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignToUserId, setAssignToUserId] = useState('');

  // Update ticket dialog
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updatePriority, setUpdatePriority] = useState<keyof typeof TicketDTOPriority>('MEDIUM');
  const [updateStatus, setUpdateStatus] = useState<keyof typeof TicketDTOStatus>('OPEN');

  // Impersonation confirmation dialog
  const [showImpersonationDialog, setShowImpersonationDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ label: string; action: () => void } | null>(null);

  // Check if user is authenticated (auth is HttpOnly cookie-based, not token-based)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    const authFlag = sessionStorage.getItem('isAuthenticated') || localStorage.getItem('isAuthenticated');
    setIsAuthenticated(authFlag === 'true');
  }, []);

  // Check impersonation status - SuperAdmin needs to impersonate to use tenant-scoped ticket APIs
  const { data: impersonationStatusData } = useGetStatus({
    query: {
      retry: false,
      staleTime: 10_000,
      refetchInterval: 10_000, // Check every 10 seconds
    },
  });
  const impersonationStatus = impersonationStatusData as { isImpersonating?: boolean; session?: any } | undefined;
  const isImpersonating = !!impersonationStatus?.isImpersonating;

  // Helper function to show impersonation required message with confirmation dialog
  const requireImpersonation = (actionLabel: string, actionCallback?: () => void) => {
    // Store the action to execute after impersonation (if provided)
    if (actionCallback) {
      setPendingAction({ label: actionLabel, action: actionCallback });
    }
    
    // Show confirmation dialog (no toast message)
    setShowImpersonationDialog(true);
  };

  // Handle impersonation confirmation
  const handleConfirmImpersonation = () => {
    setShowImpersonationDialog(false);
    router.push(ROUTES.ADMIN.IMPERSONATION);
  };

  // Handle impersonation cancellation
  const handleCancelImpersonation = () => {
    setShowImpersonationDialog(false);
    setPendingAction(null);
  };

  // API Hooks - All Tickets (SUPER_ADMIN - cross-tenant via /tickets/all-tenants)
  const {
    data: allTicketsData,
    isLoading: allTicketsLoading,
    isError: allTicketsError,
    error: allTicketsErrorData,
    refetch: refetchAllTickets
  } = useListAllTicketsAcrossAllTenants({
    status: statusFilter === 'all' ? undefined : statusFilter,
    tenantId: tenantFilter === 'all' ? undefined : tenantFilter,
    priority: priorityFilter === 'all' ? undefined : priorityFilter,
    page: 0,
    size: 100,
  });

  // API Hooks - Unassigned Tickets (SUPER_ADMIN - cross-tenant)
  const {
    data: unassignedTicketsData,
    isLoading: unassignedLoading,
    isError: unassignedTicketsError,
    refetch: refetchUnassigned
  } = useListAllUnassignedTicketsAcrossAllTenants({
    tenantId: tenantFilter === 'all' ? undefined : tenantFilter,
    page: 0,
    size: 100,
  });

  // API Hooks - Metrics (SUPER_ADMIN - cross-tenant)
  const {
    data: metrics,
    isLoading: metricsLoading,
    isError: metricsError,
    refetch: refetchMetrics
  } = useGetAllTenantsMetrics();

  // Debug logging in development
  useEffect(() => {
    if (allTicketsError) {
      console.error('All Tickets API Error:', allTicketsErrorData);
      console.log('Is Authenticated:', isAuthenticated);
      console.log('User Info:', sessionStorage.getItem('userInfo') || localStorage.getItem('userInfo'));
    }
  }, [allTicketsError, allTicketsErrorData, isAuthenticated]);

  // Transform API response - handle both paginated and array responses
  const allTicketsResponse = allTicketsData as { content?: unknown[]; tickets?: unknown[] } | unknown[] | undefined;
  const unassignedTicketsResponse = unassignedTicketsData as { content?: unknown[]; tickets?: unknown[] } | unknown[] | undefined;

  // Mutations
  const claimTicketMutation = useClaimTicket();
  const assignTicketMutation = useAssignTicket();
  const updateTicketMutation = useUpdateTicket();
  const closeTicketMutation = useCloseTicket();
  const reopenTicketMutation = useReopenTicket();

  // Comments hooks - only enabled when impersonating (tenant-scoped endpoint)
  const { data: comments, isLoading: commentsLoading, refetch: refetchComments } = useListComments(
    selectedTicketId ?? '',
    { query: { enabled: isImpersonating && !!selectedTicketId && !allTicketsLoading } }
  );
  const addCommentMutation = useAddComment();
  const addInternalNoteMutation = useAddInternalNote();
  const deleteCommentMutation = useDeleteComment();

  // Attachments hooks - only enabled when impersonating (tenant-scoped endpoint)
  const { data: attachments, isLoading: attachmentsLoading, refetch: refetchAttachments } = useListAttachments(
    selectedTicketId || '00000000-0000-0000-0000-000000000000',
    {
      query: {
        enabled:
          isImpersonating &&
          !!(selectedTicketId && selectedTicketId.trim() !== '' && selectedTicketId !== '00000000-0000-0000-0000-000000000000') &&
          !allTicketsLoading &&
          !!allTicketsData,
      },
    }
  );
  const deleteAttachmentMutation = useDeleteAttachment();

  // Extract tickets from API responses - handle different response formats
  const extractTickets = (data: unknown): TicketDTO[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data as TicketDTO[];
    if (typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.content)) return obj.content as TicketDTO[];
      if (Array.isArray(obj.tickets)) return obj.tickets as TicketDTO[];
    }
    return [];
  };

  const allTickets = extractTickets(allTicketsResponse);
  const unassignedTickets = extractTickets(unassignedTicketsResponse);

  // Extract unique tenant IDs for filter dropdown
  const uniqueTenantIds = Array.from(
    new Set(
      [...allTickets, ...unassignedTickets]
        .map(ticket => ticket.tenantId)
        .filter((id): id is string => !!id)
    )
  ).sort();

  const handleClaimTicket = async (ticketId: string) => {
    if (!isImpersonating) return requireImpersonation('Claiming tickets');

    try {
      await claimTicketMutation.mutateAsync({ id: ticketId });
      toast.success('Ticket claimed successfully');
      refetchAllTickets();
      refetchUnassigned();
      refetchMetrics();
    } catch {
      toast.error('Failed to claim ticket');
    }
  };

  const handleAssignTicket = async () => {
    if (!isImpersonating) {
      setShowAssignDialog(false);
      return requireImpersonation('Assigning tickets');
    }

    if (!selectedTicketId || !assignToUserId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    const request: AssignTicketRequestDTO = {
      agentUserId: assignToUserId.trim(),
    };

    try {
      await assignTicketMutation.mutateAsync({
        id: selectedTicketId,
        data: request,
      });
      toast.success('Ticket assigned successfully');
      setShowAssignDialog(false);
      setAssignToUserId('');
      refetchAllTickets();
      refetchUnassigned();
      refetchMetrics();
    } catch {
      toast.error('Failed to assign ticket');
    }
  };

  const handleUpdateTicket = async () => {
    if (!isImpersonating) {
      setShowUpdateDialog(false);
      return requireImpersonation('Updating tickets');
    }

    if (!selectedTicketId) return;

    const request: UpdateTicketRequestDTO = {
      priority: TicketDTOPriority[updatePriority],
      status: TicketDTOStatus[updateStatus],
    };

    try {
      await updateTicketMutation.mutateAsync({
        id: selectedTicketId,
        data: request,
      });
      toast.success('Ticket updated successfully');
      setShowUpdateDialog(false);
      refetchAllTickets();
      refetchMetrics();
    } catch {
      toast.error('Failed to update ticket');
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    if (!isImpersonating) return requireImpersonation('Closing tickets');

    try {
      await closeTicketMutation.mutateAsync({
        id: ticketId,
        data: { resolutionNotes: 'Closed by support team' }
      });
      toast.success('Ticket closed successfully');
      refetchAllTickets();
      refetchMetrics();
    } catch {
      toast.error('Failed to close ticket');
    }
  };

  const handleReopenTicket = async (ticketId: string) => {
    if (!isImpersonating) return requireImpersonation('Reopening tickets');

    try {
      await reopenTicketMutation.mutateAsync({
        id: ticketId,
        data: { reason: 'Reopened for additional support' }
      });
      toast.success('Ticket reopened successfully');
      refetchAllTickets();
      refetchMetrics();
    } catch {
      toast.error('Failed to reopen ticket');
    }
  };

  const handleAddComment = async () => {
    if (!isImpersonating) return requireImpersonation('Adding comments or notes');

    if (!selectedTicketId || !newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    const commentRequest: CreateCommentRequestDTO = {
      body: newComment.trim(),
    };

    try {
      if (isInternalNote) {
        await addInternalNoteMutation.mutateAsync({
          ticketId: selectedTicketId,
          data: commentRequest,
        });
        toast.success('Internal note added');
      } else {
        await addCommentMutation.mutateAsync({
          ticketId: selectedTicketId,
          data: commentRequest,
        });
        toast.success('Comment added');
      }
      setNewComment('');
      setIsInternalNote(false);
      refetchComments();
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!isImpersonating) return requireImpersonation('Deleting comments');

    if (!selectedTicketId) return;

    try {
      await deleteCommentMutation.mutateAsync({
        ticketId: selectedTicketId,
        commentId,
      });
      toast.success('Comment deleted');
      refetchComments();
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleDownloadAttachment = async (ticketId: string, attachmentId: string) => {
    if (!isImpersonating) return requireImpersonation('Downloading attachments');

    try {
      const downloadUrl = await getDownloadUrl(ticketId, attachmentId);
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      }
    } catch {
      toast.error('Failed to download attachment');
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!isImpersonating) return requireImpersonation('Deleting attachments');

    if (!selectedTicketId) return;

    try {
      await deleteAttachmentMutation.mutateAsync({
        ticketId: selectedTicketId,
        attachmentId,
      });
      toast.success('Attachment deleted');
      refetchAttachments();
    } catch {
      toast.error('Failed to delete attachment');
    }
  };

  // Helper function to extract actual filename from stored filename
  const extractActualFileName = (storedFileName: string | undefined): string => {
    if (!storedFileName) return 'Unknown file';
    // The filename format is: {uuid}_tickets_{tenantId}_{ticketId}_{uuid}-{originalFilename}
    // Extract everything after the last dash
    const lastDashIndex = storedFileName.lastIndexOf('-');
    if (lastDashIndex !== -1 && lastDashIndex < storedFileName.length - 1) {
      return storedFileName.substring(lastDashIndex + 1);
    }
    // Fallback: return as-is if no dash found
    return storedFileName;
  };

  const selectedTicket = [...allTickets, ...unassignedTickets].find(t => t.id === selectedTicketId);

  // Ticket Detail View
  if (selectedTicketId && selectedTicket) {
    return (
      <DashboardContent>
        <div className="space-y-6">
          {/* Header with back button */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTicketId(null)}
              className="gap-2"
            >
              <IconArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          {/* Ticket Header Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                      {selectedTicket.tenantId ?? 'Unknown Tenant'}
                    </Badge>
                    <StatusBadge status={selectedTicket.status} />
                    <PriorityBadge priority={selectedTicket.priority} />
                  </div>
                  <CardTitle className="text-xl lg:text-2xl font-semibold">
                    {selectedTicket.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                      <IconTicket className="h-4 w-4" />
                      #{selectedTicket.id?.slice(0, 8)}
                    </span>
                    {selectedTicket.createdAt && (
                      <span className="flex items-center gap-1.5">
                        <IconCalendar className="h-4 w-4" />
                        {formatDate(selectedTicket.createdAt)}
                      </span>
                    )}
                  </CardDescription>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {!selectedTicket.assignedTo && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectedTicket.id && handleClaimTicket(selectedTicket.id)}
                      disabled={claimTicketMutation.isPending}
                    >
                      <IconCheck className="h-4 w-4 mr-1.5" />
                      Claim
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAssignDialog(true)}
                  >
                    <IconUserPlus className="h-4 w-4 mr-1.5" />
                    Assign
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUpdatePriority((selectedTicket.priority as keyof typeof TicketDTOPriority) || 'MEDIUM');
                      setUpdateStatus((selectedTicket.status as keyof typeof TicketDTOStatus) || 'OPEN');
                      setShowUpdateDialog(true);
                    }}
                  >
                    <IconEdit className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                  {selectedTicket.status === 'CLOSED' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => selectedTicket.id && handleReopenTicket(selectedTicket.id)}
                      disabled={reopenTicketMutation.isPending}
                    >
                      <IconRefresh className="h-4 w-4 mr-1.5" />
                      Reopen
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => selectedTicket.id && handleCloseTicket(selectedTicket.id)}
                      disabled={closeTicketMutation.isPending}
                    >
                      <IconX className="h-4 w-4 mr-1.5" />
                      Close
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4 border-t">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Assigned To</Label>
                  <p className="mt-1 text-sm font-medium flex items-center gap-2">
                    <IconUser className="h-4 w-4 text-muted-foreground" />
                    {selectedTicket.assignedToName || selectedTicket.assignedToEmail || 'Unassigned'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Created By</Label>
                  <p className="mt-1 text-sm font-medium">
                    {selectedTicket.creatorName || selectedTicket.creatorEmail || 'Unknown'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Category</Label>
                  <p className="mt-1 text-sm font-medium">
                    {formatEnum(selectedTicket.category) || 'General'}
                  </p>
                </div>
                {selectedTicket.updatedAt && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Last Updated</Label>
                    <p className="mt-1 text-sm font-medium">
                      {formatRelativeTime(selectedTicket.updatedAt)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <IconPaperclip className="h-5 w-5" />
                Attachments
                {attachments && attachments.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{attachments.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attachmentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : attachments && attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <IconFileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{extractActualFileName(attachment.fileName)}</p>
                          <p className="text-xs text-muted-foreground">
                            {attachment.fileSizeFormatted || (attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(1)} KB` : 'Unknown size')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => selectedTicket.id && attachment.id && handleDownloadAttachment(selectedTicket.id, attachment.id)}
                        >
                          <IconDownload className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => attachment.id && handleDeleteAttachment(attachment.id)}
                          disabled={deleteAttachmentMutation.isPending}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No attachments</p>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <IconMessage className="h-5 w-5" />
                Comments & Notes
                {comments && comments.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{comments.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {commentsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : comments && comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={cn(
                        'p-4 rounded-lg border',
                        comment.isInternal ? 'bg-amber-50 border-amber-200' : 'bg-muted/30'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <IconUser className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{comment.authorName || 'Unknown'}</span>
                          {comment.isInternal && (
                            <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700">
                              Internal
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {comment.createdAt && formatRelativeTime(comment.createdAt)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => comment.id && handleDeleteComment(comment.id)}
                            disabled={deleteCommentMutation.isPending}
                          >
                            <IconTrash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
              )}

              {/* Add Comment Form */}
              {isImpersonating && selectedTicket.status !== 'CLOSED' && (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Add Response</Label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-muted-foreground">Internal note</span>
                    </label>
                  </div>
                  <Textarea
                    placeholder={isInternalNote ? 'Add internal note...' : 'Type your response...'}
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="text-sm"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={addCommentMutation.isPending || addInternalNoteMutation.isPending || !newComment.trim()}
                    className="w-full sm:w-auto"
                    size="sm"
                  >
                    {(addCommentMutation.isPending || addInternalNoteMutation.isPending) ? (
                      <>
                        <IconRefresh className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <IconSend className="mr-2 h-4 w-4" />
                        {isInternalNote ? 'Add Note' : 'Send Response'}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assign Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Ticket</DialogTitle>
              <DialogDescription>
                Enter the user ID of the support agent to assign this ticket.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="assignUserId" className="text-sm font-medium">
                Agent User ID
              </Label>
              <Input
                id="assignUserId"
                placeholder="Enter user ID"
                value={assignToUserId}
                onChange={(e) => setAssignToUserId(e.target.value)}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAssignTicket} disabled={assignTicketMutation.isPending}>
                {assignTicketMutation.isPending ? 'Assigning...' : 'Assign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Dialog */}
        <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Ticket</DialogTitle>
              <DialogDescription>
                Modify the ticket status and priority.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Select value={updateStatus} onValueChange={(v) => setUpdateStatus(v as keyof typeof TicketDTOStatus)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">{formatEnum('OPEN')}</SelectItem>
                    <SelectItem value="ACTIVE">{formatEnum('ACTIVE')}</SelectItem>
                    <SelectItem value="CLOSED">{formatEnum('CLOSED')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Priority</Label>
                <Select value={updatePriority} onValueChange={(v) => setUpdatePriority(v as keyof typeof TicketDTOPriority)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRITICAL">{formatEnum('CRITICAL')}</SelectItem>
                    <SelectItem value="HIGH">{formatEnum('HIGH')}</SelectItem>
                    <SelectItem value="MEDIUM">{formatEnum('MEDIUM')}</SelectItem>
                    <SelectItem value="LOW">{formatEnum('LOW')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowUpdateDialog(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpdateTicket} disabled={updateTicketMutation.isPending}>
                {updateTicketMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Impersonation Confirmation Dialog */}
        <Dialog open={showImpersonationDialog} onOpenChange={setShowImpersonationDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <IconShield className="h-6 w-6 text-amber-500" />
                <DialogTitle>Tenant Context Required</DialogTitle>
              </div>
              <DialogDescription className="pt-2">
                {pendingAction ? (
                  <>
                    To {pendingAction.label.toLowerCase()}, you must first impersonate a user from this ticket's tenant. 
                    This ensures proper access control and maintains audit compliance.
                  </>
                ) : (
                  <>
                    To perform this action, you must first impersonate a user from this ticket's tenant. 
                    This ensures proper access control and maintains audit compliance.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Do you want to impersonate a user from this ticket's tenant?
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={handleCancelImpersonation}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmImpersonation}>
                <IconShield className="h-4 w-4 mr-2" />
                Start Impersonation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardContent>
    );
  }

  // Main List View
  return (
    <DashboardContent>
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <IconTicket className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Manage support tickets across all tenants
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="all" className="gap-2">
            <IconTicket className="h-4 w-4" />
            All Tickets
          </TabsTrigger>
          <TabsTrigger value="unassigned" className="gap-2">
            <IconAlertCircle className="h-4 w-4" />
            Unassigned
            {unassignedTickets.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {unassignedTickets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2">
            <IconChartBar className="h-4 w-4" />
            Metrics
          </TabsTrigger>
        </TabsList>

        {/* All Tickets Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">All Tickets</CardTitle>
                  <CardDescription>
                    {allTickets.length} total tickets
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={tenantFilter} onValueChange={setTenantFilter}>
                    <SelectTrigger className="w-36 h-9 text-sm">
                      <SelectValue placeholder="All Tenants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tenants</SelectItem>
                      {uniqueTenantIds.map((id) => (
                        <SelectItem key={id} value={id}>{id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                    <SelectTrigger className="w-28 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="OPEN">{formatEnum('OPEN')}</SelectItem>
                      <SelectItem value="ACTIVE">{formatEnum('ACTIVE')}</SelectItem>
                      <SelectItem value="CLOSED">{formatEnum('CLOSED')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as typeof priorityFilter)}>
                    <SelectTrigger className="w-28 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="CRITICAL">{formatEnum('CRITICAL')}</SelectItem>
                      <SelectItem value="HIGH">{formatEnum('HIGH')}</SelectItem>
                      <SelectItem value="MEDIUM">{formatEnum('MEDIUM')}</SelectItem>
                      <SelectItem value="LOW">{formatEnum('LOW')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => refetchAllTickets()}
                    disabled={allTicketsLoading}
                  >
                    <IconRefresh className={cn('h-4 w-4', allTicketsLoading && 'animate-spin')} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {allTicketsError ? (
                <div className="text-center py-12">
                  <IconAlertCircle className="h-12 w-12 text-destructive/50 mx-auto mb-3" />
                  <p className="text-sm font-medium text-destructive">Failed to load tickets</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(allTicketsErrorData as Error)?.message || 'Backend API error'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The /tickets/all-tenants endpoint may not be configured for Super Admin access.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Session: {isAuthenticated ? 'Active' : 'Not authenticated'}
                  </p>
                  <div className="flex gap-2 justify-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchAllTickets()}
                    >
                      <IconRefresh className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : allTicketsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : allTickets.length > 0 ? (
                <div className="space-y-3">
                  {allTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => ticket.id && setSelectedTicketId(ticket.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                              {ticket.tenantId ?? 'Unknown'}
                            </Badge>
                            <StatusBadge status={ticket.status} />
                            <PriorityBadge priority={ticket.priority} />
                            {!ticket.assignedTo && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                Unassigned
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-medium text-sm truncate">{ticket.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {ticket.creatorName && <span>By: {ticket.creatorName}</span>}
                            {ticket.createdAt && <span>{formatRelativeTime(ticket.createdAt)}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <IconTicket className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm font-medium">No tickets found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Adjust filters or check back later
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unassigned Tab */}
        <TabsContent value="unassigned">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Unassigned Tickets</CardTitle>
                  <CardDescription>
                    {unassignedTickets.length} tickets waiting to be claimed
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => refetchUnassigned()}
                  disabled={unassignedLoading}
                >
                  <IconRefresh className={cn('h-4 w-4', unassignedLoading && 'animate-spin')} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {unassignedTicketsError ? (
                <div className="text-center py-12">
                  <IconAlertCircle className="h-12 w-12 text-destructive/50 mx-auto mb-3" />
                  <p className="text-sm font-medium text-destructive">Failed to load tickets</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please check your permissions or try again
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => refetchUnassigned()}
                  >
                    <IconRefresh className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : unassignedLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : unassignedTickets.length > 0 ? (
                <div className="space-y-3">
                  {unassignedTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div
                          className="flex-1 min-w-0 space-y-2 cursor-pointer"
                          onClick={() => ticket.id && setSelectedTicketId(ticket.id)}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                              {ticket.tenantId ?? 'Unknown'}
                            </Badge>
                            <StatusBadge status={ticket.status} />
                            <PriorityBadge priority={ticket.priority} />
                          </div>
                          <h3 className="font-medium text-sm truncate">{ticket.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {ticket.creatorName && <span>By: {ticket.creatorName}</span>}
                            {ticket.createdAt && <span>{formatRelativeTime(ticket.createdAt)}</span>}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            ticket.id && handleClaimTicket(ticket.id);
                          }}
                          disabled={claimTicketMutation.isPending}
                        >
                          <IconCheck className="h-4 w-4 mr-1.5" />
                          Claim
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <IconCheck className="h-12 w-12 text-green-500/50 mx-auto mb-3" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No unassigned tickets at the moment
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Platform Metrics</h2>
                <p className="text-sm text-muted-foreground">
                  Aggregated statistics across all tenants
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => refetchMetrics()}
                disabled={metricsLoading}
              >
                <IconRefresh className={cn('h-4 w-4', metricsLoading && 'animate-spin')} />
              </Button>
            </div>

            {metricsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <>
                {/* Status Overview */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Ticket Status</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                        <p className="text-2xl font-bold mt-1">{metrics?.totalTickets ?? 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Open</p>
                        <p className="text-2xl font-bold mt-1 text-blue-600">{metrics?.openTickets ?? 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Active</p>
                        <p className="text-2xl font-bold mt-1 text-amber-600">{metrics?.activeTickets ?? 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Closed</p>
                        <p className="text-2xl font-bold mt-1 text-gray-600">{metrics?.closedTickets ?? 0}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Priority & Urgency */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Priority & Urgency</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Unassigned</p>
                        <p className="text-2xl font-bold mt-1 text-red-600">{metrics?.unassignedTickets ?? 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical</p>
                        <p className="text-2xl font-bold mt-1 text-red-600">{metrics?.criticalTickets ?? 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">High Priority</p>
                        <p className="text-2xl font-bold mt-1 text-orange-600">{metrics?.highPriorityTickets ?? 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Overdue</p>
                        <p className="text-2xl font-bold mt-1 text-red-600">{metrics?.overdueTickets ?? 0}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Performance */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Performance</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg First Response</p>
                        <p className="text-2xl font-bold mt-1">
                          {metrics?.avgFirstResponseTimeMinutes != null
                            ? metrics.avgFirstResponseTimeMinutes >= 60
                              ? `${Math.floor(metrics.avgFirstResponseTimeMinutes / 60)}h ${Math.round(metrics.avgFirstResponseTimeMinutes % 60)}m`
                              : `${Math.round(metrics.avgFirstResponseTimeMinutes)}m`
                            : 'N/A'}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Resolution Time</p>
                        <p className="text-2xl font-bold mt-1">
                          {metrics?.avgResolutionTimeMinutes != null
                            ? metrics.avgResolutionTimeMinutes >= 60
                              ? `${Math.floor(metrics.avgResolutionTimeMinutes / 60)}h ${Math.round(metrics.avgResolutionTimeMinutes % 60)}m`
                              : `${Math.round(metrics.avgResolutionTimeMinutes)}m`
                            : 'N/A'}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">SLA Compliance</p>
                        <p className="text-2xl font-bold mt-1 text-green-600">
                          {metrics?.slaCompliancePercentage != null
                            ? `${metrics.slaCompliancePercentage.toFixed(1)}%`
                            : 'N/A'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Today's Activity */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Today&apos;s Activity</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Created Today</p>
                        <p className="text-2xl font-bold mt-1 text-blue-600">{metrics?.ticketsCreatedToday ?? 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Closed Today</p>
                        <p className="text-2xl font-bold mt-1 text-green-600">{metrics?.ticketsClosedToday ?? 0}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardContent>
  );
}
