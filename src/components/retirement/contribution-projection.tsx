'use client';

import { useState, useMemo } from 'react';
import { IconCalculator, IconTrendingUp, IconAlertTriangle } from '@tabler/icons-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { getCurrentIRSLimits, getMaxContribution } from '@/config/retirement';
import { formatCurrency, cn } from '@/lib/utils';

interface ContributionProjectionProps {
  salary: number;
  age: number;
  currentContributionPercent: number;
  employerMatchPercent: number;
  employerMatchCap: number;
  className?: string;
  onContributionChange?: (percent: number) => void;
}

/**
 * Interactive contribution projection calculator
 */
export function ContributionProjection({
  salary: initialSalary,
  age: initialAge,
  currentContributionPercent,
  employerMatchPercent,
  employerMatchCap,
  className,
  onContributionChange,
}: ContributionProjectionProps) {
  const [salary, setSalary] = useState(initialSalary);
  const [age, setAge] = useState(initialAge);
  const [contributionPercent, setContributionPercent] = useState(currentContributionPercent);

  const limits = getCurrentIRSLimits();
  const maxAllowed = getMaxContribution(age);

  const projection = useMemo(() => {
    const annualEmployeeContribution = (salary * contributionPercent) / 100;

    // Calculate employer match
    const matchablePercent = Math.min(contributionPercent, employerMatchCap);
    const annualEmployerMatch = (salary * matchablePercent * employerMatchPercent) / 100 / 100;

    // Check against IRS limits
    const cappedEmployeeContribution = Math.min(annualEmployeeContribution, maxAllowed);
    const totalContribution = cappedEmployeeContribution + annualEmployerMatch;
    const cappedTotal = Math.min(totalContribution, limits.TOTAL_CONTRIBUTION);

    // Calculate per-pay-period (assuming 26 pay periods)
    const payPeriods = 26;
    const perPayPeriod = cappedEmployeeContribution / payPeriods;

    // Calculate catch-up eligibility
    const catchUpEligible = age >= 50;
    const enhancedCatchUpEligible = age >= 60 && age <= 63;

    // Calculate remaining room
    const remainingDeferral = maxAllowed - cappedEmployeeContribution;
    const remainingTotal = limits.TOTAL_CONTRIBUTION - cappedTotal;

    // Warnings
    const warnings: string[] = [];
    if (annualEmployeeContribution > maxAllowed) {
      warnings.push(`Employee contribution exceeds ${age >= 50 ? 'catch-up adjusted ' : ''}limit`);
    }
    if (salary > limits.COMPENSATION_LIMIT) {
      warnings.push('Salary exceeds annual compensation limit for calculations');
    }

    return {
      annualEmployeeContribution: cappedEmployeeContribution,
      annualEmployerMatch,
      totalContribution: cappedTotal,
      perPayPeriod,
      catchUpEligible,
      enhancedCatchUpEligible,
      remainingDeferral,
      remainingTotal,
      warnings,
      percentOfLimit: (cappedEmployeeContribution / maxAllowed) * 100,
    };
  }, [salary, age, contributionPercent, employerMatchPercent, employerMatchCap, maxAllowed, limits]);

  const handleContributionChange = (value: number[]) => {
    const newPercent = value[0] ?? contributionPercent;
    setContributionPercent(newPercent);
    onContributionChange?.(newPercent);
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <IconCalculator className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Contribution Projection</CardTitle>
        </div>
        <CardDescription>
          Estimate your annual 401(k) contributions and employer match
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Controls */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="salary">Annual Salary</Label>
            <Input
              id="salary"
              type="number"
              value={salary}
              onChange={(e) => setSalary(Number(e.target.value))}
              className="tabular-nums"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              min={18}
              max={100}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="tabular-nums"
            />
          </div>
        </div>

        {/* Contribution Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Your Contribution Rate</Label>
            <span className="text-lg font-semibold tabular-nums">{contributionPercent}%</span>
          </div>
          <Slider
            value={[contributionPercent]}
            onValueChange={handleContributionChange}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>{Math.round(projection.percentOfLimit)}% of IRS limit</span>
            <span>100%</span>
          </div>
        </div>

        {/* Catch-up Badges */}
        {(projection.catchUpEligible || projection.enhancedCatchUpEligible) && (
          <div className="flex gap-2 flex-wrap">
            {projection.catchUpEligible && (
              <Badge variant="secondary">
                <IconTrendingUp className="mr-1 h-3 w-3" />
                Catch-up Eligible (50+)
              </Badge>
            )}
            {projection.enhancedCatchUpEligible && (
              <Badge variant="default">
                <IconTrendingUp className="mr-1 h-3 w-3" />
                Enhanced Catch-up (60-63)
              </Badge>
            )}
          </div>
        )}

        {/* Warnings */}
        {projection.warnings.length > 0 && (
          <div className="rounded-md bg-warning/10 p-3 space-y-1">
            {projection.warnings.map((warning, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-warning">
                <IconAlertTriangle className="h-4 w-4 shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Results Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Your Annual Contribution</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatCurrency(projection.annualEmployeeContribution)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(projection.perPayPeriod)}/pay period
            </p>
          </div>
          <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Employer Match</p>
            <p className="text-xl font-semibold tabular-nums text-success">
              {formatCurrency(projection.annualEmployerMatch)}
            </p>
            <p className="text-xs text-muted-foreground">
              {employerMatchPercent}% up to {employerMatchCap}%
            </p>
          </div>
          <div className="space-y-1 p-3 bg-primary/10 rounded-lg">
            <p className="text-xs text-muted-foreground">Total Annual</p>
            <p className="text-xl font-semibold tabular-nums text-primary">
              {formatCurrency(projection.totalContribution)}
            </p>
            <p className="text-xs text-muted-foreground">
              Employee + Employer
            </p>
          </div>
        </div>

        {/* Remaining Limits */}
        <div className="pt-2 border-t space-y-2">
          <p className="text-sm font-medium">Remaining Contribution Room</p>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Employee Deferral</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(Math.max(0, projection.remainingDeferral))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total (415 limit)</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(Math.max(0, projection.remainingTotal))}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact contribution summary for dashboards
 */
export function ContributionSummary({
  employeeContribution,
  employerMatch,
  totalContribution,
  limit,
  className,
}: {
  employeeContribution: number;
  employerMatch: number;
  totalContribution: number;
  limit: number;
  className?: string;
}) {
  const percentOfLimit = (totalContribution / limit) * 100;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total Contributions</span>
        <span className="font-semibold tabular-nums">{formatCurrency(totalContribution)}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full flex">
          <div
            className="bg-primary transition-all"
            style={{ width: `${(employeeContribution / limit) * 100}%` }}
          />
          <div
            className="bg-success transition-all"
            style={{ width: `${(employerMatch / limit) * 100}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span>Employee: {formatCurrency(employeeContribution)}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span>Employer: {formatCurrency(employerMatch)}</span>
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        {percentOfLimit.toFixed(0)}% of {formatCurrency(limit)} limit
      </p>
    </div>
  );
}
