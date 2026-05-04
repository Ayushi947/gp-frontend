'use client';

import {
  IconBuildingBank,
  IconUsers,
  IconCash,
  IconTrendingUp,
  IconCalendar,
  IconShieldCheck,
  IconChartPie,
  IconArrowUpRight,
  IconArrowDownRight,
} from '@tabler/icons-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatPercent, formatEnum, cn } from '@/lib/utils';

interface PlanOverviewData {
  planName: string;
  planType: string;
  effectiveDate: string;
  planYearEnd: string;
  totalAssets: number;
  assetChange: number;
  assetChangePercent: number;
  totalParticipants: number;
  participantChange: number;
  averageBalance: number;
  participationRate: number;
  complianceStatus: 'compliant' | 'non_compliant' | 'pending';
  lastTestDate?: string;
}

interface PlanOverviewProps {
  data: PlanOverviewData;
  className?: string;
}

/**
 * Plan overview card for sponsor dashboard
 */
export function PlanOverview({ data, className }: PlanOverviewProps) {
  const complianceConfig = {
    compliant: { color: 'text-success', bg: 'bg-success/10', label: 'Compliant' },
    non_compliant: { color: 'text-error', bg: 'bg-error/10', label: 'Non-Compliant' },
    pending: { color: 'text-warning', bg: 'bg-warning/10', label: 'Testing Required' },
  };

  const compliance = complianceConfig[data.complianceStatus];

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <IconBuildingBank className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{data.planName}</CardTitle>
              <CardDescription>{formatEnum(data.planType)}</CardDescription>
            </div>
          </div>
          <Badge className={cn(compliance.bg, compliance.color)} variant="secondary">
            <IconShieldCheck className="mr-1 h-3 w-3" />
            {compliance.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Assets */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <IconCash className="h-3 w-3" />
              <span>Total Assets</span>
            </div>
            <p className="text-xl font-semibold tabular-nums">
              {formatCurrency(data.totalAssets)}
            </p>
            <div className="flex items-center gap-1">
              {data.assetChangePercent >= 0 ? (
                <IconArrowUpRight className="h-3 w-3 text-success" />
              ) : (
                <IconArrowDownRight className="h-3 w-3 text-error" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  data.assetChangePercent >= 0 ? 'text-success' : 'text-error'
                )}
              >
                {formatPercent(Math.abs(data.assetChangePercent))}
              </span>
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <IconUsers className="h-3 w-3" />
              <span>Participants</span>
            </div>
            <p className="text-xl font-semibold tabular-nums">
              {data.totalParticipants.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              {data.participantChange >= 0 ? (
                <IconArrowUpRight className="h-3 w-3 text-success" />
              ) : (
                <IconArrowDownRight className="h-3 w-3 text-error" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  data.participantChange >= 0 ? 'text-success' : 'text-error'
                )}
              >
                {data.participantChange >= 0 ? '+' : ''}{data.participantChange} this month
              </span>
            </div>
          </div>

          {/* Average Balance */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <IconChartPie className="h-3 w-3" />
              <span>Avg. Balance</span>
            </div>
            <p className="text-xl font-semibold tabular-nums">
              {formatCurrency(data.averageBalance)}
            </p>
            <p className="text-xs text-muted-foreground">Per participant</p>
          </div>

          {/* Participation Rate */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <IconTrendingUp className="h-3 w-3" />
              <span>Participation</span>
            </div>
            <p className="text-xl font-semibold tabular-nums">
              {formatPercent(data.participationRate)}
            </p>
            <p className="text-xs text-muted-foreground">Of eligible employees</p>
          </div>
        </div>

        {/* Plan Details */}
        <div className="flex flex-wrap gap-4 pt-2 border-t text-sm">
          <div className="flex items-center gap-2">
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Effective:</span>
            <span className="font-medium">{formatDate(data.effectiveDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Plan Year End:</span>
            <span className="font-medium">{data.planYearEnd}</span>
          </div>
          {data.lastTestDate && (
            <div className="flex items-center gap-2">
              <IconShieldCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last Test:</span>
              <span className="font-medium">{formatDate(data.lastTestDate)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof IconCash;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

/**
 * Reusable metric card for dashboard statistics
 */
export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 pt-1">
                {trend.isPositive ? (
                  <IconArrowUpRight className="h-3 w-3 text-success" />
                ) : (
                  <IconArrowDownRight className="h-3 w-3 text-error" />
                )}
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.isPositive ? 'text-success' : 'text-error'
                  )}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
