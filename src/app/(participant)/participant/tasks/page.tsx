'use client';

import { useState } from 'react';
import {
  IconChecklist,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconFilter,
  IconRefresh,
  IconLoader2,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { formatDate, formatEnum, cn } from '@/lib/utils';
import { useGetTasksAndActivities } from '@/api/generated/endpoints/combined-tasks-activities/combined-tasks-activities';
import type { TaskDTO } from '@/api/generated/models/taskDTO';
import type { ActivityDTO } from '@/api/generated/models/activityDTO';

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DUE_BY' | 'FAILED';

function getStatusBadge(status: TaskStatus | undefined, overdue?: boolean) {
  // If overdue, show overdue status
  if (overdue) {
    return (
      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
        <IconAlertTriangle className="h-3 w-3 mr-1" />
        Overdue
      </Badge>
    );
  }

  const variants: Record<TaskStatus, {
    icon: typeof IconCheck;
    label: string;
    className: string;
  }> = {
    COMPLETED: {
      icon: IconCheck,
      label: 'Completed',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    IN_PROGRESS: {
      icon: IconClock,
      label: 'In Progress',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    PENDING: {
      icon: IconClock,
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    DUE_BY: {
      icon: IconClock,
      label: 'Due Soon',
      className: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    CANCELLED: {
      icon: IconCheck,
      label: 'Cancelled',
      className: 'bg-gray-100 text-gray-600 border-gray-200',
    },
    FAILED: {
      icon: IconAlertTriangle,
      label: 'Failed',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  };

  const statusKey = status || 'PENDING';
  const config = variants[statusKey];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'activity'>('tasks');

  // Fetch tasks and activities using Orval-generated hook
  const {
    data: tasksAndActivities,
    isLoading,
    isError,
    refetch,
  } = useGetTasksAndActivities();

  const tasks: TaskDTO[] = tasksAndActivities?.tasks || [];
  const activities: ActivityDTO[] = tasksAndActivities?.activities || [];

  // Filter for non-completed tasks count
  const pendingTasksCount = tasks.filter(t => t.status !== 'COMPLETED').length;

  return (
    <DashboardContent>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <IconChecklist className="h-6 w-6" />
            <h1 className="text-2xl font-bold tracking-tight">Task & Activity</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Track your to-dos and monitor account activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <IconRefresh className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button variant="outline" size="icon">
            <IconFilter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading tasks and activities...</span>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center">
              <IconAlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load data</h3>
              <p className="text-muted-foreground mb-4">
                Unable to fetch tasks and activities. Please try again.
              </p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs - Only show when not loading and no error */}
      {!isLoading && !isError && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'tasks' | 'activity')}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="tasks">
              Tasks ({pendingTasksCount})
            </TabsTrigger>
            <TabsTrigger value="activity">
              Activity ({tasksAndActivities?.totalActivities || activities.length})
            </TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-6">
            <div className="space-y-4">
              {tasks.map((task) => (
                <Card key={task.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{task.title}</h3>
                          {getStatusBadge(task.status as TaskStatus, task.overdue)}
                        </div>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <IconClock className="h-4 w-4" />
                              Due {formatDate(task.dueDate)}
                            </span>
                          )}
                          {task.timeAgo && (
                            <span className="text-xs">{task.timeAgo}</span>
                          )}
                          {task.type && (
                            <Badge variant="outline">{formatEnum(task.type)}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {tasks.length === 0 && (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <IconChecklist className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Tasks</h3>
                    <p className="text-muted-foreground">
                      You're all caught up! No pending tasks at the moment.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates and events in your 401(k) account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities.map((activity, index) => (
                    <div key={activity.id} className={cn(
                      'flex gap-3 pb-3',
                      index !== activities.length - 1 && 'border-b'
                    )}>
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <IconCheck className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">{activity.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {activity.timeAgo || ''}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.message}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {activity.type && (
                            <Badge variant="outline" className="text-xs">{formatEnum(activity.type)}</Badge>
                          )}
                          {activity.actorName && (
                            <span>by {activity.actorName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {activities.length === 0 && (
                    <div className="text-center py-12">
                      <IconClock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
                      <p className="text-muted-foreground">
                        Activity will appear here as events occur
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </DashboardContent>
  );
}
