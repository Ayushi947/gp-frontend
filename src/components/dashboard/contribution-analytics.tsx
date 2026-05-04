'use client';

import { useMemo } from 'react';
import {
  IconCash,
  IconTrendingUp,
  IconCalendar,
  IconArrowUpRight,
  IconArrowDownRight,
  IconDownload,
} from '@tabler/icons-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AreaChart } from '@/components/charts/area-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { formatCurrency, formatDate, formatPercent, formatEnum, cn } from '@/lib/utils';

interface ContributionTrend {
  date: string;
  employeeContributions: number;
  employerContributions: number;
  total: number;
}

interface ContributionBreakdown {
  type: string;
  amount: number;
  percentage: number;
}

interface ContributionAnalyticsData {
  ytdEmployeeContributions: number;
  ytdEmployerContributions: number;
  ytdTotalContributions: number;
  mtdContributions: number;
  mtdChange: number;
  averageContributionPerPayroll: number;
  lastPayrollDate: string;
  lastPayrollAmount: number;
  trend: ContributionTrend[];
  breakdown: ContributionBreakdown[];
}

interface ContributionAnalyticsProps {
  data: ContributionAnalyticsData;
  className?: string;
  onExport?: () => void;
}

/**
 * Contribution analytics for sponsor dashboard
 */
export function ContributionAnalytics({
  data,
  className,
  onExport,
}: ContributionAnalyticsProps) {
  const trendChartData = useMemo(() => {
    return data.trend.map((item) => ({
      date: item.date,
      Employee: item.employeeContributions,
      Employer: item.employerContributions,
    }));
  }, [data.trend]);

  const breakdownChartData = useMemo(() => {
    return data.breakdown.map((item) => ({
      name: item.type,
      value: item.amount,
    }));
  }, [data.breakdown]);

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconCash className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Contribution Analytics</CardTitle>
          </div>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <IconDownload className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
        <CardDescription>Year-to-date contribution summary and trends</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* YTD Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Employee YTD</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatCurrency(data.ytdEmployeeContributions)}
            </p>
          </div>
          <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Employer YTD</p>
            <p className="text-xl font-semibold tabular-nums text-success">
              {formatCurrency(data.ytdEmployerContributions)}
            </p>
          </div>
          <div className="space-y-1 p-3 bg-primary/10 rounded-lg">
            <p className="text-xs text-muted-foreground">Total YTD</p>
            <p className="text-xl font-semibold tabular-nums text-primary">
              {formatCurrency(data.ytdTotalContributions)}
            </p>
          </div>
        </div>

        {/* Month-to-Date */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Month-to-Date</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatCurrency(data.mtdContributions)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {data.mtdChange >= 0 ? (
              <IconArrowUpRight className="h-4 w-4 text-success" />
            ) : (
              <IconArrowDownRight className="h-4 w-4 text-error" />
            )}
            <span
              className={cn(
                'text-sm font-medium',
                data.mtdChange >= 0 ? 'text-success' : 'text-error'
              )}
            >
              {data.mtdChange >= 0 ? '+' : ''}{formatPercent(data.mtdChange)} vs last month
            </span>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Contribution Trends</p>
          <AreaChart
            data={trendChartData}
            xAxisKey="date"
            dataKey="Employee"
            dataKeys={[
              { key: 'Employee', name: 'Employee', color: 'hsl(var(--primary))' },
              { key: 'Employer', name: 'Employer', color: 'hsl(var(--success))' },
            ]}
            height={200}
            showGrid
          />
        </div>

        {/* Last Payroll Info */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Last Payroll:</span>
            <span className="text-sm font-medium">{formatDate(data.lastPayrollDate)}</span>
          </div>
          <Badge variant="secondary" className="tabular-nums">
            {formatCurrency(data.lastPayrollAmount)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Contribution breakdown by type
 */
export function ContributionBreakdownChart({
  data,
  className,
}: {
  data: ContributionBreakdown[];
  className?: string;
}) {
  const chartData = data.map((item) => ({
    name: item.type,
    amount: item.amount,
  }));

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Contribution Types</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart
          data={chartData}
          xAxisKey="name"
          dataKey="amount"
          color="hsl(var(--primary))"
          height={200}
          layout="vertical"
        />
        <div className="mt-4 space-y-2">
          {data.map((item) => (
            <div key={item.type} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{formatEnum(item.type)}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium tabular-nums">{formatCurrency(item.amount)}</span>
                <span className="text-xs text-muted-foreground">
                  ({formatPercent(item.percentage)})
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Quick payroll summary widget
 */
export function PayrollSummaryWidget({
  lastPayrollDate,
  lastPayrollAmount,
  nextPayrollDate,
  averagePayroll,
  className,
}: {
  lastPayrollDate: string;
  lastPayrollAmount: number;
  nextPayrollDate?: string;
  averagePayroll: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <IconCalendar className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Payroll Summary</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Last Processed</p>
          <p className="text-sm font-medium">{formatDate(lastPayrollDate)}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatCurrency(lastPayrollAmount)}
          </p>
        </div>
        {nextPayrollDate && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Next Expected</p>
            <p className="text-sm font-medium">{formatDate(nextPayrollDate)}</p>
          </div>
        )}
      </div>
      <div className="pt-2 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Average per payroll</span>
          <span className="font-medium tabular-nums">{formatCurrency(averagePayroll)}</span>
        </div>
      </div>
    </div>
  );
}
