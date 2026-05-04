'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartSkeleton } from '@/components/ui/skeleton';
import {
  chartColors,
  chartColorArray,
  axisConfig,
  gridConfig,
  tooltipConfig,
  chartMargins,
  chartFormatters,
  getChartColor,
} from './chart-config';
import { cn } from '@/lib/utils';

interface BarChartProps {
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
   * Multiple data keys for grouped bars
   */
  dataKeys?: Array<{
    key: string;
    name: string;
    color?: string;
  }>;

  /**
   * Color for the bars
   */
  color?: string;

  /**
   * Use different colors for each bar
   */
  multiColor?: boolean;

  /**
   * Layout direction
   */
  layout?: 'horizontal' | 'vertical';

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
   * Bar radius
   */
  radius?: number;

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
 * Bar chart component for categorical data
 */
export function BarChart({
  title,
  description,
  data,
  dataKey,
  xAxisKey,
  dataKeys,
  color = chartColors.primary,
  multiColor = false,
  layout = 'horizontal',
  showGrid = true,
  showLegend = false,
  height = 300,
  radius = 4,
  valueFormatter = chartFormatters.number,
  xAxisFormatter,
  loading = false,
  className,
}: BarChartProps) {
  const isVertical = layout === 'vertical';

  const chartContent = loading ? (
    <ChartSkeleton type="bar" height={height} />
  ) : (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={
          isVertical
            ? { ...chartMargins.default, left: 80 }
            : showLegend
              ? chartMargins.withLegend
              : chartMargins.default
        }
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray={gridConfig.strokeDasharray}
            stroke={gridConfig.stroke}
            horizontal={isVertical}
            vertical={!isVertical}
          />
        )}

        {isVertical ? (
          <>
            <XAxis
              type="number"
              {...axisConfig}
              tickFormatter={(value) => valueFormatter(value as number)}
            />
            <YAxis
              type="category"
              dataKey={xAxisKey}
              {...axisConfig}
              width={70}
              tickFormatter={xAxisFormatter}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xAxisKey}
              {...axisConfig}
              tickFormatter={xAxisFormatter}
            />
            <YAxis
              {...axisConfig}
              tickFormatter={(value) => valueFormatter(value as number)}
            />
          </>
        )}

        <Tooltip
          contentStyle={tooltipConfig.contentStyle}
          formatter={(value: number) => [valueFormatter(value), '']}
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
        />

        {showLegend && <Legend />}

        {dataKeys ? (
          dataKeys.map((dk, index) => (
            <Bar
              key={dk.key}
              dataKey={dk.key}
              name={dk.name}
              fill={dk.color ?? getChartColor(index)}
              radius={[radius, radius, radius, radius]}
            />
          ))
        ) : (
          <Bar
            dataKey={dataKey}
            fill={color}
            radius={[radius, radius, radius, radius]}
          >
            {multiColor &&
              data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={getChartColor(index)} />
              ))}
          </Bar>
        )}
      </RechartsBarChart>
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
