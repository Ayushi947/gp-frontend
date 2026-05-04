'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconLifebuoy,
  IconMessage,
  IconHelp,
  IconTicket,
  IconSend,
  IconRefresh,
  IconX,
  IconArrowLeft,
  IconPlus,
  IconClock,
  IconUser,
  IconCalendar,
  IconPaperclip,
  IconDownload,
  IconTrash,
  IconFileText,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { toast } from '@/lib/toast';
import { formatDate, formatEnum, cn } from '@/lib/utils';
import {
  useListMyTickets,
  useCreateTicket,
  useCloseTicket,
  useReopenTicket,
} from '@/api/generated/endpoints/support-tickets/support-tickets';
import {
  useListComments,
  useAddComment,
  useDeleteComment,
} from '@/api/generated/endpoints/ticket-comments/ticket-comments';
import {
  useRequestUploadUrl,
  useConfirmUpload,
  useListAttachments,
  getDownloadUrl,
  useDeleteAttachment,
} from '@/api/generated/endpoints/ticket-attachments/ticket-attachments';
import type {
  TicketDTO,
  TicketRequestDTO,
  CreateCommentRequestDTO,
  AttachmentUploadRequestDTO,
} from '@/api/generated/models';
import {
  TicketDTOPriority,
  TicketDTOStatus,
  CreateTicketRequestDTOPriority,
  CreateTicketRequestDTOCategory,
} from '@/api/generated/models';
import { createTicketSchema, type CreateTicketFormData } from '@/lib/validators';

const FAQ_ITEMS = [
  {
    question: 'How do I upload payroll contributions?',
    answer: 'Navigate to the Payrolls page and click "Upload Payroll". You can upload a CSV file with employee contributions, or integrate directly with your payroll provider through our Finch integration.',
  },
  {
    question: 'When are contributions processed?',
    answer: 'Contributions are typically processed within 1-2 business days after submission. You\'ll receive an email notification once processing is complete.',
  },
  {
    question: 'How do I add a new participant?',
    answer: 'Participants are automatically added when you upload payroll data. You can also manually add participants by going to the Participants page and clicking "Add Participant".',
  },
  {
    question: 'What reports are available?',
    answer: 'We offer comprehensive reporting including payroll reports, contribution reports, balance reports, compliance testing, and Form 5500 preparation. All reports can be accessed from the Reports section.',
  },
  {
    question: 'How do I change plan settings?',
    answer: 'Go to Settings to view and modify your plan configuration. Some changes may require approval or additional documentation. Contact support if you need assistance with plan amendments.',
  },
];

function getStatusBadge(status?: string) {
  if (!status) return null;

  const variants: Record<string, {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
  }> = {
    OPEN: { variant: 'default', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    ACTIVE: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    CLOSED: { variant: 'outline', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  };

  const config = variants[status] || variants.OPEN;
  if (!config) {
    return <Badge variant="outline">{formatEnum(status)}</Badge>;
  }
  return (
    <Badge variant={config.variant} className={config.className}>
      {formatEnum(status)}
    </Badge>
  );
}

function getPriorityBadge(priority?: string) {
  if (!priority) return null;

  const variants: Record<string, {
    className: string;
  }> = {
    LOW: { className: 'bg-gray-100 text-gray-800 border-gray-200' },
    MEDIUM: { className: 'bg-orange-100 text-orange-800 border-orange-200' },
    HIGH: { className: 'bg-red-100 text-red-800 border-red-200' },
    CRITICAL: { className: 'bg-red-200 text-red-900 border-red-300' },
  };

  const config = variants[priority] || variants.MEDIUM;
  if (!config) {
    return <Badge variant="outline">{formatEnum(priority)}</Badge>;
  }
  return (
    <Badge variant="outline" className={config.className}>
      {formatEnum(priority)}
    </Badge>
  );
}

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'faqs' | 'tickets'>('faqs');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

  // Form management with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      priority: CreateTicketRequestDTOPriority.MEDIUM,
      category: CreateTicketRequestDTOCategory.GENERAL_INQUIRY,
    },
  });

  // Comment state
  const [newComment, setNewComment] = useState('');

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // API Hooks
  // Convert frontend filter to backend enum format (uppercase, or undefined for 'all')
  const getBackendStatus = () => {
    if (statusFilter === 'all') return undefined;
    if (statusFilter === 'open') return 'OPEN' as const;
    if (statusFilter === 'closed') return 'CLOSED' as const;
    return undefined;
  };

  const { data: ticketsResponse, isLoading: ticketsLoading, refetch } = useListMyTickets({
    status: getBackendStatus(),
    page: 0,
    size: 100
  });
  const createTicketMutation = useCreateTicket();
  const closeTicketMutation = useCloseTicket();
  const reopenTicketMutation = useReopenTicket();

  // Comments hooks
  const { data: comments, isLoading: commentsLoading, refetch: refetchComments } = useListComments(
    selectedTicketId ?? '',
    { query: { enabled: !!selectedTicketId && !ticketsLoading } }
  );
  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();

  // Attachments hooks - use valid UUID placeholder to prevent malformed URL and server errors
  const { data: attachments, isLoading: attachmentsLoading, refetch: refetchAttachments } = useListAttachments(
    selectedTicketId || '00000000-0000-0000-0000-000000000000',
    { query: { enabled: !!(selectedTicketId && selectedTicketId.trim() !== '' && selectedTicketId !== '00000000-0000-0000-0000-000000000000') && !ticketsLoading && !!ticketsResponse } }
  );
  const requestUploadUrlMutation = useRequestUploadUrl();
  const confirmUploadMutation = useConfirmUpload();
  const deleteAttachmentMutation = useDeleteAttachment();

  const tickets = ticketsResponse?.content ?? [];
  // Calculate ticket counts from the data
  const ticketCounts = {
    total: ticketsResponse?.totalElements ?? 0,
    open: tickets.filter(t => t.status === 'OPEN').length,
    active: tickets.filter(t => t.status === 'ACTIVE').length,
    closed: tickets.filter(t => t.status === 'CLOSED').length,
  };

  const onSubmitTicket = async (data: CreateTicketFormData) => {
    const ticketRequest = {
      title: data.title.trim(),
      description: data.description.trim(),
      priority: data.priority,
      category: data.category,
    };

    try {
      const newTicket = await createTicketMutation.mutateAsync({ data: ticketRequest });
      toast.success('Support ticket created successfully!');

      // Upload files if any
      if (selectedFiles.length > 0 && newTicket.id) {
        await handleUploadFiles(newTicket.id);
      }

      reset();
      setSelectedFiles([]);
      setShowCreateDialog(false);
      refetch();

      // Auto-navigate to the new ticket
      if (newTicket.id) {
        setSelectedTicketId(newTicket.id);
        setActiveTab('tickets');
      }
    } catch (error: any) {
      // Handle backend validation errors
      const fieldErrors = error?.response?.data?.fieldErrors;
      if (fieldErrors) {
        const errorMessages = Object.entries(fieldErrors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join('\n');
        toast.error('Validation Error', errorMessages);
      } else {
        const message = error?.response?.data?.userMessage || error?.response?.data?.message || 'Failed to create support ticket';
        toast.error(message);
      }
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      await closeTicketMutation.mutateAsync({
        id: ticketId,
        data: { resolutionNotes: 'Issue resolved by support team.' }
      });
      toast.success('Ticket closed successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to close ticket');
    }
  };

  const handleReopenTicket = async (ticketId: string) => {
    try {
      await reopenTicketMutation.mutateAsync({
        id: ticketId,
        data: { reason: 'Reopening ticket for additional support' }
      });
      toast.success('Ticket reopened successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to reopen ticket');
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicketId || !newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    const commentRequest: CreateCommentRequestDTO = {
      body: newComment,
    };

    try {
      await addCommentMutation.mutateAsync({
        ticketId: selectedTicketId,
        data: commentRequest,
      });
      toast.success('Comment added successfully');
      setNewComment('');
      refetchComments();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedTicketId) return;

    try {
      await deleteCommentMutation.mutateAsync({
        ticketId: selectedTicketId,
        commentId,
      });
      toast.success('Comment deleted successfully');
      refetchComments();
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async (ticketId: string) => {
    if (selectedFiles.length === 0) return;

    setUploadingFiles(true);
    try {
      for (const file of selectedFiles) {
        // Step 1: Request upload URL
        const uploadUrlRequest: AttachmentUploadRequestDTO = {
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        };

        const uploadUrlResponse = await requestUploadUrlMutation.mutateAsync({
          ticketId,
          data: uploadUrlRequest,
        });

        // Step 2: Upload to S3
        const uploadResponse = await fetch(uploadUrlResponse.uploadUrl ?? '', {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        // Step 3: Confirm upload
        await confirmUploadMutation.mutateAsync({
          ticketId,
          params: {
            fileKey: uploadUrlResponse.fileKey ?? '',
          },
        });
      }

      toast.success(`${selectedFiles.length} file(s) uploaded successfully`);
      setSelectedFiles([]);
      refetchAttachments();
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDownloadAttachment = async (ticketId: string, attachmentId: string) => {
    try {
      // Use the generated API function directly (not the hook)
      const downloadUrl = await getDownloadUrl(ticketId, attachmentId);
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      toast.error('Failed to download attachment');
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!selectedTicketId) return;

    try {
      await deleteAttachmentMutation.mutateAsync({
        ticketId: selectedTicketId,
        attachmentId,
      });
      toast.success('Attachment deleted successfully');
      refetchAttachments();
    } catch (error) {
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

  const handleViewTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
  };

  const handleBackToList = () => {
    setSelectedTicketId(null);
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  return (
    <DashboardContent>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <IconLifebuoy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
            <p className="text-muted-foreground mt-1">
              Get help with your 401(k) plan administration
            </p>
          </div>
        </div>
        {activeTab === 'tickets' && !selectedTicketId && (
          <Button onClick={() => setShowCreateDialog(true)} size="lg">
            <IconPlus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        )}
      </div>

      {/* Ticket Detail View with Comments and Attachments */}
      {selectedTicketId && selectedTicket ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToList}
                    className="mb-2"
                  >
                    <IconArrowLeft className="h-4 w-4 mr-2" />
                    Back to Tickets
                  </Button>
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-2xl">{selectedTicket.title}</CardTitle>
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                  <CardDescription className="flex items-center gap-4 text-sm">
                    {selectedTicket.id && (
                      <span className="flex items-center gap-1">
                        <IconTicket className="h-4 w-4" />
                        #{selectedTicket.id}
                      </span>
                    )}
                    {selectedTicket.createdAt && (
                      <span className="flex items-center gap-1">
                        <IconCalendar className="h-4 w-4" />
                        Created {formatDate(selectedTicket.createdAt)}
                      </span>
                    )}
                    {selectedTicket.timeAgo && (
                      <span className="flex items-center gap-1">
                        <IconClock className="h-4 w-4" />
                        {selectedTicket.timeAgo}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedTicket.status === TicketDTOStatus.CLOSED ? (
                    <Button
                      variant="outline"
                      onClick={() => selectedTicket.id && handleReopenTicket(selectedTicket.id)}
                      disabled={reopenTicketMutation.isPending}
                    >
                      <IconRefresh className="h-4 w-4 mr-2" />
                      Reopen Ticket
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={() => selectedTicket.id && handleCloseTicket(selectedTicket.id)}
                      disabled={closeTicketMutation.isPending}
                    >
                      <IconX className="h-4 w-4 mr-2" />
                      Close Ticket
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ticket Description */}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Ticket Details */}
              <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                <div>
                  <Label className="text-sm text-muted-foreground">Priority</Label>
                  <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                </div>
                {selectedTicket.assignedTo && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Assigned To</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <IconUser className="h-4 w-4" />
                      <span>{selectedTicket.assignedTo}</span>
                    </div>
                  </div>
                )}
                {selectedTicket.updatedAt && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Last Updated</Label>
                    <div className="mt-1">{formatDate(selectedTicket.updatedAt)}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attachments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconPaperclip className="h-5 w-5" />
                Attachments
                {attachments && attachments.length > 0 && (
                  <Badge variant="secondary">{attachments.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {attachmentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : attachments && attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <IconFileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{extractActualFileName(attachment.fileName)}</p>
                          <p className="text-sm text-muted-foreground">
                            {attachment.mimeType} • {attachment.fileSizeFormatted || (attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(2)} KB` : 'Unknown size')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => selectedTicket.id && attachment.id && handleDownloadAttachment(selectedTicket.id, attachment.id)}
                        >
                          <IconDownload className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
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
                <p className="text-sm text-muted-foreground text-center py-4">
                  No attachments yet
                </p>
              )}

              {/* File Upload Section */}
              {selectedTicket.status !== TicketDTOStatus.CLOSED && (
                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors">
                        <div className="flex flex-col items-center gap-2">
                          <IconPaperclip className="h-8 w-8 text-muted-foreground" />
                          <div className="text-center">
                            <p className="font-medium">Click to upload files</p>
                            <p className="text-sm text-muted-foreground">
                              or drag and drop (Max 10MB per file)
                            </p>
                          </div>
                        </div>
                        <Input
                          id="file-upload"
                          type="file"
                          className="hidden"
                          multiple
                          onChange={handleFileSelect}
                        />
                      </div>
                    </Label>

                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label>Selected Files:</Label>
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <span className="text-sm">{file.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFile(index)}
                            >
                              <IconX className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          onClick={() => selectedTicket.id && handleUploadFiles(selectedTicket.id)}
                          disabled={uploadingFiles}
                          className="w-full"
                        >
                          {uploadingFiles ? (
                            <>
                              <IconRefresh className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <IconPaperclip className="mr-2 h-4 w-4" />
                              Upload Files
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMessage className="h-5 w-5" />
                Comments
                {comments && comments.length > 0 && (
                  <Badge variant="secondary">{comments.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {commentsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : comments && comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={cn(
                        'p-4 rounded-lg border',
                        comment.isInternal && 'bg-amber-50 border-amber-200'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <IconUser className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{comment.authorName ?? 'Unknown'}</span>
                          {comment.isInternal && (
                            <Badge variant="outline" className="text-xs">
                              Internal Note
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {comment.createdAt && formatDate(comment.createdAt)}
                          </span>
                          {comment.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteComment(comment.id!)}
                              disabled={deleteCommentMutation.isPending}
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {comment.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet
                </p>
              )}

              {/* Add Comment Section */}
              {selectedTicket.status !== TicketDTOStatus.CLOSED && (
                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <Label htmlFor="new-comment">Add Comment</Label>
                    <Textarea
                      id="new-comment"
                      placeholder="Type your message..."
                      rows={4}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={addCommentMutation.isPending}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={addCommentMutation.isPending || !newComment.trim()}
                      className="w-full"
                    >
                      {addCommentMutation.isPending ? (
                        <>
                          <IconRefresh className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <IconSend className="mr-2 h-4 w-4" />
                          Post Comment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex gap-3">
              <IconLifebuoy className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Need immediate assistance?</p>
                <p className="text-muted-foreground">
                  Call us at <a href="tel:1-800-123-4567" className="text-primary hover:underline">1-800-123-4567</a> (Mon-Fri, 9am-5pm EST)
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Tabs View */
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="faqs">
              <IconHelp className="h-4 w-4 mr-2" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="tickets">
              <IconTicket className="h-4 w-4 mr-2" />
              My Tickets
              {ticketCounts?.open ? (
                <Badge variant="secondary" className="ml-2">
                  {ticketCounts.open}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Find answers to common questions about plan administration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {FAQ_ITEMS.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    Can't find what you're looking for?
                  </p>
                  <Button onClick={() => { setActiveTab('tickets'); setShowCreateDialog(true); }}>
                    <IconMessage className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Tickets Tab */}
          <TabsContent value="tickets" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Support Tickets</CardTitle>
                    <CardDescription>
                      View and track your support requests
                      {ticketCounts && (
                        <span className="ml-2">
                          ({ticketCounts.total} total, {ticketCounts.open} open, {ticketCounts.closed} closed)
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => refetch()}
                      disabled={ticketsLoading}
                    >
                      <IconRefresh className={cn('h-4 w-4', ticketsLoading && 'animate-spin')} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="pt-6">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-1/2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : tickets.length > 0 ? (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => ticket.id && handleViewTicket(ticket.id)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-semibold">{ticket.title}</h3>
                                {getStatusBadge(ticket.status)}
                                {getPriorityBadge(ticket.priority)}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {ticket.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {ticket.id && <span>#{ticket.id}</span>}
                                {ticket.timeAgo && <span>{ticket.timeAgo}</span>}
                                {ticket.createdAt && <span>Created: {formatDate(ticket.createdAt)}</span>}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <IconTicket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Support Tickets</h3>
                    <p className="text-muted-foreground mb-4">
                      {statusFilter === 'all'
                        ? "You haven't submitted any support tickets yet"
                        : `No ${statusFilter} tickets found`}
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <IconPlus className="mr-2 h-4 w-4" />
                      Create New Ticket
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) {
          reset();
          setSelectedFiles([]);
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit(onSubmitTicket)}>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>
                Submit a support request and our team will get back to you within 24 hours
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Subject *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of your issue"
                  {...register('title')}
                  disabled={createTicketMutation.isPending}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="priority" className={errors.priority ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CreateTicketRequestDTOPriority.LOW}>Low - General question</SelectItem>
                        <SelectItem value={CreateTicketRequestDTOPriority.MEDIUM}>Medium - Need help soon</SelectItem>
                        <SelectItem value={CreateTicketRequestDTOPriority.HIGH}>High - Urgent issue</SelectItem>
                        <SelectItem value={CreateTicketRequestDTOPriority.CRITICAL}>Critical - Immediate attention required</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.priority && (
                  <p className="text-sm text-red-500">{errors.priority.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Message *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about your question or issue..."
                  rows={6}
                  {...register('description')}
                  disabled={createTicketMutation.isPending}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
                {watch('description') && (
                  <p className="text-xs text-muted-foreground">
                    {watch('description').length} / 50000 characters
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments (Optional)</Label>
                <Label htmlFor="dialog-file-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors">
                    <div className="flex items-center justify-center gap-2">
                      <IconPaperclip className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {selectedFiles.length > 0
                          ? `${selectedFiles.length} file(s) selected`
                          : 'Click to attach files'}
                      </span>
                    </div>
                    <Input
                      id="dialog-file-upload"
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleFileSelect}
                    />
                  </div>
                </Label>
                {selectedFiles.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded text-sm"
                      >
                        <span className="truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <IconX className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <IconLifebuoy className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Need immediate assistance?</p>
                    <p className="text-muted-foreground">
                      Call us at <a href="tel:1-800-123-4567" className="text-primary hover:underline">1-800-123-4567</a> (Mon-Fri, 9am-5pm EST)
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  reset();
                  setSelectedFiles([]);
                }}
                disabled={createTicketMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTicketMutation.isPending || !isValid}
              >
                {createTicketMutation.isPending ? (
                  <>
                    <IconRefresh className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <IconSend className="mr-2 h-4 w-4" />
                    Create Ticket
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardContent>
  );
}
