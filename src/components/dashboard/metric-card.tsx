'use client';

import * as React from 'react';
import { IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCardSkeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency, formatPercent, formatCompactNumber } from '@/lib/utils';

type TrendDirection = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  /**
   * Title of the metric
   */
  title: string;

  /**
   * Value to display
   */
  value: string | number;

  /**
   * Format type for the value
   */
  format?: 'currency' | 'percent' | 'number' | 'compact' | 'none';

  /**
   * Change information
   */
  change?: {
    value: number;
    label: string;
  };

  /**
   * Icon component to display
   */
  icon?: React.ComponentType<{ className?: string }>;

  /**
   * Description text
   */
  description?: string;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Format value based on format type
 */
function formatValue(value: string | number, format?: MetricCardProps['format']): string {
  if (typeof value === 'string') return value;

  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return formatPercent(value);
    case 'compact':
      return formatCompactNumber(value);
    case 'number':
      return value.toLocaleString();
    default:
      return String(value);
  }
}

/**
 * Get trend direction from change value
 */
function getTrendDirection(value: number): TrendDirection {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'neutral';
}

/**
 * Metric card component for displaying KPIs
 */
export function MetricCard({
  title,
  value,
  format = 'none',
  change,
  icon: Icon,
  description,
  loading = false,
  className,
}: MetricCardProps) {
  if (loading) {
    return <MetricCardSkeleton className={className} />;
  }

  const trend = change ? getTrendDirection(change.value) : undefined;
  const formattedValue = formatValue(value, format);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{formattedValue}</div>

        {change && (
          <div className="flex items-center gap-1 mt-1">
            {trend === 'up' && (
              <IconTrendingUp className="h-3 w-3 text-success" />
            )}
            {trend === 'down' && (
              <IconTrendingDown className="h-3 w-3 text-error" />
            )}
            {trend === 'neutral' && (
              <IconMinus className="h-3 w-3 text-muted-foreground" />
            )}
            <span
              className={cn(
                'text-xs font-medium',
                trend === 'up' && 'text-success',
                trend === 'down' && 'text-error',
                trend === 'neutral' && 'text-muted-foreground'
              )}
            >
              {change.value > 0 ? '+' : ''}
              {change.value}%
            </span>
            <span className="text-xs text-muted-foreground">{change.label}</span>
          </div>
        )}

        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Grid layout for metric cards
 */
export function MetricCardGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const columnClasses = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', columnClasses[columns], className)}>
      {children}
    </div>
  );
}
