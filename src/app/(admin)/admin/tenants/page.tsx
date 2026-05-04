'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconBuildingBank,
  IconAlertTriangle,
  IconRefresh,
  IconPlus,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconTrash,
  IconPlayerPause,
  IconPlayerPlay,
  IconEye,
  IconBan,
  IconCircleCheck,
  IconBuilding,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import {
  useGetAllTenants,
  useCreateTenant,
  useSuspendTenant,
  useActivateTenant,
  useDeleteTenant,
} from '@/api/generated/endpoints/tenant-management/tenant-management';
import type { TenantManagementDTO, CreateTenantRequest } from '@/api/generated/models';
import { CreateTenantRequestSubscriptionTier } from '@/api/generated/models';
import { toast } from '@/lib/toast';
import { formatEnum } from '@/lib/utils';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Page Header Component
 */
function PageHeader({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
        <p className="text-muted-foreground">
          Manage platform tenants and subscriptions
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onCreateNew}>
          <IconPlus className="mr-2 h-4 w-4" />
          New Tenant
        </Button>
      </div>
    </div>
  );
}

/**
 * Tenant Status Badge
 *
 * Uses colored chips consistent with sponsor tables:
 * - Active  → green
 * - Pending → yellow
 * - Suspended → red
 * - Trial  → blue
 */
function TenantStatusBadge({ status }: { status: string | undefined }) {
  if (!status) return null;

  const statusUpper = status.toUpperCase();

  const badgeConfig: Record<string, { className: string }> = {
    ACTIVE: { className: 'bg-green-100 text-green-800 border-green-200' },
    PENDING: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    SUSPENDED: { className: 'bg-red-100 text-red-800 border-red-200' },
    TRIAL: { className: 'bg-blue-100 text-blue-800 border-blue-200' },
  };

  const className =
    badgeConfig[statusUpper]?.className ??
    'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <Badge variant="outline" className={className}>
      {formatEnum(status)}
    </Badge>
  );
}

/**
 * Subscription Tier Badge
 */
function SubscriptionBadge({ tier }: { tier: string | undefined }) {
  if (!tier) return null;

  const tierLower = tier.toLowerCase();

  const badgeConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    enterprise: { variant: 'default', label: 'Enterprise' },
    professional: { variant: 'secondary', label: 'Professional' },
    starter: { variant: 'outline', label: 'Starter' },
    free: { variant: 'outline', label: 'Free' },
  };

  const config = badgeConfig[tierLower] ?? { variant: 'outline' as const, label: formatEnum(tier) };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * Tenants Table Component
 */
function TenantsTable({
  tenants,
  isLoading,
  onSuspend,
  onActivate,
  onDelete,
}: {
  tenants: TenantManagementDTO[];
  isLoading: boolean;
  onSuspend: (id: string) => void;
  onActivate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="flex-1 h-4" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <IconBuildingBank className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Tenants Found</h3>
        <p className="text-muted-foreground text-center">
          No tenants match your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px]">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-4 font-medium text-muted-foreground">Company</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Contact</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Tier</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Employees</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Participants</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Created</th>
            <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr
              key={tenant.id}
              className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => tenant.id && router.push(`/admin/tenants/${tenant.id}`)}
            >
              <td className="p-4 font-medium">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    tenant.id && router.push(`/admin/tenants/${tenant.id}`);
                  }}
                  className="text-primary hover:underline font-semibold"
                >
                  {tenant.companyName ?? 'Unknown'}
                </button>
              </td>
              <td className="p-4">
                <div className="text-sm">
                  <div>{tenant.contactEmail ?? '-'}</div>
                  {tenant.contactPhone && (
                    <div className="text-muted-foreground">{tenant.contactPhone}</div>
                  )}
                </div>
              </td>
              <td className="p-4">
                <TenantStatusBadge status={tenant.status} />
              </td>
              <td className="p-4">
                <SubscriptionBadge tier={tenant.subscriptionTier} />
              </td>
              <td className="p-4">
                {tenant.employeeCount ?? 'N/A'}
              </td>
              <td className="p-4">
                {tenant.participantCount?.toLocaleString() ?? 0}
              </td>
              <td className="p-4 text-sm">
                {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'N/A'}
              </td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => tenant.id && router.push(`/admin/tenants/${tenant.id}`)}
                    className="border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <IconEye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  {tenant.status === 'ACTIVE' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => tenant.id && onSuspend(tenant.id)}
                      className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      <IconBan className="h-3 w-3 mr-1" />
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => tenant.id && onActivate(tenant.id)}
                      className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                    >
                      <IconCircleCheck className="h-3 w-3 mr-1" />
                      Activate
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Create Tenant Dialog
 */
function CreateTenantDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const createMutation = useCreateTenant();

  const [formData, setFormData] = useState<CreateTenantRequest>({
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    subscriptionTier: CreateTenantRequestSubscriptionTier.BASIC,
    employeeCount: 1,
  });

  const handleSubmit = () => {
    if (!formData.companyName || !formData.contactEmail) {
      toast.error('Validation Error', 'Company name and contact email are required.');
      return;
    }

    createMutation.mutate(
      { data: formData },
      {
        onSuccess: () => {
          toast.success('Tenant Created', 'The new tenant has been created successfully.');
          queryClient.invalidateQueries({ queryKey: ['/superadmin/tenants'] });
          onOpenChange(false);
          setFormData({
            companyName: '',
            contactEmail: '',
            contactPhone: '',
            subscriptionTier: CreateTenantRequestSubscriptionTier.BASIC,
            employeeCount: 1,
          });
        },
        onError: () => {
          toast.error('Error', 'Failed to create tenant. Please try again.');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Tenant</DialogTitle>
          <DialogDescription>
            Add a new organization to the platform.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={formData.companyName ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              placeholder="Enter company name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, contactEmail: e.target.value })
              }
              placeholder="admin@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input
              id="contactPhone"
              value={formData.contactPhone ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, contactPhone: e.target.value })
              }
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subscriptionTier">Subscription Tier</Label>
            <Select
              value={formData.subscriptionTier ?? CreateTenantRequestSubscriptionTier.BASIC}
              onValueChange={(value) =>
                setFormData({ ...formData, subscriptionTier: value as CreateTenantRequestSubscriptionTier })
              }
            >
              <SelectTrigger id="subscriptionTier">
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="BASIC">Basic</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Tenant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
 * Tenants Page
 */
export default function TenantsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const suspendMutation = useSuspendTenant();
  const activateMutation = useActivateTenant();
  const deleteMutation = useDeleteTenant();

  const {
    data: tenantsData,
    isLoading,
    error,
    refetch,
  } = useGetAllTenants(
    {
      pageable: {
        page,
        size: pageSize,
      },
    },
    {
      query: {
        staleTime: 0,
        refetchOnMount: true,
      },
    }
  );

  const tenants = (tenantsData?.content ?? []) as TenantManagementDTO[];
  const totalElements = tenantsData?.totalElements ?? 0;
  const totalPages = tenantsData?.totalPages ?? 0;

  const handleSuspend = (id: string) => {
    setSelectedTenantId(id);
    setSuspendDialogOpen(true);
  };

  const onSuspendTenant = async () => {
    if (!selectedTenantId || !suspendReason.trim()) {
      toast.error('Validation Error', 'Please provide a reason for suspension');
      return;
    }

    suspendMutation.mutate(
      { id: selectedTenantId, data: { reason: suspendReason } },
      {
        onSuccess: () => {
          toast.success('Tenant Suspended', 'The tenant has been suspended.');
          queryClient.invalidateQueries({ queryKey: ['/superadmin/tenants'] });
          setSuspendDialogOpen(false);
          setSelectedTenantId(null);
          setSuspendReason('');
        },
        onError: () => {
          toast.error('Error', 'Failed to suspend tenant.');
        },
      }
    );
  };

  const handleActivate = (id: string) => {
    activateMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success('Tenant Activated', 'The tenant has been activated.');
          queryClient.invalidateQueries({ queryKey: ['/superadmin/tenants'] });
        },
        onError: () => {
          toast.error('Error', 'Failed to activate tenant.');
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      return;
    }

    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success('Tenant Deleted', 'The tenant has been deleted.');
          queryClient.invalidateQueries({ queryKey: ['/superadmin/tenants'] });
        },
        onError: () => {
          toast.error('Error', 'Failed to delete tenant.');
        },
      }
    );
  };

  if (error) {
    return (
      <DashboardContent>
        <PageHeader onCreateNew={() => setCreateDialogOpen(true)} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconAlertTriangle className="h-12 w-12 text-error mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Tenants</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was an error loading the tenant list.
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
      <PageHeader onCreateNew={() => setCreateDialogOpen(true)} />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <IconBuilding className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 bg-muted rounded animate-pulse" />
            ) : (
              <div className="text-2xl font-bold">{totalElements}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-96">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="TRIAL">Trial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tenants Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">All Tenants</h2>
          <p className="text-sm text-muted-foreground">
            {totalElements} tenant{totalElements !== 1 ? 's' : ''} total
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <TenantsTable
              tenants={tenants}
              isLoading={isLoading}
              onSuspend={handleSuspend}
              onActivate={handleActivate}
              onDelete={handleDelete}
            />
            {!isLoading && tenants.length > 0 && (
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

      {/* Create Tenant Dialog */}
      <CreateTenantDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Suspend Tenant Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Tenant</DialogTitle>
            <DialogDescription>
              Please provide a reason for suspending this tenant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suspendReason">Reason for Suspension</Label>
              <Textarea
                id="suspendReason"
                placeholder="Provide a detailed reason..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspendDialogOpen(false);
                setSelectedTenantId(null);
                setSuspendReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onSuspendTenant}
              disabled={!suspendReason.trim() || suspendMutation.isPending}
              loading={suspendMutation.isPending}
            >
              Suspend Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardContent>
  );
}
