'use client';

import { IconScale, IconInfoCircle } from '@tabler/icons-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getCurrentIRSLimits, proRateLimit } from '@/config/retirement';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface LimitRowProps {
  label: string;
  value: number;
  description?: string;
  highlight?: boolean;
  fullYearValue?: number;
}

function LimitRow({ label, value, description, highlight, fullYearValue }: LimitRowProps) {
  const isProRated = fullYearValue != null && fullYearValue !== value;
  return (
    <div
      className={cn(
        'flex items-center justify-between py-2',
        highlight && 'bg-primary/5 -mx-2 px-2 rounded-md'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {description && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <IconInfoCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="text-right">
        <span className="text-sm font-medium tabular-nums">{formatCurrency(value)}</span>
        {isProRated && (
          <span className="text-xs text-muted-foreground ml-1">(full: {formatCurrency(fullYearValue)})</span>
        )}
      </div>
    </div>
  );
}

interface IRSLimitsCardProps {
  /**
   * Highlight the employee deferral limit
   */
  highlightDeferral?: boolean;

  /**
   * Show extended limits (catch-up, total)
   */
  extended?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether this is a short plan year (company started plan mid-year).
   * When true, 401(a)(17) and 415(c) limits are pro-rated.
   */
  isShortPlanYear?: boolean;

  /**
   * Number of months the plan is active in the short plan year (1-12).
   * Only used when isShortPlanYear is true.
   */
  activeMonths?: number;
}

/**
 * Display current IRS contribution limits
 */
export function IRSLimitsCard({
  highlightDeferral = false,
  extended = false,
  className,
  isShortPlanYear = false,
  activeMonths = 12,
}: IRSLimitsCardProps) {
  const limits = getCurrentIRSLimits();

  // Pro-rate 415(c) and 401(a)(17) for short plan years
  // 402(g) and 414(v) catch-up are NOT pro-rated per IRS rules
  const effectiveTotalContribution = isShortPlanYear
    ? proRateLimit(limits.TOTAL_CONTRIBUTION, activeMonths)
    : limits.TOTAL_CONTRIBUTION;
  const effectiveCompensationLimit = isShortPlanYear
    ? proRateLimit(limits.COMPENSATION_LIMIT, activeMonths)
    : limits.COMPENSATION_LIMIT;

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <IconScale className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">2026 IRS Contribution Limits</CardTitle>
          {isShortPlanYear && (
            <Badge variant="outline" className="ml-2 text-xs">
              Short Plan Year ({activeMonths} months)
            </Badge>
          )}
        </div>
        <CardDescription>
          {isShortPlanYear
            ? 'Some limits are pro-rated for short plan year (plan started mid-year)'
            : 'Maximum annual contribution limits set by the IRS'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 divide-y">
          <LimitRow
            label="Employee Deferral Limit"
            value={limits.EMPLOYEE_DEFERRAL}
            description="Maximum pre-tax or Roth 401(k) contribution (Section 402(g)) — not pro-rated for short plan years"
            highlight={highlightDeferral}
          />
          <LimitRow
            label="Catch-Up (Age 50+)"
            value={limits.CATCH_UP_50_PLUS}
            description="Additional contribution for participants age 50 and older — not pro-rated for short plan years"
          />
          {extended && (
            <>
              <LimitRow
                label="Enhanced Catch-Up (Age 60-63)"
                value={limits.CATCH_UP_60_63}
                description="SECURE 2.0 enhanced catch-up for ages 60-63"
              />
              <LimitRow
                label="Total Annual Limit"
                value={effectiveTotalContribution}
                fullYearValue={isShortPlanYear ? limits.TOTAL_CONTRIBUTION : undefined}
                description="Maximum total contribution including employer (Section 415(c)) — pro-rated for short plan years"
              />
              <LimitRow
                label="Compensation Limit"
                value={effectiveCompensationLimit}
                fullYearValue={isShortPlanYear ? limits.COMPENSATION_LIMIT : undefined}
                description="Maximum compensation used for contribution calculations (Section 401(a)(17)) — pro-rated for short plan years"
              />
              <LimitRow
                label="HCE Threshold"
                value={limits.HCE_THRESHOLD}
                description="Prior year compensation threshold for Highly Compensated Employee status"
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for sidebars
 */
export function IRSLimitsCompact({
  className,
  isShortPlanYear = false,
  activeMonths = 12,
}: {
  className?: string;
  isShortPlanYear?: boolean;
  activeMonths?: number;
}) {
  const limits = getCurrentIRSLimits();
  const effectiveTotal = isShortPlanYear
    ? proRateLimit(limits.TOTAL_CONTRIBUTION, activeMonths)
    : limits.TOTAL_CONTRIBUTION;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-medium">2026 IRS Limits</h4>
        {isShortPlanYear && (
          <Badge variant="outline" className="text-[10px] px-1 py-0">
            Short Year
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-1">
          <p className="text-muted-foreground">Deferral</p>
          <p className="font-medium tabular-nums">{formatCurrency(limits.EMPLOYEE_DEFERRAL)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">Catch-up 50+</p>
          <p className="font-medium tabular-nums">{formatCurrency(limits.CATCH_UP_50_PLUS)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">Total</p>
          <p className="font-medium tabular-nums">{formatCurrency(effectiveTotal)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">HCE</p>
          <p className="font-medium tabular-nums">{formatCurrency(limits.HCE_THRESHOLD)}</p>
        </div>
      </div>
    </div>
  );
}
