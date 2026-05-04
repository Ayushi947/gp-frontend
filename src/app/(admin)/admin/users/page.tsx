'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IconUsers,
  IconAlertTriangle,
  IconRefresh,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconX,
  IconLock,
  IconLockOpen,
  IconLoader2,
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
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

/**
 * Tenant User DTO - matches backend TenantUserDTO
 */
interface TenantUserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string;
  emailVerified: boolean;
  accountLocked: boolean;
  createdAt: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Custom hook to get tenant users
 */
function useTenantUsers(page: number, size: number) {
  return useQuery({
    queryKey: ['tenantUsers', page, size],
    queryFn: async () => {
      const response = await apiClient.get<PageResponse<TenantUserDTO>>('/users', {
        params: { page, size },
      });
      return response.data;
    },
  });
}

/**
 * Custom hook to update user role
 */
function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiClient.put<TenantUserDTO>(`/users/${userId}/role`, { role });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantUsers'] });
      toast.success('User role updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });
}

/**
 * Custom hook to lock/unlock user
 */
function useToggleUserLock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, locked }: { userId: string; locked: boolean }) => {
      const response = await apiClient.put<TenantUserDTO>(`/users/${userId}/lock`, { locked });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenantUsers'] });
      toast.success(`User ${variables.locked ? 'locked' : 'unlocked'} successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update account status: ${error.message}`);
    },
  });
}

/**
 * Page Header Component
 */
function PageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organization Users</h1>
        <p className="text-muted-foreground">
          View and manage users within your organization
        </p>
      </div>
    </div>
  );
}

/**
 * User Role Badge
 */
function RoleBadge({ roles }: { roles: string | undefined }) {
  if (!roles) return null;

  const roleList = roles.split(',').map((r) => r.trim());
  const primaryRole = roleList[0]?.toLowerCase() ?? '';

  const badgeConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    admin: { variant: 'default', label: 'Admin' },
    sponsor: { variant: 'secondary', label: 'Sponsor' },
    participant: { variant: 'outline', label: 'Participant' },
    user: { variant: 'outline', label: 'User' },
  };

  const config = badgeConfig[primaryRole] ?? { variant: 'outline' as const, label: roles };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * Role Update Dialog
 */
function RoleUpdateDialog({
  user,
  open,
  onOpenChange,
  onUpdate,
  isLoading,
}: {
  user: TenantUserDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (role: string) => void;
  isLoading: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState(user?.roles || 'USER');

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update User Role</DialogTitle>
          <DialogDescription>
            Change the role for {user.firstName} {user.lastName} ({user.email})
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="SPONSOR">Sponsor</SelectItem>
              <SelectItem value="PARTICIPANT">Participant</SelectItem>
              <SelectItem value="USER">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onUpdate(selectedRole)} disabled={isLoading}>
            {isLoading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Users Table Component
 */
function UsersTable({
  users,
  isLoading,
  onEditRole,
  onToggleLock,
  isUpdating,
}: {
  users: TenantUserDTO[];
  isLoading: boolean;
  onEditRole: (user: TenantUserDTO) => void;
  onToggleLock: (user: TenantUserDTO) => void;
  isUpdating: boolean;
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

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <IconUsers className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
        <p className="text-muted-foreground text-center">
          No users match your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-4 font-medium text-muted-foreground">User</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
            <th className="text-center p-4 font-medium text-muted-foreground">Email Verified</th>
            <th className="text-center p-4 font-medium text-muted-foreground">Account Status</th>
            <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b hover:bg-muted/50">
              <td className="p-4">
                <div>
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </td>
              <td className="p-4">
                <RoleBadge roles={user.roles} />
              </td>
              <td className="p-4 text-center">
                {user.emailVerified ? (
                  <IconCheck className="h-5 w-5 text-green-600 mx-auto" />
                ) : (
                  <IconX className="h-5 w-5 text-muted-foreground mx-auto" />
                )}
              </td>
              <td className="p-4 text-center">
                {user.accountLocked ? (
                  <Badge
                    variant="outline"
                    className="gap-1 bg-red-100 text-red-800 border-red-200"
                  >
                    <IconLock className="h-3 w-3" />
                    Locked
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800 border-green-200"
                  >
                    Active
                  </Badge>
                )}
              </td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditRole(user)}
                    disabled={isUpdating}
                  >
                    Edit Role
                  </Button>
                  <Button
                    variant={user.accountLocked ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleLock(user)}
                    disabled={isUpdating}
                  >
                    {user.accountLocked ? (
                      <>
                        <IconLockOpen className="h-4 w-4 mr-1" />
                        Unlock
                      </>
                    ) : (
                      <>
                        <IconLock className="h-4 w-4 mr-1" />
                        Lock
                      </>
                    )}
                  </Button>
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
 * Users Page - Shows users within current tenant/organization
 */
export default function UsersPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<TenantUserDTO | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useTenantUsers(page, pageSize);

  const updateRoleMutation = useUpdateUserRole();
  const toggleLockMutation = useToggleUserLock();

  const users = usersData?.content ?? [];
  const totalElements = usersData?.totalElements ?? 0;
  const totalPages = usersData?.totalPages ?? 0;

  // Filter users by search (client-side for now)
  const filteredUsers = search
    ? users.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(search.toLowerCase()) ||
          user.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const handleEditRole = (user: TenantUserDTO) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const handleUpdateRole = (role: string) => {
    if (selectedUser) {
      updateRoleMutation.mutate(
        { userId: selectedUser.id, role },
        {
          onSuccess: () => {
            setRoleDialogOpen(false);
            setSelectedUser(null);
          },
        }
      );
    }
  };

  const handleToggleLock = (user: TenantUserDTO) => {
    toggleLockMutation.mutate({
      userId: user.id,
      locked: !user.accountLocked,
    });
  };

  if (error) {
    return (
      <DashboardContent>
        <PageHeader />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconAlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Users</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was an error loading the user list.
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

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative flex-1 max-w-md">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Organization Users</CardTitle>
          <CardDescription>
            {totalElements} user{totalElements !== 1 ? 's' : ''} in your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <UsersTable
            users={filteredUsers}
            isLoading={isLoading}
            onEditRole={handleEditRole}
            onToggleLock={handleToggleLock}
            isUpdating={updateRoleMutation.isPending || toggleLockMutation.isPending}
          />
          {!isLoading && filteredUsers.length > 0 && (
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

      {/* Role Update Dialog */}
      <RoleUpdateDialog
        user={selectedUser}
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        onUpdate={handleUpdateRole}
        isLoading={updateRoleMutation.isPending}
      />
    </DashboardContent>
  );
}
