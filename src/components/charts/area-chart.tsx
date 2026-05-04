'use client';

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartSkeleton } from '@/components/ui/skeleton';
import {
  chartColors,
  axisConfig,
  gridConfig,
  tooltipConfig,
  chartMargins,
  chartFormatters,
  generateGradientId,
} from './chart-config';
import { cn } from '@/lib/utils';

interface AreaChartProps {
  /**
   * Chart title
   */
  title?: string;

  /**
   * Chart description
   */
  description?: string;

  /**
   * Chart data
   */
  data: Array<Record<string, unknown>>;

  /**
   * Data key for the Y axis value
   */
  dataKey: string;

  /**
   * Data key for the X axis labels
   */
  xAxisKey: string;

  /**
   * Multiple data keys for stacked areas
   */
  dataKeys?: Array<{
    key: string;
    name: string;
    color?: string;
  }>;

  /**
   * Color for the area
   */
  color?: string;

  /**
   * Show grid lines
   */
  showGrid?: boolean;

  /**
   * Show legend
   */
  showLegend?: boolean;

  /**
   * Chart height
   */
  height?: number;

  /**
   * Value formatter for tooltip
   */
  valueFormatter?: (value: number) => string;

  /**
   * X-axis label formatter
   */
  xAxisFormatter?: (value: string) => string;

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
 * Area chart component for time series data
 */
export function AreaChart({
  title,
  description,
  data,
  dataKey,
  xAxisKey,
  dataKeys,
  color = chartColors.primary,
  showGrid = true,
  showLegend = false,
  height = 300,
  valueFormatter = chartFormatters.number,
  xAxisFormatter,
  loading = false,
  className,
}: AreaChartProps) {
  const gradientId = generateGradientId('area');

  const chartContent = loading ? (
    <ChartSkeleton type="area" height={height} />
  ) : (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart
        data={data}
        margin={showLegend ? chartMargins.withLegend : chartMargins.default}
      >
        <defs>
          {dataKeys ? (
            dataKeys.map((dk, index) => (
              <linearGradient
                key={dk.key}
                id={`${gradientId}-${index}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={dk.color ?? color}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={dk.color ?? color}
                  stopOpacity={0}
                />
              </linearGradient>
            ))
          ) : (
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          )}
        </defs>

        {showGrid && (
          <CartesianGrid
            strokeDasharray={gridConfig.strokeDasharray}
            stroke={gridConfig.stroke}
            vertical={gridConfig.vertical}
          />
        )}

        <XAxis
          dataKey={xAxisKey}
          {...axisConfig}
          tickFormatter={xAxisFormatter}
        />

        <YAxis
          {...axisConfig}
          tickFormatter={(value) => valueFormatter(value as number)}
        />

        <Tooltip
          contentStyle={tooltipConfig.contentStyle}
          formatter={(value: number) => [valueFormatter(value), '']}
        />

        {showLegend && <Legend />}

        {dataKeys ? (
          dataKeys.map((dk, index) => (
            <Area
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.name}
              stroke={dk.color ?? color}
              fill={`url(#${gradientId}-${index})`}
              strokeWidth={2}
            />
          ))
        ) : (
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={`url(#${gradientId})`}
            strokeWidth={2}
          />
        )}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );

  if (!title) {
    return <div className={className}>{chartContent}</div>;
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{chartContent}</CardContent>
    </Card>
  );
}
