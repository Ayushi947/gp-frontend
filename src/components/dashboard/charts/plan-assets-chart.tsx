'use client';

import { Area, AreaChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';

interface PlanAssetsChartProps {
    data?: {
        historicalData?: Array<{
            date?: string;
            total?: number;
        }>;
        totalAssets?: number;
    };
}

export function PlanAssetsChart({ data }: PlanAssetsChartProps) {
    const chartData = data?.historicalData ?? [];
    const totalAssets = data?.totalAssets ?? 0;

    const firstValue = chartData[0]?.total ?? 0;
    const lastValue = chartData[chartData.length - 1]?.total ?? 0;

    const percentageChange =
        firstValue > 0
            ? Math.round(((lastValue - firstValue) / firstValue) * 100)
            : 0;

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Plan Assets</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        No historical data available
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Plan Assets</CardTitle>

                <div className="text-sm font-bold ml-1 text-blue-500">
                    {Number(totalAssets).toLocaleString(undefined, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 2,
                    })}
                    <span
                        className={`text-sm ml-1 ${
                            percentageChange >= 0 ? 'text-blue-500' : 'text-red-500'
                        }`}
                    >
            ({percentageChange}%)
          </span>
                </div>
            </CardHeader>

            <CardContent>
                <ChartContainer config={{}} className="h-[300px] w-full">
                    <AreaChart data={chartData}>

                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#5257E5" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#5257E5" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>

                        <ChartTooltip
                            cursor={{ stroke: '#5257E5', strokeWidth: 1 }}
                            content={
                                <ChartTooltipContent
                                    indicator="dot"
                                    labelFormatter={() => ''}
                                    formatter={(value) =>
                                        `$${Number(value).toLocaleString()}`
                                    }
                                />
                            }
                        />

                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={() => ''}
                        />

                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                                if (value >= 1000000) {
                                    return `${(value / 1000000).toFixed(1)}M`;
                                } else if (value >= 1000) {
                                    return `${(value / 1000).toFixed(0)}K`;
                                }
                                return `${value}`;
                            }}
                        />

                        <Area
                            dataKey="total"
                            type="linear"
                            stroke="#5257E5"
                            strokeWidth={2}
                            fill="url(#colorTotal)"
                            dot={false}
                            activeDot={{
                                r: 5,
                                fill: '#5257E5',
                                stroke: '#fff',
                                strokeWidth: 2,
                            }}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}