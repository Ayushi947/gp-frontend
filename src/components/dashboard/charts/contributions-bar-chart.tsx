'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';

const chartConfig = {
    employee: {
        label: 'Employee',
        color: '#4F46E5',
    },
    employer: {
        label: 'Employer',
        color: '#A5B4FC',
    },
} satisfies ChartConfig;

const FILTERS = ['ALL', '1M', '6M', '1Y', 'YTD'];

export function ContributionsBarChart({ data }: any) {
    const [selectedFilter, setSelectedFilter] = useState('ALL');

    const rawData =
        data?.monthlyContributions?.map((item: any) => ({
            month: item.month,
            employee: item.employeeContributions ?? 0,
            employer: item.employerContributions ?? 0,
        })) ?? [];

    const currentMonthIndex = new Date().getMonth();

    const getFilteredData = () => {
        switch (selectedFilter) {
            case '1M':
                return rawData[currentMonthIndex]
                    ? [rawData[currentMonthIndex]]
                    : [];

            case '6M':
                return rawData.slice(0, 6);

            case '1Y':
                return rawData;

            case 'YTD':
                return rawData.slice(0, currentMonthIndex + 1);

            default:
                return rawData;
        }
    };

    const chartData = getFilteredData();

    const ytdData = rawData.slice(0, currentMonthIndex + 1);

    const ytdEmployee = ytdData.reduce(
        (sum: number, item: any) => sum + item.employee,
        0
    );

    const ytdEmployer = ytdData.reduce(
        (sum: number, item: any) => sum + item.employer,
        0
    );

    const lifeEmployee = data?.lifeToDateEmployee ?? 0;
    const lifeEmployer = data?.lifeToDateEmployer ?? 0;

    if (!chartData.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Contributions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        No contribution data available
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Contributions</CardTitle>

                {/* Filters */}
                <div className="flex gap-2">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setSelectedFilter(filter)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                                selectedFilter === filter
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-200 text-gray-600'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </CardHeader>

            <CardContent>
                {/* Chart */}
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={chartData} barCategoryGap="20%">
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />

                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fontWeight: 600 }}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) =>
                                `$${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`
                            }
                        />

                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(value) => formatCurrency(Number(value))}
                                />
                            }
                        />

                        {/* ✅ STACKED (Correct approach) */}
                        <Bar dataKey="employee" stackId="a" fill="#4F46E5" />
                        <Bar
                            dataKey="employer"
                            stackId="a"
                            fill="#A5B4FC"
                            radius={[8, 8, 0, 0]}
                        />
                    </BarChart>
                </ChartContainer>

                {/* Bottom values */}
                <div className="grid grid-cols-4 gap-4 mt-6 text-center">
                    <div>
                        <p className="text-indigo-600 font-semibold">
                            {formatCurrency(ytdEmployee)}
                        </p>
                        <p className="text-xs text-gray-500">Year-to-Date Employee</p>
                    </div>

                    <div>
                        <p className="text-indigo-400 font-semibold">
                            {formatCurrency(ytdEmployer)}
                        </p>
                        <p className="text-xs text-gray-500">Year-to-Date Employer</p>
                    </div>

                    <div>
                        <p className="text-indigo-600 font-semibold">
                            {formatCurrency(lifeEmployee)}
                        </p>
                        <p className="text-xs text-gray-500">Life-to-Date Employee</p>
                    </div>

                    <div>
                        <p className="text-indigo-400 font-semibold">
                            {formatCurrency(lifeEmployer)}
                        </p>
                        <p className="text-xs text-gray-500">Life-to-Date Employer</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}