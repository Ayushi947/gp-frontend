'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  IconBell,
  IconBellOff,
  IconCheck,
  IconCheckbox,
  IconMail,
  IconMailOpened,
  IconSettings,
  IconAlertCircle,
  IconCash,
  IconChartBar,
  IconFileText,
  IconUserPlus,
  IconRefresh,
  IconBriefcase,
  IconReceipt,
  IconScale,
} from '@tabler/icons-react';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import {
  useGetAllNotifications,
  useGetNotificationCounts,
  useGetNotificationSettings,
  useMarkAsRead,
  useMarkAllAsRead,
  useUpdateNotificationSettings,
  getGetAllNotificationsQueryKey,
  getGetNotificationCountsQueryKey,
} from '@/api/generated/endpoints/notifications/notifications';
import { NotificationDTO, NotificationDTOType, NotificationDTOStatus } from '@/api/generated/models';

// Map notification types to icons and colors
const notificationTypeConfig: Record<string, { icon: React.ElementType; color: string; category: string }> = {
  CONTRIBUTION_POSTED: { icon: IconCash, color: 'text-green-500', category: 'Contributions' },
  CONTRIBUTION_RATE_CHANGED: { icon: IconCash, color: 'text-blue-500', category: 'Contributions' },
  INVESTMENT_UPDATED: { icon: IconChartBar, color: 'text-purple-500', category: 'Investments' },
  STATEMENT_READY: { icon: IconFileText, color: 'text-blue-500', category: 'Documents' },
  ACCOUNT_BALANCE_UPDATE: { icon: IconChartBar, color: 'text-green-500', category: 'Account' },
  WITHDRAWAL_LOAN_STATUS: { icon: IconBriefcase, color: 'text-orange-500', category: 'Withdrawals' },
  TAX_FORM_AVAILABLE: { icon: IconFileText, color: 'text-blue-500', category: 'Documents' },
  RMD_REQUIRED: { icon: IconAlertCircle, color: 'text-red-500', category: 'Compliance' },
  ROLLOVER_RECEIVED: { icon: IconRefresh, color: 'text-green-500', category: 'Rollovers' },
  PAYROLL_ERRORS_DETECTED: { icon: IconAlertCircle, color: 'text-red-500', category: 'Payroll' },
  MISSING_PAYROLL_ALERT: { icon: IconAlertCircle, color: 'text-yellow-500', category: 'Payroll' },
  PARTICIPANT_ENROLLED: { icon: IconUserPlus, color: 'text-green-500', category: 'Participants' },
  CONTRIBUTION_REVIEW: { icon: IconCash, color: 'text-blue-500', category: 'Contributions' },
  DISTRIBUTION_LOAN_APPROVAL: { icon: IconBriefcase, color: 'text-purple-500', category: 'Distributions' },
  WITHDRAWAL_PENDING_APPROVAL: { icon: IconBriefcase, color: 'text-yellow-500', category: 'Withdrawals' },
  COMPLIANCE_TESTING_STARTED: { icon: IconScale, color: 'text-blue-500', category: 'Compliance' },
  COMPLIANCE_TESTING_RESULTS: { icon: IconScale, color: 'text-green-500', category: 'Compliance' },
  CORRECTIVE_ACTION: { icon: IconAlertCircle, color: 'text-red-500', category: 'Compliance' },
  FORM_5500_READY: { icon: IconFileText, color: 'text-blue-500', category: 'Documents' },
  ROLLOVER_PENDING: { icon: IconRefresh, color: 'text-yellow-500', category: 'Rollovers' },
  INVOICE_ISSUED: { icon: IconReceipt, color: 'text-blue-500', category: 'Billing' },
  EMPLOYER_MATCH_ADDED: { icon: IconCash, color: 'text-green-500', category: 'Contributions' },
  BENEFICIARY_UPDATED: { icon: IconUserPlus, color: 'text-blue-500', category: 'Account' },
  WITHDRAWAL_REQUESTED: { icon: IconBriefcase, color: 'text-yellow-500', category: 'Withdrawals' },
  WITHDRAWAL_PROCESSED: { icon: IconBriefcase, color: 'text-green-500', category: 'Withdrawals' },
  LOAN_REQUESTED: { icon: IconBriefcase, color: 'text-yellow-500', category: 'Loans' },
  LOAN_APPROVED: { icon: IconBriefcase, color: 'text-green-500', category: 'Loans' },
  ROLLOVER_OUT_INITIATED: { icon: IconRefresh, color: 'text-yellow-500', category: 'Rollovers' },
  ACCOUNT_REBALANCED: { icon: IconChartBar, color: 'text-purple-500', category: 'Investments' },
  FEE_DEDUCTION: { icon: IconReceipt, color: 'text-gray-500', category: 'Billing' },
  INVESTMENT_PERFORMANCE_UPDATE: { icon: IconChartBar, color: 'text-blue-500', category: 'Investments' },
  MARKET_VOLATILITY_ALERT: { icon: IconAlertCircle, color: 'text-red-500', category: 'Investments' },
  PAYROLL_UPLOADED: { icon: IconCash, color: 'text-green-500', category: 'Payroll' },
  PAYROLL_CONTRIBUTIONS_COMPLETED: { icon: IconCash, color: 'text-green-500', category: 'Payroll' },
  PARTICIPANT_AUTO_ENROLLMENT_COMPLETED: { icon: IconUserPlus, color: 'text-green-500', category: 'Participants' },
  EMPLOYER_MATCH_POSTED: { icon: IconCash, color: 'text-green-500', category: 'Contributions' },
  PLAN_DOCUMENT_UPDATED: { icon: IconFileText, color: 'text-blue-500', category: 'Documents' },
  INVESTMENT_LINEUP_CHANGES_POSTED: { icon: IconChartBar, color: 'text-purple-500', category: 'Investments' },
  ADVISOR_TPA_COMMENT_ADDED: { icon: IconMailOpened, color: 'text-blue-500', category: 'Communication' },
  IRS_UPDATE: { icon: IconScale, color: 'text-blue-500', category: 'Compliance' },
  SYSTEM: { icon: IconBell, color: 'text-gray-500', category: 'System' },
  TASK: { icon: IconCheckbox, color: 'text-blue-500', category: 'Tasks' },
};

function getNotificationConfig(type?: NotificationDTOType) {
  if (!type) return { icon: IconBell, color: 'text-gray-500', category: 'General' };
  return notificationTypeConfig[type] || { icon: IconBell, color: 'text-gray-500', category: 'General' };
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pageSize = 20;

  // Fetch notifications
  const { data: notificationsData, isLoading: isLoadingNotifications } = useGetAllNotifications({
    page,
    size: pageSize,
    status: statusFilter === 'all' ? undefined : statusFilter.toUpperCase() as 'READ' | 'UNREAD',
  });

  // Fetch counts
  const { data: counts, isLoading: isLoadingCounts } = useGetNotificationCounts();

  // Fetch settings
  const { data: settings, isLoading: isLoadingSettings } = useGetNotificationSettings();

  // Mutations
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const updateSettingsMutation = useUpdateNotificationSettings();

  const notifications = notificationsData?.content ?? [];
  const totalPages = notificationsData?.totalPages ?? 0;
  const totalNotifications = counts?.total ?? 0;
  const unreadCount = counts?.unread ?? 0;
  const readCount = counts?.read ?? 0;

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsReadMutation.mutateAsync({ id });
      await queryClient.invalidateQueries({ queryKey: getGetAllNotificationsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetNotificationCountsQueryKey() });
    } catch {
      toast.error('Error', 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: getGetAllNotificationsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetNotificationCountsQueryKey() });
      toast.success('Done', 'All notifications marked as read');
    } catch {
      toast.error('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleUpdateSettings = async (emailEnabled: boolean, pushEnabled: boolean) => {
    try {
      await updateSettingsMutation.mutateAsync({
        data: { emailEnabled, pushEnabled },
      });
      toast.success('Settings saved', 'Your notification preferences have been updated');
      setSettingsOpen(false);
    } catch {
      toast.error('Error', 'Failed to save notification settings');
    }
  };

  const NotificationItem = ({ notification }: { notification: NotificationDTO }) => {
    const config = getNotificationConfig(notification.type);
    const Icon = config.icon;
    const isUnread = notification.status === NotificationDTOStatus.UNREAD;

    return (
      <div
        className={cn(
          'flex items-start gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/50',
          isUnread && 'bg-primary/5 border-primary/20'
        )}
      >
        <div className={cn('p-2 rounded-full bg-muted', config.color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className={cn('font-medium text-sm', isUnread && 'font-semibold')}>
                  {notification.title}
                </h4>
                {isUnread && (
                  <Badge variant="default" className="text-xs px-1.5 py-0">
                    New
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {notification.message}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {config.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {notification.timeAgo}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notification.ctaUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={notification.ctaUrl}>View</a>
                </Button>
              )}
              {isUnread && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => notification.id && handleMarkAsRead(notification.id)}
                  disabled={markAsReadMutation.isPending}
                >
                  <IconCheck className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardContent>
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your account activity and alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <IconCheckbox className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <IconSettings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Notification Settings</DialogTitle>
                <DialogDescription>
                  Choose how you want to receive notifications
                </DialogDescription>
              </DialogHeader>
              {isLoadingSettings ? (
                <div className="space-y-4 py-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconMail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-xs text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={settings?.emailEnabled ?? true}
                      onCheckedChange={(checked) =>
                        handleUpdateSettings(checked, settings?.pushEnabled ?? false)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconBell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <p className="text-xs text-muted-foreground">
                          Receive push notifications in browser
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={settings?.pushEnabled ?? false}
                      onCheckedChange={(checked) =>
                        handleUpdateSettings(settings?.emailEnabled ?? true, checked)
                      }
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCounts ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="flex items-center gap-2">
                  <IconBell className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{totalNotifications}</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unread</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCounts ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="flex items-center gap-2">
                  <IconMail className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold text-primary">{unreadCount}</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Read</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCounts ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="flex items-center gap-2">
                  <IconMailOpened className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{readCount}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value as typeof statusFilter);
          setPage(0);
        }}>
          <TabsList>
            <TabsTrigger value="all">
              All
              {totalNotifications > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalNotifications}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge variant="default" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read">
              Read
              {readCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {readCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {statusFilter === 'all' ? 'All Notifications' :
               statusFilter === 'unread' ? 'Unread Notifications' : 'Read Notifications'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingNotifications ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <IconBellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-lg">No notifications</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {statusFilter === 'unread'
                    ? "You're all caught up! No unread notifications."
                    : statusFilter === 'read'
                    ? "No read notifications yet."
                    : "You don't have any notifications yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardContent>
  );
}
