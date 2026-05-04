'use client';

import { useMemo } from 'react';
import {
  IconUsers,
  IconUserPlus,
  IconUserMinus,
  IconUserCheck,
  IconClock,
  IconPercentage,
} from '@tabler/icons-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart } from '@/components/charts/pie-chart';
import { formatPercent, formatEnum, cn } from '@/lib/utils';

interface ParticipantStatsData {
  totalEligible: number;
  totalEnrolled: number;
  activelyContributing: number;
  pendingEnrollment: number;
  recentlyTerminated: number;
  hceCount: number;
  nhceCount: number;
  averageDeferralRate: number;
  averageAge: number;
  averageTenure: number;
  ageDistribution: { range: string; count: number }[];
  statusDistribution: { status: string; count: number; color: string }[];
}

interface ParticipantStatsProps {
  data: ParticipantStatsData;
  className?: string;
}

/**
 * Participant statistics card for sponsor dashboard
 */
export function ParticipantStats({ data, className }: ParticipantStatsProps) {
  const participationRate = (data.totalEnrolled / data.totalEligible) * 100;
  const contributingRate = (data.activelyContributing / data.totalEnrolled) * 100;

  const statusChartData = useMemo(() => {
    return data.statusDistribution.map((item) => ({
      name: item.status,
      value: item.count,
      fill: item.color,
    }));
  }, [data.statusDistribution]);

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <IconUsers className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Participant Overview</CardTitle>
        </div>
        <CardDescription>
          {data.totalEnrolled.toLocaleString()} of {data.totalEligible.toLocaleString()} eligible employees enrolled
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Participation Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Participation Rate</span>
            <span className="font-medium tabular-nums">{formatPercent(participationRate)}</span>
          </div>
          <Progress value={participationRate} className="h-2" />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1 text-center p-3 bg-muted/50 rounded-lg">
            <IconUserCheck className="h-5 w-5 mx-auto text-success" />
            <p className="text-lg font-semibold tabular-nums">{data.activelyContributing}</p>
            <p className="text-xs text-muted-foreground">Contributing</p>
          </div>
          <div className="space-y-1 text-center p-3 bg-muted/50 rounded-lg">
            <IconClock className="h-5 w-5 mx-auto text-warning" />
            <p className="text-lg font-semibold tabular-nums">{data.pendingEnrollment}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="space-y-1 text-center p-3 bg-muted/50 rounded-lg">
            <IconUserPlus className="h-5 w-5 mx-auto text-info" />
            <p className="text-lg font-semibold tabular-nums">{data.hceCount}</p>
            <p className="text-xs text-muted-foreground">HCEs</p>
          </div>
          <div className="space-y-1 text-center p-3 bg-muted/50 rounded-lg">
            <IconUserMinus className="h-5 w-5 mx-auto text-muted-foreground" />
            <p className="text-lg font-semibold tabular-nums">{data.recentlyTerminated}</p>
            <p className="text-xs text-muted-foreground">Terminated</p>
          </div>
        </div>

        {/* HCE vs NHCE Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Employee Classification</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">HCE</span>
                <span className="font-medium tabular-nums">{data.hceCount}</span>
              </div>
              <Progress
                value={(data.hceCount / data.totalEnrolled) * 100}
                className="h-2 bg-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                {formatPercent((data.hceCount / data.totalEnrolled) * 100)} of enrolled
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">NHCE</span>
                <span className="font-medium tabular-nums">{data.nhceCount}</span>
              </div>
              <Progress
                value={(data.nhceCount / data.totalEnrolled) * 100}
                className="h-2 bg-success/50"
              />
              <p className="text-xs text-muted-foreground">
                {formatPercent((data.nhceCount / data.totalEnrolled) * 100)} of enrolled
              </p>
            </div>
          </div>
        </div>

        {/* Key Averages */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div className="space-y-1 text-center">
            <IconPercentage className="h-4 w-4 mx-auto text-muted-foreground" />
            <p className="text-lg font-semibold tabular-nums">
              {formatPercent(data.averageDeferralRate)}
            </p>
            <p className="text-xs text-muted-foreground">Avg. Deferral</p>
          </div>
          <div className="space-y-1 text-center">
            <IconUsers className="h-4 w-4 mx-auto text-muted-foreground" />
            <p className="text-lg font-semibold tabular-nums">{data.averageAge}</p>
            <p className="text-xs text-muted-foreground">Avg. Age</p>
          </div>
          <div className="space-y-1 text-center">
            <IconClock className="h-4 w-4 mx-auto text-muted-foreground" />
            <p className="text-lg font-semibold tabular-nums">{data.averageTenure}</p>
            <p className="text-xs text-muted-foreground">Avg. Tenure (yrs)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Age distribution chart for participant demographics
 */
export function AgeDistributionChart({
  data,
  className,
}: {
  data: { range: string; count: number }[];
  className?: string;
}) {
  const chartData = data.map((item, index) => ({
    name: item.range,
    value: item.count,
    fill: `hsl(var(--chart-${(index % 5) + 1}))`,
  }));

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Age Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <PieChart
          data={chartData}
          height={200}
          showLegend
        />
      </CardContent>
    </Card>
  );
}

/**
 * Participant status breakdown for quick reference
 */
export function ParticipantStatusBreakdown({
  data,
  className,
}: {
  data: { status: string; count: number; color: string }[];
  className?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-sm font-medium">Status Breakdown</p>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.status} className="flex items-center gap-3">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="flex-1 text-sm">{formatEnum(item.status)}</span>
            <span className="text-sm font-medium tabular-nums">{item.count}</span>
            <span className="text-xs text-muted-foreground w-12 text-right">
              {formatPercent((item.count / total) * 100)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
