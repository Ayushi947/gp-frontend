'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGenerateUploadUrl,
  useConfirmUpload1,
  useGetDocumentsByTenant,
  useDeleteDocumentsByTenant,
} from '@/api/generated/endpoints/admin-documents/admin-documents';
import { useNotifySponsorDocumentsReadyByTenantId } from '@/api/generated/endpoints/notifications/notifications';
import { useGetAllTenants, useGetTenantPlanDetails } from '@/api/generated/endpoints/tenant-management/tenant-management';
import { useGetDetails } from '@/api/generated/endpoints/plan-sponsor-details/plan-sponsor-details';
import { useGetParticipants } from '@/api/generated/endpoints/participants/participants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  IconFileText,
  IconUpload,
  IconTrash,
  IconLoader2,
  IconBuilding,
  IconEye,
  IconSearch,
  IconUsers,
  IconSettings,
  IconShieldCheck,
  IconInfoCircle,
  IconX,
  IconCheck,
  IconCloudUpload,
  IconBell,
  IconMail,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { customInstance } from '@/api/client';
import { DashboardContent } from '@/components/layout/dashboard-layout';

interface OnBoardingStateResponse {
  currentState?: string;
  completedSteps?: string[];
}

interface TenantWithState {
  id?: string;
  companyName?: string;
  contactEmail?: string;
  contactPhone?: string;
  employeeCount?: number;
  participantCount?: number;
  status?: string;
  createdAt?: string;
  onboardingState?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  subscriptionTier?: string;
}

// Reusable status badge with aligned chip colors (same as tenants table)
const getStatusBadge = (status?: string) => {
  if (!status) return null;

  const statusUpper = status.toUpperCase();

  const badgeConfig: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800 border-green-200',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    SUSPENDED: 'bg-red-100 text-red-800 border-red-200',
    TRIAL: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const className = badgeConfig[statusUpper] ?? 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <Badge variant="outline" className={className}>
      {statusUpper.charAt(0) + statusUpper.slice(1).toLowerCase()}
    </Badge>
  );
};

// Onboarding states in order
const ONBOARDING_STATES = {
  COMPANY_BASIC_DETAILS: { order: 1, label: 'Company Details' },
  PLAN_DETAILS: { order: 2, label: 'Plan Details' },
  BUISNESS_DETAILS: { order: 3, label: 'Business Details' },
  PLAN_START_DATE: { order: 4, label: 'Plan Start Date' },
  PRICING: { order: 5, label: 'Pricing' },
  TRUSTEE: { order: 6, label: 'Trustee Confirmation' },
  SIGN: { order: 7, label: 'Document Signing' },
  BANK_VERIFICATION: { order: 8, label: 'Bank Verification' },
  FINCH: { order: 9, label: 'Payroll Integration' },
  DASHBOARD: { order: 10, label: 'Completed' },
};

// Only show sponsors at TRUSTEE step (ready for document upload) or SIGN step (in signing process)
const PENDING_DOCUMENT_STATES = ['TRUSTEE', 'SIGN'];

export default function AdminDocumentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [selectedSponsor, setSelectedSponsor] = useState<TenantWithState | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tenantsWithStates, setTenantsWithStates] = useState<TenantWithState[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: tenantsData, isLoading: tenantsLoading } = useGetAllTenants({
    pageable: { page: 0, size: 1000 },
  });

  // Fetch plan details for the selected tenant using the tenant-management endpoint
  // This endpoint returns CompanyPlanResponseDTO[] which has the correct structure for the UI
  const { data: planDetails, isLoading: loadingPlanDetails } = useGetTenantPlanDetails(
    selectedTenantId || '',
    {
      query: {
        enabled: !!selectedTenantId && reviewDialogOpen,
      },
    }
  );

  // Fetch onboarding states for all tenants
  useEffect(() => {
    const fetchOnboardingStates = async () => {
      if (!tenantsData?.content || tenantsData.content.length === 0) {
        return;
      }

      setLoadingStates(true);
      const tenants = tenantsData.content;
      const tenantsWithStatesTemp: TenantWithState[] = [];

       // Fetch onboarding state for each tenant
       if (tenants) {
        for (const tenant of tenants) {
          try {
            const response = await customInstance<OnBoardingStateResponse>({
              url: `/superadmin/tenants/${tenant.id}/onboarding-state`,
              method: 'GET',
            });
  
            tenantsWithStatesTemp.push({
              ...tenant,
              onboardingState: response.currentState || 'COMPANY_BASIC_DETAILS',
            });
          } catch (error) {
            // If error fetching state, still include tenant with default state
            tenantsWithStatesTemp.push({
              ...tenant,
              onboardingState: 'COMPANY_BASIC_DETAILS',
            });
          }
        }
       }

      setTenantsWithStates(tenantsWithStatesTemp);
      setLoadingStates(false);
    };

    fetchOnboardingStates();
  }, [tenantsData]);

  // Note: These endpoints work on authenticated user context, not tenant ID
  // They will only work if the current user is the plan sponsor
  // For super admin viewing other tenants, these will be disabled
  const { data: sponsorDetails, isLoading: detailsLoading } = useGetDetails(
    undefined,
    {
      query: {
        // Disabled for now - these endpoints don't support viewing other tenants
        enabled: false,
      },
    }
  );

  const { data: participants, isLoading: participantsLoading } = useGetParticipants(
    { page: 0, size: 100 },
    {
      query: {
        // Disabled for now - these endpoints don't support viewing other tenants
        enabled: false,
      },
    }
  );

  const { data: documents, isLoading: documentsLoading, refetch: refetchDocuments } = useGetDocumentsByTenant(
    selectedSponsor?.id || '',
    {
      query: {
        enabled: !!selectedSponsor && reviewDialogOpen,
      },
    }
  );

  const generateUrlMutation = useGenerateUploadUrl({
    mutation: {
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to generate upload URL';
        toast.error(message);
        setUploading(false);
      },
    },
  });

  const confirmUploadMutation = useConfirmUpload1({
    mutation: {
      onSuccess: async () => {
        toast.success('Document uploaded successfully');
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setUploading(false);
        refetchDocuments();

        // Refetch onboarding states to update the UI
        if (tenantsData?.content) {
          const fetchOnboardingStates = async () => {
            const tenants = tenantsData.content;
            const tenantsWithStatesTemp: TenantWithState[] = [];

            if (tenants) {
              for (const tenant of tenants) {
                try {
                  const response = await customInstance<OnBoardingStateResponse>({
                    url: `/superadmin/tenants/${tenant.id}/onboarding-state`,
                    method: 'GET',
                  });
  
                  tenantsWithStatesTemp.push({
                    ...tenant,
                    onboardingState: response.currentState || 'COMPANY_BASIC_DETAILS',
                  });
                } catch (error) {
                  tenantsWithStatesTemp.push({
                    ...tenant,
                    onboardingState: 'COMPANY_BASIC_DETAILS',
                  });
                }
              }
            }

            setTenantsWithStates(tenantsWithStatesTemp);
          };

          await fetchOnboardingStates();
        }
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to confirm upload';
        toast.error(message);
        setUploading(false);
      },
    },
  });

  const notifySponsorMutation = useNotifySponsorDocumentsReadyByTenantId({
    mutation: {
      onSuccess: () => {
        toast.success('Sponsor notified successfully! They will receive an email to sign the documents.');
        setReviewDialogOpen(false); // Close the modal after successful notification
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to notify sponsor';
        toast.error(message);
      },
    },
  });

  const deleteDocumentMutation = useDeleteDocumentsByTenant({
    mutation: {
      onSuccess: () => {
        toast.success('Document deleted successfully');
        refetchDocuments();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to delete document';
        toast.error(message);
      },
    },
  });

  const filteredTenants = tenantsWithStates.filter((tenant) => {
    const matchesSearch =
      !search ||
      tenant.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      tenant.contactEmail?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;

    // Only show tenants at TRUSTEE or SIGN state (ready for document upload)
    const matchesOnboardingState = tenant.onboardingState && PENDING_DOCUMENT_STATES.includes(tenant.onboardingState);

    return matchesSearch && matchesStatus && matchesOnboardingState;
  });

  const handleViewSponsor = (tenant: any) => {
    setSelectedSponsor(tenant);
    setSelectedTenantId(tenant.id);
    setReviewDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check file size
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|xls|xlsx)$/i)) {
      toast.error('Please upload PDF, DOC, DOCX, XLS, or XLSX files only');
      return;
    }

    setSelectedFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0]) {
      validateAndSetFile(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedSponsor || !selectedSponsor.id) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);

    try {
      const uploadData = await generateUrlMutation.mutateAsync({
        data: {
          fileName: selectedFile.name,
          contentType: selectedFile.type || 'application/pdf',
          tenantId: selectedSponsor.id,
        },
      });

      const uploadUrl = uploadData.uploadUrl;
      const fileKey = uploadData.fileKey;

      if (!uploadUrl || !fileKey) {
        toast.error('Failed to generate upload URL');
        setUploading(false);
        return;
      }

      await axios.put(uploadUrl, selectedFile, {
        headers: {
          'Content-Type': selectedFile.type || 'application/pdf',
        },
      });

      await confirmUploadMutation.mutateAsync({
        data: {
          tenantId: selectedSponsor.id,
          fileKey,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
    }
  };

  const handleDelete = (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocumentMutation.mutate({ tenantId: documentId });
    }
  };

  const getOnboardingStateBadge = (state?: string, showStepNumber = false) => {
    if (!state) return null;
    const stateInfo = ONBOARDING_STATES[state as keyof typeof ONBOARDING_STATES];
    if (!stateInfo) return null;

    // Color coding based on progress
    const progress = stateInfo.order;
    let badgeClass = 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';

    if (progress <= 3) {
      badgeClass = 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
    } else if (progress <= 6) {
      badgeClass = 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    } else if (progress < 10) {
      badgeClass = 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
    } else {
      badgeClass = 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
    }

    return (
      <Badge variant="outline" className={`${badgeClass} font-medium whitespace-nowrap`}>
        {showStepNumber ? `${stateInfo.order}/10` : stateInfo.label}
      </Badge>
    );
  };

  return (
    <DashboardContent>
      <div className="space-y-6 w-full">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <IconFileText className="h-6 w-6" />
            Document Upload
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload required documents for sponsors pending onboarding completion
          </p>
        </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Pending Documents
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {filteredTenants.length}
                </p>
              </div>
              <IconFileText className="h-10 w-10 text-blue-600/50 dark:text-blue-400/50" />
            </div>
            <p className="text-xs text-blue-800 dark:text-blue-200 mt-2">
              Sponsors awaiting document upload
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  In Progress
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {tenantsWithStates.filter(t => PENDING_DOCUMENT_STATES.includes(t.onboardingState || '')).length}
                </p>
              </div>
              <IconLoader2 className="h-10 w-10 text-amber-600/50 dark:text-amber-400/50" />
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-200 mt-2">
              Total sponsors in onboarding
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Completed
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {tenantsWithStates.filter(t => t.onboardingState === 'DASHBOARD' || !PENDING_DOCUMENT_STATES.includes(t.onboardingState || '')).length}
                </p>
              </div>
              <IconShieldCheck className="h-10 w-10 text-green-600/50 dark:text-green-400/50" />
            </div>
            <p className="text-xs text-green-800 dark:text-green-200 mt-2">
              Fully onboarded sponsors
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sponsors Pending Document Upload</CardTitle>
          <CardDescription>
            Showing sponsors at or before trustee confirmation step. Click to review and upload documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tenantsLoading || loadingStates ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {loadingStates ? 'Loading onboarding states...' : 'Loading sponsors...'}
              </p>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconBuilding className="h-12 w-12 text-muted-foreground mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground mb-2">
                {search || statusFilter !== 'all'
                  ? 'No sponsors found matching your filters'
                  : 'No sponsors pending document upload'}
              </p>
              <p className="text-xs text-muted-foreground">
                Only sponsors who have completed onboarding up to trustee confirmation are shown here
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Company Name</TableHead>
                      <TableHead className="hidden md:table-cell min-w-[200px]">Contact Email</TableHead>
                      <TableHead className="min-w-[140px]">Progress</TableHead>
                      <TableHead className="text-center hidden lg:table-cell">Employees</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="hidden xl:table-cell">Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.map((tenant) => (
                      <TableRow
                        key={tenant.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewSponsor(tenant)}
                      >
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <IconBuilding className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium">{tenant.companyName}</span>
                            </div>
                            <div className="text-xs text-muted-foreground md:hidden">
                              {tenant.contactEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">{tenant.contactEmail}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            {getOnboardingStateBadge(tenant.onboardingState)}
                            <span className="text-xs text-muted-foreground font-medium">
                              Step {ONBOARDING_STATES[tenant.onboardingState as keyof typeof ONBOARDING_STATES]?.order || 1}/10
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center hidden lg:table-cell">
                          <span className="text-sm">{tenant.employeeCount || 'N/A'}</span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {getStatusBadge(tenant.status || 'PENDING')}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {tenant.createdAt
                              ? format(new Date(tenant.createdAt), 'MMM d, yyyy')
                              : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewSponsor(tenant);
                            }}
                            className="hover:bg-primary/10"
                          >
                            <IconEye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sponsor Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <IconBuilding className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{selectedSponsor?.companyName}</span>
              </div>
              {selectedSponsor?.onboardingState && getOnboardingStateBadge(selectedSponsor.onboardingState)}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Review sponsor onboarding details and upload required documents
            </DialogDescription>
            {selectedSponsor?.onboardingState && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <IconInfoCircle className="h-3 w-3 flex-shrink-0" />
                <span>
                  Onboarding Progress: Step {ONBOARDING_STATES[selectedSponsor.onboardingState as keyof typeof ONBOARDING_STATES]?.order || 1} of 10
                </span>
              </div>
            )}
          </DialogHeader>

          <Tabs defaultValue="company" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="company">
                <IconBuilding className="h-4 w-4 mr-2" />
                Company Info
              </TabsTrigger>
              <TabsTrigger value="plan">
                <IconSettings className="h-4 w-4 mr-2" />
                Plan Config
              </TabsTrigger>
              <TabsTrigger value="documents">
                <IconFileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
            </TabsList>

            {/* Company Info Tab */}
            <TabsContent value="company" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Company Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Company Name</Label>
                    <p className="font-medium">{selectedSponsor?.companyName || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Contact Email</Label>
                    <p className="font-medium">{selectedSponsor?.contactEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Contact Phone</Label>
                    <p className="font-medium">{selectedSponsor?.contactPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Employee Count</Label>
                    <p className="font-medium">{selectedSponsor?.employeeCount || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Address</Label>
                    <p className="font-medium">
                      {selectedSponsor?.address && selectedSponsor?.city && selectedSponsor?.state
                        ? `${selectedSponsor.address}, ${selectedSponsor.city}, ${selectedSponsor.state} ${selectedSponsor.zipCode}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedSponsor?.status || 'PENDING')}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Subscription Tier</Label>
                    <Badge variant="outline">{selectedSponsor?.subscriptionTier || 'N/A'}</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Plan Configuration Tab */}
            <TabsContent value="plan" className="space-y-4 mt-4">
              {loadingPlanDetails ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : !planDetails || planDetails.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">Plan Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <IconSettings className="h-12 w-12 text-muted-foreground mb-3 opacity-20" />
                      <p className="text-sm text-muted-foreground mb-2">
                        No plan configuration found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sponsor has not completed plan setup yet
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Onboarding Progress Card */}
                  {selectedSponsor?.onboardingState && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base md:text-lg">Onboarding Progress</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Current Step:</span>
                          {getOnboardingStateBadge(selectedSponsor.onboardingState)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">
                              {ONBOARDING_STATES[selectedSponsor.onboardingState as keyof typeof ONBOARDING_STATES]?.order || 0} of 10 steps
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2 transition-all"
                              style={{
                                width: `${((ONBOARDING_STATES[selectedSponsor.onboardingState as keyof typeof ONBOARDING_STATES]?.order || 0) / 10) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900 mt-4">
                          <div className="flex items-start gap-2">
                            <IconInfoCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                              <p className="font-medium mb-1">Next Steps</p>
                              <p className="text-xs">
                                {selectedSponsor.onboardingState === 'TRUSTEE'
                                  ? 'Upload required documents to proceed to document signing.'
                                  : selectedSponsor.onboardingState === 'SIGN'
                                  ? 'Documents are ready for signing.'
                                  : 'Sponsor is currently working through the onboarding process.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Plan Details Card - Show only the first/active plan */}
                  {planDetails && planDetails.length > 0 && planDetails[0] && (() => {
                    const plan = planDetails[0];
                    return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                          <IconSettings className="h-5 w-5" />
                          Plan Configuration
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Plan Type and Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Plan Type</Label>
                            <p className="font-medium">{plan.planTypeName || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Plan Name</Label>
                            <p className="font-medium">{plan.planName || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Plan Year</Label>
                            <p className="font-medium">{plan.planYear || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Effective Date</Label>
                            <p className="font-medium">
                              {plan.effectiveDate
                                ? format(new Date(plan.effectiveDate), 'MMM d, yyyy')
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Status</Label>
                            <Badge variant={plan.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {plan.status || 'DRAFT'}
                            </Badge>
                          </div>
                        </div>

                        {/* Eligibility Section */}
                        {plan.eligibility && (
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold mb-3">Eligibility Requirements</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">Minimum Entry Age</Label>
                                <p className="font-medium">
                                  {plan.eligibility.minimumEntryAge !== null
                                    ? `${plan.eligibility.minimumEntryAge} years`
                                    : 'No requirement'}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Service Requirement</Label>
                                <p className="font-medium">
                                  {plan.eligibility.timeEmployedMonths !== null
                                    ? `${plan.eligibility.timeEmployedMonths} months`
                                    : 'No requirement'}
                                </p>
                              </div>
                              {plan.eligibility.exclusions && plan.eligibility.exclusions.length > 0 && (
                                <div className="col-span-2">
                                  <Label className="text-xs text-muted-foreground">Exclusions</Label>
                                  <p className="font-medium">
                                    {plan.eligibility.exclusions.join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Employee Contribution Section */}
                        {plan.employeeContributionConfig && (
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold mb-3">Employee Contributions</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">Employee Contributions</Label>
                                <p className="font-medium">
                                  {plan.employeeContributionConfig.hasEmployeeContribution ? 'Enabled' : 'Disabled'}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Auto-Enrollment</Label>
                                <p className="font-medium">
                                  {plan.employeeContributionConfig.isAutoEnrollment ? 'Enabled' : 'Disabled'}
                                </p>
                              </div>
                              {plan.employeeContributionConfig.defaultContributionRate !== null && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Default Contribution Rate</Label>
                                  <p className="font-medium">{plan.employeeContributionConfig.defaultContributionRate}%</p>
                                </div>
                              )}
                              {plan.employeeContributionConfig.enrollmentMaxContributionRate !== null && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Max Contribution Rate</Label>
                                  <p className="font-medium">{plan.employeeContributionConfig.enrollmentMaxContributionRate}%</p>
                                </div>
                              )}
                              <div>
                                <Label className="text-xs text-muted-foreground">Roth Contributions</Label>
                                <p className="font-medium">
                                  {plan.employeeContributionConfig.supportsRoth ? 'Supported' : 'Not Supported'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Employer Contribution Section */}
                        {plan.employerContributionRule && (
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold mb-3">Employer Contributions</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {plan.employerContributionRule.ruleType && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Contribution Type</Label>
                                  <p className="font-medium">{plan.employerContributionRule.ruleType.replace(/_/g, ' ')}</p>
                                </div>
                              )}
                              {plan.employerContributionRule.matchPercentage !== null && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Match Percentage</Label>
                                  <p className="font-medium">{plan.employerContributionRule.matchPercentage}%</p>
                                </div>
                              )}
                              {plan.employerContributionRule.matchLimitPercent !== null && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Match Limit</Label>
                                  <p className="font-medium">{plan.employerContributionRule.matchLimitPercent}%</p>
                                </div>
                              )}
                              {plan.employerContributionRule.nonElectivePercent !== null && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Non-Elective Contribution</Label>
                                  <p className="font-medium">{plan.employerContributionRule.nonElectivePercent}%</p>
                                </div>
                              )}
                              {plan.employerContributionRule.basicMatchFirstPercent !== null && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Basic Match (First Tier)</Label>
                                  <p className="font-medium">
                                    {plan.employerContributionRule.basicMatchFirstRate}% on first {plan.employerContributionRule.basicMatchFirstPercent}%
                                  </p>
                                </div>
                              )}
                              {plan.employerContributionRule.basicMatchSecondPercent !== null && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Basic Match (Second Tier)</Label>
                                  <p className="font-medium">
                                    {plan.employerContributionRule.basicMatchSecondRate}% on next {plan.employerContributionRule.basicMatchSecondPercent}%
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Profit Sharing Section */}
                        {plan.profitSharingConfig && (
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold mb-3">Profit Sharing</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">Profit Sharing</Label>
                                <p className="font-medium">Configured</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    );
                  })()}
                </div>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4 mt-4">
              <div className="flex justify-end">
                <Button onClick={() => setUploadDialogOpen(true)} size="sm" className="sm:size-default">
                  <IconUpload className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Upload Document</span>
                  <span className="sm:hidden">Upload</span>
                </Button>
              </div>

              {documentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !documents || documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
                  <IconFileText className="h-12 w-12 text-muted-foreground mb-3 opacity-20" />
                  <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">File Name</TableHead>
                        <TableHead className="hidden md:table-cell">Size</TableHead>
                        <TableHead className="hidden lg:table-cell">Upload Date</TableHead>
                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc: any) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium text-sm">
                            <div className="flex items-center gap-2">
                              <IconFileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="break-all">{doc.fileName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {doc.fileSize
                              ? `${(doc.fileSize / 1024 / 1024).toFixed(2)} MB`
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">
                            {doc.createdAt
                              ? format(new Date(doc.createdAt), 'MMM d, yyyy')
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant={doc.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {doc.status || 'Uploaded'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Close
            </Button>
            {documents && documents.length > 0 && selectedSponsor && (
              <Button
                onClick={() => {
                  if (selectedSponsor?.id) {
                    notifySponsorMutation.mutate({ tenantId: selectedSponsor.id });
                  }
                }}
                disabled={notifySponsorMutation.isPending}
                className="gap-2"
              >
                {notifySponsorMutation.isPending ? (
                  <>
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                    Notifying...
                  </>
                ) : (
                  <>
                    <IconBell className="h-4 w-4" />
                    Notify Sponsor to Sign
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCloudUpload className="h-5 w-5" />
              Upload Document
            </DialogTitle>
            <DialogDescription>
              Upload a document for {selectedSponsor?.companyName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!selectedFile ? (
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
                  hover:border-primary/50 hover:bg-muted/50
                  ${isDragging
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-muted-foreground/25'
                  }
                `}
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xlsx,.xls"
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <div className={`
                      p-4 rounded-full transition-all
                      ${isDragging
                        ? 'bg-primary/10 text-primary scale-110'
                        : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      <IconCloudUpload className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {isDragging ? 'Drop file here' : 'Drag and drop your file here'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        or click to browse
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <IconFileText className="h-4 w-4" />
                      <span>PDF, DOC, DOCX, XLS, XLSX (Max 50MB)</span>
                    </div>
                  </div>
                </label>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <IconFileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm break-all line-clamp-2">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      {!uploading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="h-8 w-8 p-0 flex-shrink-0"
                        >
                          <IconX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {!uploading && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
                        <IconCheck className="h-3 w-3" />
                        <span>Ready to upload</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {uploading && (
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                <div className="flex items-center gap-3">
                  <IconLoader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Uploading document...
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                      Please wait while we process your file
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFile(null);
                setIsDragging(false);
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
              {uploading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <IconUpload className="mr-2 h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardContent>
  );
}
