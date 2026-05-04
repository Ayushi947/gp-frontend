'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconEye,
  IconDownload,
  IconUpload,
  IconLogin,
  IconLogout,
  IconCheck,
  IconX,
  IconSend,
  IconFileUpload,
  IconRefresh,
  IconHistory,
} from '@tabler/icons-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { activityService, type Activity, type ActivityAction } from '@/services/activity';
import { cn } from '@/lib/utils';

/**
 * Icon mapping for activity actions
 */
const actionIcons: Record<ActivityAction, typeof IconPlus> = {
  CREATE: IconPlus,
  UPDATE: IconPencil,
  DELETE: IconTrash,
  VIEW: IconEye,
  EXPORT: IconDownload,
  IMPORT: IconUpload,
  LOGIN: IconLogin,
  LOGOUT: IconLogout,
  APPROVE: IconCheck,
  REJECT: IconX,
  SUBMIT: IconSend,
  UPLOAD: IconFileUpload,
  DOWNLOAD: IconDownload,
  INVITE: IconSend,
  CHANGE: IconRefresh,
};

/**
 * Color mapping for activity actions
 */
const actionColors: Record<ActivityAction, string> = {
  CREATE: 'text-success bg-success/10',
  UPDATE: 'text-info bg-info/10',
  DELETE: 'text-error bg-error/10',
  VIEW: 'text-muted-foreground bg-muted',
  EXPORT: 'text-primary bg-primary/10',
  IMPORT: 'text-primary bg-primary/10',
  LOGIN: 'text-success bg-success/10',
  LOGOUT: 'text-muted-foreground bg-muted',
  APPROVE: 'text-success bg-success/10',
  REJECT: 'text-error bg-error/10',
  SUBMIT: 'text-info bg-info/10',
  UPLOAD: 'text-primary bg-primary/10',
  DOWNLOAD: 'text-primary bg-primary/10',
  INVITE: 'text-info bg-info/10',
  CHANGE: 'text-warning bg-warning/10',
};

interface ActivityItemProps {
  activity: Activity;
}

/**
 * Single activity item
 */
function ActivityItem({ activity }: ActivityItemProps) {
  const Icon = actionIcons[activity.action] || IconHistory;
  const colorClass = actionColors[activity.action] || 'text-muted-foreground bg-muted';

  return (
    <div className="flex items-start gap-3 py-3">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          colorClass
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1 min-w-0">
        <p className="text-sm leading-tight">{activity.description}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
          </span>
          {activity.userName && (
            <>
              <span>by</span>
              <span className="font-medium">{activity.userName}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface ActivityFeedProps {
  /**
   * Number of activities to show
   */
  limit?: number;

  /**
   * Maximum height for scroll area
   */
  maxHeight?: number;

  /**
   * Show title card wrapper
   */
  showCard?: boolean;

  /**
   * Card title
   */
  title?: string;

  /**
   * Card description
   */
  description?: string;

  /**
   * Refresh interval in milliseconds
   */
  refreshInterval?: number;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show view all link
   */
  onViewAll?: () => void;
}

/**
 * Activity feed component
 * Displays recent user activities with auto-refresh
 */
export function ActivityFeed({
  limit = 10,
  maxHeight = 400,
  showCard = true,
  title = 'Recent Activity',
  description,
  refreshInterval = 30000,
  className,
  onViewAll,
}: ActivityFeedProps) {
  const {
    data: activities,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['activities', limit],
    queryFn: () => activityService.getRecent(limit),
    refetchInterval: refreshInterval,
  });

  const content = isLoading ? (
    <ListSkeleton items={5} showAvatar />
  ) : error ? (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <IconHistory className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground mb-2">Unable to load activities</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>
        <IconRefresh className="mr-2 h-4 w-4" />
        Retry
      </Button>
    </div>
  ) : !activities || activities.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <IconHistory className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">No recent activity</p>
    </div>
  ) : (
    <ScrollArea className="pr-4" style={{ maxHeight }}>
      <div className="divide-y">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </ScrollArea>
  );

  if (!showCard) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
          </Button>
        )}
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

/**
 * Compact activity feed for sidebars
 */
export function CompactActivityFeed({
  limit = 5,
  className,
}: {
  limit?: number;
  className?: string;
}) {
  return (
    <ActivityFeed
      limit={limit}
      showCard={false}
      maxHeight={250}
      className={className}
    />
  );
}
