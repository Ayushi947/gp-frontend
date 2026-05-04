'use client';

import { useState } from 'react';
import {
  IconSettings,
  IconAlertTriangle,
  IconRefresh,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconLock,
  IconFilter,
  IconCheck,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import {
  useGetConfigurations,
  useUpdateConfiguration,
} from '@/api/generated/endpoints/platform-configuration/platform-configuration';
import type { PlatformConfigDTO, UpdateConfigurationBody } from '@/api/generated/models';
import { GetConfigurationsCategory } from '@/api/generated/models';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Page Header Component
 */
function PageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">
          Manage platform configuration and settings
        </p>
      </div>
    </div>
  );
}

/**
 * Category Badge
 */
function CategoryBadge({ category }: { category: string | undefined }) {
  if (!category) return null;

  const categoryLower = category.toLowerCase();

  const badgeConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    system: { variant: 'default', label: 'System' },
    security: { variant: 'destructive', label: 'Security' },
    integration: { variant: 'secondary', label: 'Integration' },
    email: { variant: 'outline', label: 'Email' },
    feature: { variant: 'outline', label: 'Feature' },
    limit: { variant: 'secondary', label: 'Limit' },
  };

  const config = badgeConfig[categoryLower] ?? { variant: 'outline' as const, label: category };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * Config Table Component
 */
function ConfigTable({
  configs,
  isLoading,
  onEdit,
}: {
  configs: PlatformConfigDTO[];
  isLoading: boolean;
  onEdit: (config: PlatformConfigDTO) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="flex-1 h-4" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <IconSettings className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Configurations Found</h3>
        <p className="text-muted-foreground text-center">
          No configurations match your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-4 font-medium text-muted-foreground">Key</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Value</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Updated</th>
            <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {configs.map((config) => (
            <tr key={config.id} className="border-b hover:bg-muted/50">
              <td className="p-4">
                <div>
                  <p className="font-medium font-mono text-sm">{config.configKey ?? '-'}</p>
                  {config.description && (
                    <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
                  )}
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  {config.isSecret ? (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <IconLock className="h-3 w-3" />
                      [Protected]
                    </span>
                  ) : (
                    <span className="font-mono text-sm truncate max-w-[200px]">
                      {config.configValue ?? '-'}
                    </span>
                  )}
                </div>
              </td>
              <td className="p-4">
                <CategoryBadge category={config.category} />
              </td>
              <td className="p-4">
                <div>
                  <p className="text-sm">
                    {config.updatedAt
                      ? format(new Date(config.updatedAt), 'MMM d, yyyy')
                      : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">{config.updatedBy ?? '-'}</p>
                </div>
              </td>
              <td className="p-4 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(config)}
                  title="Edit"
                >
                  <IconEdit className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Edit Config Dialog
 */
function EditConfigDialog({
  config,
  open,
  onOpenChange,
}: {
  config: PlatformConfigDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateConfiguration();
  const [value, setValue] = useState('');

  const handleOpen = () => {
    if (config && !config.isSecret) {
      setValue(config.configValue ?? '');
    } else {
      setValue('');
    }
  };

  const handleSave = () => {
    if (!config?.configKey) return;

    const body: UpdateConfigurationBody = {
      value,
    };

    updateMutation.mutate(
      { key: config.configKey, data: body },
      {
        onSuccess: () => {
          toast.success('Configuration Updated', 'The configuration has been saved successfully.');
          queryClient.invalidateQueries({ queryKey: ['/superadmin/config'] });
          onOpenChange(false);
        },
        onError: () => {
          toast.error('Error', 'Failed to update configuration. Please try again.');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={handleOpen}>
        <DialogHeader>
          <DialogTitle>Edit Configuration</DialogTitle>
          <DialogDescription>
            Update the value for {config?.configKey}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Configuration Key</Label>
            <Input value={config?.configKey ?? ''} disabled className="font-mono" />
          </div>
          {config?.description && (
            <div className="space-y-2">
              <Label>Description</Label>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="configValue">Value</Label>
            {config?.isSecret && (
              <p className="text-xs text-muted-foreground">
                Enter a new value to replace the existing secret
              </p>
            )}
            <Textarea
              id="configValue"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={config?.isSecret ? 'Enter new secret value...' : 'Enter value...'}
              className="font-mono"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
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
 * Platform Settings Page
 */
export default function PlatformSettingsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editConfig, setEditConfig] = useState<PlatformConfigDTO | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const categoryParam = categoryFilter !== 'all'
    ? (categoryFilter as GetConfigurationsCategory)
    : undefined;

  const {
    data: configsData,
    isLoading,
    error,
    refetch,
  } = useGetConfigurations({
    pageable: {
      page,
      size: pageSize,
    },
    category: categoryParam,
  });

  const configs = (configsData?.content ?? []) as PlatformConfigDTO[];
  const totalElements = configsData?.totalElements ?? 0;
  const totalPages = configsData?.totalPages ?? 0;

  const handleEdit = (config: PlatformConfigDTO) => {
    setEditConfig(config);
    setEditDialogOpen(true);
  };

  if (error) {
    return (
      <DashboardContent>
        <PageHeader />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconAlertTriangle className="h-12 w-12 text-error mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Configurations</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was an error loading the platform configurations.
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search configurations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <IconFilter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
                <SelectItem value="SECURITY">Security</SelectItem>
                <SelectItem value="INTEGRATION">Integration</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="FEATURE">Feature</SelectItem>
                <SelectItem value="LIMIT">Limit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Config Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platform Configurations</CardTitle>
          <CardDescription>
            {totalElements} configuration{totalElements !== 1 ? 's' : ''} total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ConfigTable configs={configs} isLoading={isLoading} onEdit={handleEdit} />
          {!isLoading && configs.length > 0 && (
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

      {/* Edit Dialog */}
      <EditConfigDialog
        config={editConfig}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </DashboardContent>
  );
}
