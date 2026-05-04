'use client';

import { useState } from 'react';
import {
  useGetActivities,
  useGetActivitiesByDateRange,
} from '@/api/generated/endpoints/activity-log/activity-log';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  IconShield,
  IconLoader2,
  IconActivity,
  IconCalendar,
  IconSearch,
  IconUser,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { DashboardContent } from '@/components/layout/dashboard-layout';

export default function AuditLogsPage() {
  const [activityPage, setActivityPage] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Activity Logs (tenant-specific)
  const { data: activitiesData, isLoading: activitiesLoading, refetch } = useGetActivities(
    {
      page: activityPage,
      size: 20,
    },
  );

  // Date range filtered activities
  const { data: dateRangeData, isLoading: dateRangeLoading, refetch: refetchDateRange } = useGetActivitiesByDateRange(
    {
      startDate: startDate ? `${startDate}T00:00:00` : '',
      endDate: endDate ? `${endDate}T23:59:59` : '',
      page: activityPage,
      size: 20,
    },
    {
      query: {
        enabled: !!(startDate && endDate),
      },
    },
  );

  const getActivityBadgeVariant = (type: string) => {
    const successTypes = [
      'REGISTRATION_COMPLETED',
      'LOGIN',
      'CONTRIBUTION_CHANGE',
      'WITHDRAWAL_APPROVED',
      'CONTRIBUTION_POSTED',
      'ENROLLMENT_COMPLETED',
    ];
    const warningTypes = ['WITHDRAWAL_REQUESTED', 'DOCUMENT_UPLOADED', 'DEFERRAL_CHANGE'];
    const errorTypes = ['LOGIN_FAILED', 'WITHDRAWAL_REJECTED'];

    if (successTypes.includes(type)) return 'default';
    if (errorTypes.includes(type)) return 'destructive';
    if (warningTypes.includes(type)) return 'secondary';
    return 'outline';
  };

  // Use date range data if dates are set, otherwise use regular activities
  const hasDateFilter = !!(startDate && endDate);
  const activities = hasDateFilter
    ? (dateRangeData?.content || [])
    : (activitiesData?.content || []);
  const currentData = hasDateFilter ? dateRangeData : activitiesData;
  const isLoading = hasDateFilter ? dateRangeLoading : activitiesLoading;

  const handleDateFilter = () => {
    if (startDate && endDate) {
      setActivityPage(0);
      refetchDateRange();
    }
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setActivityPage(0);
    refetch();
  };

  return (
    <DashboardContent>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <IconActivity className="h-6 w-6" />
            Activity Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            User activities and system events for compliance and auditing
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity History</CardTitle>
                <CardDescription>
                  Track user actions, system events, and compliance activities
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Filters */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDateFilter}
                disabled={!startDate || !endDate}
              >
                <IconSearch className="h-4 w-4 mr-2" />
                Filter
              </Button>
              {hasDateFilter && (
                <Button variant="ghost" size="sm" onClick={clearDateFilter}>
                  Clear
                </Button>
              )}
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <IconActivity className="h-12 w-12 text-muted-foreground mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">
                  {hasDateFilter ? 'No activities found for the selected date range' : 'No activities found'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Activities will appear here as users interact with the system
                </p>
              </div>
            ) : (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead>Participant</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((activity: any) => (
                        <TableRow key={activity.id}>
                          <TableCell className="text-xs">
                            {activity.createdAt ? (
                              <>
                                <div className="font-medium">
                                  {format(new Date(activity.createdAt), 'MMM d, yyyy')}
                                </div>
                                <div className="text-muted-foreground">
                                  {format(new Date(activity.createdAt), 'h:mm:ss a')}
                                </div>
                              </>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <IconUser className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div className="text-sm">
                                <p className="font-medium">{activity.actorName || 'Unknown'}</p>
                                {activity.actorType && (
                                  <p className="text-xs text-muted-foreground">
                                    {activity.actorType}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActivityBadgeVariant(activity.type || '')}>
                              {activity.type || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{activity.title || 'N/A'}</p>
                              {activity.message && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {activity.message}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {activity.participantName ? (
                              <div className="text-sm">
                                <p className="font-medium">{activity.participantName}</p>
                                {activity.participantId && (
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {activity.participantId}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {activity.metadata && Object.keys(activity.metadata).length > 0 ? (
                              <div className="text-xs">
                                {Object.entries(activity.metadata).map(([key, value]) => (
                                  <div key={key} className="text-muted-foreground">
                                    <span className="font-medium">{key}:</span>{' '}
                                    {String(value)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {currentData && (currentData.totalPages ?? 0) > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentData.number ?? 0) * (currentData.size ?? 20) + 1} to{' '}
                      {Math.min(
                        ((currentData.number ?? 0) + 1) * (currentData.size ?? 20),
                        currentData.totalElements ?? 0,
                      )}{' '}
                      of {currentData.totalElements ?? 0} activities
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActivityPage((p) => Math.max(0, p - 1))}
                        disabled={activityPage === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActivityPage((p) => p + 1)}
                        disabled={activityPage >= (currentData.totalPages || 1) - 1}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardContent>
  );
}
