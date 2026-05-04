'use client';

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartSkeleton } from '@/components/ui/skeleton';
import {
  chartColorArray,
  tooltipConfig,
  chartFormatters,
  getChartColor,
} from './chart-config';
import { cn } from '@/lib/utils';

interface PieChartProps {
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
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;

  /**
   * Show as donut chart
   */
  donut?: boolean;

  /**
   * Inner radius for donut (as percentage)
   */
  innerRadius?: number;

  /**
   * Outer radius (as percentage)
   */
  outerRadius?: number;

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
   * Show labels on chart
   */
  showLabels?: boolean;

  /**
   * Center content for donut chart
   */
  centerContent?: React.ReactNode;

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
 * Custom label component for pie chart
 */
function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show label for small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

/**
 * Pie/Donut chart component for proportional data
 */
export function PieChart({
  title,
  description,
  data,
  donut = false,
  innerRadius = 60,
  outerRadius = 100,
  showLegend = true,
  height = 300,
  valueFormatter = chartFormatters.number,
  showLabels = true,
  centerContent,
  loading = false,
  className,
}: PieChartProps) {
  const effectiveInnerRadius = donut ? innerRadius : 0;

  const chartContent = loading ? (
    <ChartSkeleton type="pie" height={height} />
  ) : (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={`${effectiveInnerRadius}%`}
            outerRadius={`${outerRadius}%`}
            paddingAngle={2}
            dataKey="value"
            label={showLabels ? renderCustomLabel : undefined}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color ?? getChartColor(index)}
                className="outline-none focus:outline-none"
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={tooltipConfig.contentStyle}
            formatter={(value: number, name: string) => [
              valueFormatter(value),
              name,
            ]}
          />

          {showLegend && (
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingTop: '20px' }}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>

      {/* Center content for donut chart */}
      {donut && centerContent && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {centerContent}
        </div>
      )}
    </div>
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

/**
 * Donut chart with center label
 */
export function DonutChart({
  totalValue,
  totalLabel = 'Total',
  valueFormatter = chartFormatters.currency,
  ...props
}: Omit<PieChartProps, 'donut' | 'centerContent'> & {
  totalValue: number;
  totalLabel?: string;
}) {
  return (
    <PieChart
      {...props}
      donut
      valueFormatter={valueFormatter}
      centerContent={
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums">
            {valueFormatter(totalValue)}
          </p>
          <p className="text-sm text-muted-foreground">{totalLabel}</p>
        </div>
      }
    />
  );
}
