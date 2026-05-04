'use client';

import * as React from 'react';
import { Label, Pie, PieChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';

const chartConfig = {
  participants: {
    label: 'Participants',
  },
  active: {
    label: 'Active',
    // Primary graph color
    color: 'var(--tertiary-base, #5257E5)',
  },
  inactive: {
    label: 'Inactive',
    // Lightened secondary color
    color: 'rgba(166, 180, 250, 0.5)',
  },
  pending: {
    label: 'Pending',
    // Secondary graph color
    color: 'var(--primary-200, #A6B4FA)',
  },
} satisfies ChartConfig;

interface ParticipantsDonutChartProps {
  data?: {
    activeParticipants?: number;
    inactiveParticipants?: number;
    pendingParticipants?: number;
    totalParticipants?: number;
  };
}

export function ParticipantsDonutChart({ data }: ParticipantsDonutChartProps) {
  const activeCount = data?.activeParticipants ?? 0;
  const inactiveCount = data?.inactiveParticipants ?? 0;
  const pendingCount = data?.pendingParticipants ?? 0;
  const totalCount = data?.totalParticipants ?? 0;

  const chartData = [
    { category: 'active', label: 'Active', count: activeCount, fill: chartConfig.active.color },
    { category: 'pending', label: 'Pending', count: pendingCount, fill: chartConfig.pending.color },
    { category: 'inactive', label: 'Inactive', count: inactiveCount, fill: chartConfig.inactive.color },
  ];

  const totalParticipants = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);

  const getPercentage = (count: number) => {
    if (totalParticipants === 0) return 0;
    return Math.round((count / totalParticipants) * 100);
  };

  if (totalParticipants === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Participants</CardTitle>
          <CardDescription>Participant status breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            No participant data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle>Participants</CardTitle>
        <CardDescription>Participant status breakdown</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center py-6">
        {/* Donut Chart */}
        <div className="relative">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square w-[240px] h-[240px]">
            <PieChart>
              <Pie
                data={chartData.filter((item) => item.count > 0)}
                dataKey="count"
                nameKey="category"
                innerRadius={65}
                outerRadius={95}
                strokeWidth={0}
                paddingAngle={2}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 8}
                            className="fill-foreground text-4xl font-bold"
                          >
                            {totalParticipants.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 22}
                            className="fill-muted-foreground text-sm font-medium"
                          >
                            Total
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>

        {/* Legend */}
        <div className="mt-6 grid grid-cols-3 gap-4 w-full">
          {chartData.map((item) => {
            const percentage = getPercentage(item.count);
            return (
              <div key={item.category} className="flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <div className="text-lg font-bold">{item.count}</div>
                <div className="text-xs text-muted-foreground">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
