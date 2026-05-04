'use client';

import { IconClock, IconCheck, IconLock } from '@tabler/icons-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { VESTING_SCHEDULES } from '@/config/retirement';
import { formatCurrency, cn } from '@/lib/utils';

interface VestingScheduleDisplayProps {
  scheduleId: keyof typeof VESTING_SCHEDULES;
  yearsOfService: number;
  totalAmount: number;
  className?: string;
}

/**
 * Display vesting schedule with current progress
 */
export function VestingScheduleDisplay({
  scheduleId,
  yearsOfService,
  totalAmount,
  className,
}: VestingScheduleDisplayProps) {
  const schedule = VESTING_SCHEDULES[scheduleId];
  if (!schedule) return null;

  // Calculate current vesting percentage
  let currentVestingPercent = 0;
  for (const tier of schedule.schedule) {
    if (yearsOfService >= tier.year) {
      currentVestingPercent = tier.percentage;
    }
  }

  const vestedAmount = (totalAmount * currentVestingPercent) / 100;
  const unvestedAmount = totalAmount - vestedAmount;

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconClock className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{schedule.name}</CardTitle>
          </div>
          <Badge variant={currentVestingPercent === 100 ? 'default' : 'secondary'}>
            {currentVestingPercent}% Vested
          </Badge>
        </div>
        <CardDescription>{schedule.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vesting Progress</span>
            <span className="font-medium">{yearsOfService} years of service</span>
          </div>
          <Progress value={currentVestingPercent} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(vestedAmount)} vested</span>
            <span>{formatCurrency(unvestedAmount)} unvested</span>
          </div>
        </div>

        {/* Schedule Timeline */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Vesting Schedule</p>
          <div className="relative">
            {schedule.schedule.map((tier, index) => {
              const isVested = yearsOfService >= tier.year;
              const isCurrent =
                yearsOfService >= tier.year &&
                (index === schedule.schedule.length - 1 ||
                  yearsOfService < schedule.schedule[index + 1]!.year);

              return (
                <div
                  key={tier.year}
                  className={cn(
                    'flex items-center gap-3 py-2',
                    index < schedule.schedule.length - 1 && 'border-l-2 ml-3 pl-6',
                    isVested ? 'border-primary' : 'border-muted'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                      isVested
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                      index > 0 && '-ml-9'
                    )}
                  >
                    {isVested ? (
                      <IconCheck className="h-3.5 w-3.5" />
                    ) : (
                      <IconLock className="h-3 w-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-sm',
                          isVested ? 'font-medium' : 'text-muted-foreground'
                        )}
                      >
                        Year {tier.year}
                      </span>
                      <span
                        className={cn(
                          'text-sm font-medium tabular-nums',
                          isVested ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {tier.percentage}%
                      </span>
                    </div>
                    {isCurrent && (
                      <p className="text-xs text-primary mt-0.5">Current</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Employer Contributions</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Currently Vested</p>
            <p className="text-lg font-semibold tabular-nums text-primary">
              {formatCurrency(vestedAmount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact vesting indicator for participant cards
 */
export function VestingIndicator({
  percentage,
  className,
}: {
  percentage: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Progress value={percentage} className="h-2 w-16" />
      <span className="text-xs font-medium tabular-nums">{percentage}%</span>
    </div>
  );
}
