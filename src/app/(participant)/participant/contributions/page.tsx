'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Check,
  X,
  Info,
  Wallet,
  ThumbsUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import {
  useContributionProjectionForCurrentUser,
  useUpdateSelfContributionRates,
} from '@/api/generated/endpoints/participants/participants';
import { useGetSelfBalance } from '@/api/generated/endpoints/contribution-projections/contribution-projections';
import { formatCurrency, formatPercentFromBackend } from '@/lib/utils';
import { toast } from 'sonner';

function PageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contributions</h1>
        <p className="text-muted-foreground mt-1">
          Manage your retirement contribution rates and view projections
        </p>
      </div>
    </div>
  );
}

function CurrentRatesCard({
  preTaxRate,
  rothRate,
  employerRate,
  onEdit,
  loading,
}: {
  preTaxRate: number;
  rothRate: number;
  employerRate: number;
  onEdit: () => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48" />
        </CardContent>
      </Card>
    );
  }

  const totalRate = preTaxRate + rothRate;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Contribution Rates</CardTitle>
            <CardDescription>Percentage of salary contributed per paycheck</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Rates
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Employee Pre-Tax Deferral */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Employee Pre-Tax Deferral</Label>
            </div>
            <span className="text-2xl font-bold">{formatPercentFromBackend(preTaxRate)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Reduces taxable income now, taxed upon withdrawal
          </p>
        </div>

        {/* Employee Roth */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              <Label className="text-sm font-medium">Employee Roth</Label>
            </div>
            <span className="text-2xl font-bold">{formatPercentFromBackend(rothRate)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Taxed now, grows tax-free for retirement
          </p>
        </div>

        {/* Employer Contribution - display only */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-info" />
              <Label className="text-sm font-medium">Employer Contribution</Label>
            </div>
            <span className="text-2xl font-bold">{formatPercentFromBackend(employerRate)}</span>
          </div>
          <p className="text-xs text-muted-foreground">Set by your employer and not editable here.</p>
        </div>

        {/* Total Employee Rate */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">Total Employee Rate</Label>
            <span className="text-3xl font-bold text-primary">{formatPercentFromBackend(totalRate)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ContributionProjectionResponse {
  payPeriodsPerYear?: number;
  perPeriod?: {
    employeePreTax?: number;
    employeeRoth?: number;
    employee?: number;
    employeeTotal?: number;
    employer?: number;
    total?: number;
  };
  annual?: {
    employee?: number;
    employer?: number;
    total?: number;
  };
  rates?: {
    employeePreTaxPercent?: number;
    employeeRothPercent?: number;
    employerPercent?: number;
  };
  cappedAtIrsLimit?: boolean;
  irsLimits?: {
    employeeDeferralLimit?: number;
    totalAnnualLimit?: number;
    catchUpEligible?: boolean;
  };
}

function ContributionProjectionCard() {
  const { data: projectionData, isLoading, error } = useContributionProjectionForCurrentUser();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  if (error || !projectionData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contribution Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load contribution projections.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Extract nested values from the API response
  const projection = projectionData as ContributionProjectionResponse;
  const perPeriod = projection.perPeriod ?? {};
  const annual = projection.annual ?? {};
  const cappedAtIrsLimit = projection.cappedAtIrsLimit ?? false;

  const perPayPeriodPreTax = perPeriod.employeePreTax ?? 0;
  const perPayPeriodRoth = perPeriod.employeeRoth ?? 0;
  const perPayPeriodEmployer = perPeriod.employer ?? 0;
  const perPayPeriodTotal = perPeriod.total ?? perPayPeriodPreTax + perPayPeriodRoth + perPayPeriodEmployer;

  // Annual values - already capped by the backend when exceeding IRS limits
  const annualEmployee = annual.employee ?? 0;
  const annualEmployer = annual.employer ?? 0;
  const annualTotal = annual.total ?? annualEmployee + annualEmployer;

  // Per-period pre-tax/roth split is already done by the backend;
  // derive annual pre-tax vs roth from per-period ratio
  const employeePerPeriodTotal = perPayPeriodPreTax + perPayPeriodRoth;
  const preTaxRatio = employeePerPeriodTotal > 0 ? perPayPeriodPreTax / employeePerPeriodTotal : 0.5;
  const rothRatio = employeePerPeriodTotal > 0 ? perPayPeriodRoth / employeePerPeriodTotal : 0.5;
  const annualPreTax = annualEmployee * preTaxRatio;
  const annualRoth = annualEmployee * rothRatio;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Contribution Projection
        </CardTitle>
        <CardDescription>Estimated contributions based on current rates and salary</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Per Pay Period */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Per Pay Period</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Pre-Tax</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(perPayPeriodPreTax)}</p>
            </div>
            <div className="p-4 bg-success/5 rounded-lg border border-success/20">
              <p className="text-xs text-muted-foreground mb-1">Roth</p>
              <p className="text-xl font-bold text-success">{formatCurrency(perPayPeriodRoth)}</p>
            </div>
            <div className="p-4 bg-info/5 rounded-lg border border-info/20">
              <p className="text-xs text-muted-foreground mb-1">Employer Contribution</p>
              <p className="text-xl font-bold text-info">{formatCurrency(perPayPeriodEmployer)}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg border-2">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-xl font-bold">{formatCurrency(perPayPeriodTotal)}</p>
            </div>
          </div>
        </div>

        {/* Annual Projection */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Annual Projection</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Pre-Tax Deferrals</span>
              <span className="text-lg font-semibold">{formatCurrency(annualPreTax)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Roth</span>
              <span className="text-lg font-semibold">{formatCurrency(annualRoth)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Employer Contribution</span>
              <span className="text-lg font-semibold">{formatCurrency(annualEmployer)}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-3 mt-2">
              <span className="font-bold">Total Annual Contribution</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(annualTotal)}</span>
            </div>
          </div>
        </div>

        {/* IRS Limit Maximized - shown when backend has capped the projection */}
        {cappedAtIrsLimit && (
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <ThumbsUp className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              You are on track to maximize your contributions up to the IRS limit.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function YTDContributionsCard() {
  const { data: balanceData, isLoading, error } = useGetSelfBalance();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  if (error || !balanceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Year-to-Date Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load contribution balance.
          </p>
        </CardContent>
      </Card>
    );
  }

  const employeeTotal = balanceData.totalEmployeeContributions ?? 0;
  const employeePreTax = balanceData.totalEmployeePreTax ?? 0;
  const employeeRoth = balanceData.totalEmployeeRoth ?? 0;
  const employerTotal = balanceData.totalEmployerContributions ?? 0;
  const total = balanceData.totalContributions ?? employeeTotal + employerTotal;
  const vested = balanceData.totalVested ?? 0;
  const vestingPercent = total > 0 ? (vested / total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Year-to-Date Contributions</CardTitle>
        <CardDescription>Total contributions made this year</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4 bg-primary/5 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Total Contributions</p>
          <p className="text-4xl font-bold text-primary">{formatCurrency(total)}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Pre-Tax</p>
            <p className="text-lg font-semibold text-primary">{formatCurrency(employeePreTax)}</p>
          </div>
          <div className="text-center p-3 bg-success/5 rounded-lg border border-success/20">
            <p className="text-xs text-muted-foreground mb-1">Roth</p>
            <p className="text-lg font-semibold text-success">{formatCurrency(employeeRoth)}</p>
          </div>
          <div className="text-center p-3 bg-info/5 rounded-lg border border-info/20">
            <p className="text-xs text-muted-foreground mb-1">Employer</p>
            <p className="text-lg font-semibold text-info">{formatCurrency(employerTotal)}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Vested Balance</span>
            <span className="text-lg font-bold text-success">{formatCurrency(vested)}</span>
          </div>
          <Progress value={vestingPercent} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {formatPercentFromBackend(vestingPercent)} of total contributions vested
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function IRSLimitsCard() {
  // Updated 2026 IRS Contribution Limits
  const limits = {
    employeeDeferral: 24500,  // §402(g)
    catchUp: 8000,            // §414(v) standard catch-up
    superCatchUp: 11250,      // Age 60-63 additional catch-up
    totalAnnual: 72000,       // §415(c)
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-info" />
          2026 IRS Contribution Limits
        </CardTitle>
        <CardDescription>Federal limits for 401(k) contributions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Employee Deferral Limit</p>
            </div>
            <span className="text-xl font-bold">{formatCurrency(limits.employeeDeferral)}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Catch-Up Contribution</p>
              <p className="text-xs text-muted-foreground">Age 50 - 59 and 64+</p>
            </div>
            <span className="text-xl font-bold text-success">+{formatCurrency(limits.catchUp)}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Super Catch-Up Contribution</p>
              <p className="text-xs text-muted-foreground">Age 60 - 63</p>
            </div>
            <span className="text-xl font-bold text-success">+{formatCurrency(limits.superCatchUp)}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div>
              <p className="text-sm font-medium">Total Annual Limit</p>
              <p className="text-xs text-muted-foreground">Employee + Employer</p>
            </div>
            <span className="text-xl font-bold text-primary">{formatCurrency(limits.totalAnnual)}</span>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 bg-info/5 rounded-lg border border-info/20">
          <Info className="h-4 w-4 text-info flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            These limits are set annually by the IRS. Contact your plan administrator if you have questions about catch-up contributions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function EditRatesDialog({
  open,
  onOpenChange,
  currentPreTax,
  currentRoth,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPreTax: number;
  currentRoth: number;
}) {
  const queryClient = useQueryClient();
  const [preTaxRate, setPreTaxRate] = useState(currentPreTax.toString());
  const [rothRate, setRothRate] = useState(currentRoth.toString());
  const updateRatesMutation = useUpdateSelfContributionRates();

  // Reset form values when dialog opens with new values
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setPreTaxRate(currentPreTax.toString());
      setRothRate(currentRoth.toString());
    }
    onOpenChange(newOpen);
  };

  const preTax = parseFloat(preTaxRate) || 0;
  const roth = parseFloat(rothRate) || 0;
  const total = preTax + roth;
  const maxRate = 75;

  const handleSave = () => {
    if (preTax < 0 || roth < 0) {
      toast.error('Contribution rates cannot be negative');
      return;
    }

    if (total > maxRate) {
      toast.error(`Total deferral rate cannot exceed ${maxRate}%`);
      return;
    }

    updateRatesMutation.mutate(
      {
        data: {
          preTaxDeferralPercentage: preTax,
          rothDeferralPercentage: roth,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/participants/self/contribution-projection'] });
          queryClient.invalidateQueries({ queryKey: ['/projections/self/balance'] });
          toast.success('Your contribution rates have been updated successfully');
          onOpenChange(false);
        },
        onError: () => {
          toast.error('Unable to update contribution rates. Please try again.');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Contribution Rates</DialogTitle>
          <DialogDescription>
            Update your pre-tax deferral and Roth percentages. Changes will apply to future paychecks.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label htmlFor="preTax">Pre-Tax Deferral (%)</Label>
            <Input
              id="preTax"
              type="number"
              min="0"
              max={maxRate}
              step="1"
              value={preTaxRate}
              onChange={(e) => setPreTaxRate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Traditional 401(k) - reduces taxable income now
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="roth">Roth (%)</Label>
            <Input
              id="roth"
              type="number"
              min="0"
              max={maxRate}
              step="1"
              value={rothRate}
              onChange={(e) => setRothRate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Roth 401(k) - after-tax with tax-free growth
            </p>
          </div>

          <div className={`p-4 rounded-lg border-2 ${total > maxRate ? 'bg-destructive/5 border-destructive' : 'bg-primary/5 border-primary'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Total Deferral Rate</span>
              <span className={`text-2xl font-bold ${total > maxRate ? 'text-destructive' : 'text-primary'}`}>
                {formatPercentFromBackend(total)}
              </span>
            </div>
            {total > maxRate && (
              <p className="text-xs text-destructive mt-2">
                Reduce by {formatPercentFromBackend(total - maxRate)} to continue
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateRatesMutation.isPending || total > maxRate || total < 0}
          >
            <Check className="mr-2 h-4 w-4" />
            {updateRatesMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ContributionsPage() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { data: projectionData, isLoading, error, refetch } = useContributionProjectionForCurrentUser();

  // Extract rates from the nested API response structure
  const projection = (projectionData ?? {}) as ContributionProjectionResponse;
  const rates = projection.rates ?? {};
  const currentPreTax = rates.employeePreTaxPercent ?? 0;
  const currentRoth = rates.employeeRothPercent ?? 0;
  const employerRate = rates.employerPercent ?? 0;

  if (error) {
    return (
      <DashboardContent>
        <PageHeader />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-xl font-semibold mb-2">Unable to Load Contributions</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              There was an error loading your contribution data. Please try again.
            </p>
            <Button onClick={() => refetch()} size="lg">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <PageHeader />

      <div className="grid gap-6 lg:grid-cols-2">
        <CurrentRatesCard
          preTaxRate={currentPreTax}
          rothRate={currentRoth}
          employerRate={employerRate}
          onEdit={() => setEditDialogOpen(true)}
          loading={isLoading}
        />
        <ContributionProjectionCard />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <YTDContributionsCard />
        <IRSLimitsCard />
      </div>

      <EditRatesDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        currentPreTax={currentPreTax}
        currentRoth={currentRoth}
      />
    </DashboardContent>
  );
}
