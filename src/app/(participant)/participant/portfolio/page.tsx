'use client';

import { useState, useEffect } from 'react';
import {
  IconWallet,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
  IconRefresh,
  IconChartPie,
  IconEdit,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, KpiCard } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useGetMyParticipantBalance, useGetActiveFundsWithMyAllocations } from '@/api/generated/endpoints/investment-management/investment-management';
import { useSaveMyElections, useValidateFundAllocation } from '@/api/generated/endpoints/fund-allocation/fund-allocation';
import { useGetParticipantPersonalDetails } from '@/api/generated/endpoints/participants/participants';
import { useGetEffectivePortfolio } from '@/api/generated/endpoints/participant-portfolio-assignment/participant-portfolio-assignment';
import type { InvestmentFundDTO, ParticipantInvestmentBalance, ModelPortfolioDTO } from '@/api/generated/models';
import { formatCurrency, formatPercentFromBackend, cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { customInstance } from '@/api/client';

/**
 * Page Header Component
 */
function PageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Portfolio</h1>
        <p className="text-muted-foreground">
          View your investment holdings and performance
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => toast.info('Rebalance', 'Feature coming soon')}>
          <IconChartPie className="mr-2 h-4 w-4" />
          Rebalance
        </Button>
      </div>
    </div>
  );
}

/**
 * Portfolio Summary Cards
 */
function PortfolioSummaryCards({ balance }: { balance: ParticipantInvestmentBalance | undefined }) {
  const totalValue = balance?.totalInvestmentValue ?? 0;
  const totalGainLoss = balance?.totalGainLoss ?? 0;
  const totalGainLossPercent = balance?.totalGainLossPercentage ?? 0;
  const sevenDayChange = balance?.portfolioSevenDayChange ?? 0;
  const sevenDayChangePercent = balance?.portfolioSevenDayChangePercentage ?? 0;
  const annualizedReturn = balance?.annualizedReturn ?? 0;

  const summaryCards = [
    {
      title: 'Total Value',
      value: formatCurrency(totalValue),
      description: 'Current market value',
      icon: IconWallet,
    },
    {
      title: 'Total Return',
      value: `${totalGainLoss >= 0 ? '+' : ''}${formatCurrency(totalGainLoss)}`,
      description: `${totalGainLossPercent >= 0 ? '+' : ''}${formatPercentFromBackend(totalGainLossPercent)} all time`,
      icon: totalGainLoss >= 0 ? IconTrendingUp : IconTrendingDown,
      valueClass: totalGainLoss >= 0 ? 'text-success' : 'text-error',
    },
    {
      title: '7-Day Change',
      value: `${sevenDayChange >= 0 ? '+' : ''}${formatCurrency(sevenDayChange)}`,
      description: `${sevenDayChangePercent >= 0 ? '+' : ''}${formatPercentFromBackend(sevenDayChangePercent)}`,
      icon: sevenDayChange >= 0 ? IconTrendingUp : IconTrendingDown,
      valueClass: sevenDayChange >= 0 ? 'text-success' : 'text-error',
    },
    {
      title: 'Annualized Return',
      value: `${annualizedReturn >= 0 ? '+' : ''}${formatPercentFromBackend(annualizedReturn)}`,
      description: 'Projected annual return',
      icon: IconTrendingUp,
      valueClass: annualizedReturn >= 0 ? 'text-success' : 'text-error',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {summaryCards.map((card) => (
        <KpiCard
          key={card.title}
          label={card.title}
          value={card.value}
          description={card.description}
          className={card.valueClass}
        />
      ))}
    </div>
  );
}

/**
 * Helper function to fetch portfolio allocations
 */
async function getPortfolioAllocations(portfolioId: string) {
  return customInstance<ModelPortfolioDTO['allocations']>({
    url: `/model-portfolios/${portfolioId}/allocations`,
    method: 'GET',
  });
}

/**
 * Holdings Table Component
 */
function HoldingsTable({ balance }: { balance: ParticipantInvestmentBalance | undefined }) {
  const { data: personalDetails } = useGetParticipantPersonalDetails();
  const participantId = personalDetails?.participantId || '';
  
  const { data: effectivePortfolio, isLoading: portfolioLoading } = useGetEffectivePortfolio(
    participantId,
    {
      query: {
        enabled: !!participantId,
      },
    }
  );

  const portfolioId = effectivePortfolio?.id;
  
  const { data: portfolioAllocations, isLoading: allocationsLoading } = useQuery({
    queryKey: ['portfolio-allocations', portfolioId],
    queryFn: () => getPortfolioAllocations(portfolioId!),
    enabled: !!portfolioId,
  });

  const { data: fundsData, isLoading: fundsLoading } = useGetActiveFundsWithMyAllocations();

  if (fundsLoading || portfolioLoading || allocationsLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const funds = (fundsData ?? []) as InvestmentFundDTO[];
  const allocations = portfolioAllocations || [];

  // Extract fund balances from the ParticipantInvestmentBalance
  const fundBalances = balance?.fundBalances ?? {};
  const fundMarketValues = balance?.fundMarketValue ?? {};
  const fundCurrentWeight = balance?.fundCurrentWeight ?? {};
  const fundAllTimeReturn = balance?.fundAllTimeReturnPercent ?? {};
  const fund7DayReturn = balance?.fundLast7DaysReturnPercent ?? {};
  const fundNames = balance?.fundNames ?? {};
  const fundTickers = balance?.fundTickers ?? {};

  // Helper to build a holding entry from a fund ID
  const buildHolding = (fundId: string, name: string, ticker: string, category: string, allocationPercent: number) => ({
    id: fundId,
    name,
    ticker,
    balance: (fundBalances as Record<string, number | undefined>)?.[fundId] ?? 0,
    marketValue: (fundMarketValues as Record<string, number | undefined>)?.[fundId] ?? 0,
    weight: (fundCurrentWeight as Record<string, number | undefined>)?.[fundId] ?? 0,
    allTimeReturn: (fundAllTimeReturn as Record<string, number | undefined>)?.[fundId] ?? 0,
    sevenDayReturn: (fund7DayReturn as Record<string, number | undefined>)?.[fundId] ?? 0,
    category,
    allocationPercent,
  });

  // Build holdings array - prioritize portfolio allocations if available
  let holdings: ReturnType<typeof buildHolding>[];
  if (allocations.length > 0) {
    holdings = allocations.map((alloc) => {
      const fundId = alloc.fundId || '';
      const fund = funds.find((f) => f.fundId === fundId);
      return buildHolding(
        fundId,
        alloc.fundName || fund?.fundName || 'Unknown Fund',
        alloc.ticker || fund?.ticker || '-',
        alloc.bucket || fund?.bucket || 'Other',
        Number(alloc.allocationPercentage || 0),
      );
    });
  } else if (funds.length > 0) {
    holdings = funds.map((fund) => buildHolding(
      fund.fundId ?? '',
      fund.fundName ?? 'Unknown Fund',
      fund.ticker ?? '-',
      fund.bucket ?? 'Other',
      Number(fund.allocationPercentage ?? 0),
    ));
  } else {
    holdings = Object.keys(fundBalances).map((fundId) => buildHolding(
      fundId,
      (fundNames as Record<string, string | undefined>)?.[fundId] ?? fundId,
      (fundTickers as Record<string, string | undefined>)?.[fundId] ?? '-',
      'Other',
      0,
    ));
  }

  // Append any funds from fundMarketValue that are missing from holdings
  // so displayed market values always sum to totalInvestmentValue
  const holdingIds = new Set(holdings.map(h => h.id));
  const marketValueKeys = Object.keys(fundMarketValues as Record<string, number>);
  for (const fundId of marketValueKeys) {
    if (!holdingIds.has(fundId)) {
      holdings.push(buildHolding(
        fundId,
        (fundNames as Record<string, string | undefined>)?.[fundId] ?? 'Unknown Fund',
        (fundTickers as Record<string, string | undefined>)?.[fundId] ?? '-',
        'Other',
        0,
      ));
    }
  }

  // Filter out holdings with no balance and no allocation
  const activeHoldings = holdings.filter(
    h => (h.balance > 0 || h.marketValue > 0 || h.allocationPercent > 0)
  );

  if (activeHoldings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Holdings</CardTitle>
          <CardDescription>Your investment fund allocations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <IconWallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Holdings Yet</h3>
            <p className="text-muted-foreground text-center">
              Your investment holdings will appear here once contributions are made.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Holdings</CardTitle>
        <CardDescription>Your investment fund allocations</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Fund</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Market Value</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Weight</th>
                <th className="text-right p-4 font-medium text-muted-foreground">7-Day</th>
                <th className="text-right p-4 font-medium text-muted-foreground">All Time</th>
              </tr>
            </thead>
            <tbody>
              {activeHoldings.map((holding) => (
                <tr key={holding.id} className="border-b hover:bg-muted/50">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{holding.name}</p>
                      <p className="text-sm text-muted-foreground">{holding.ticker}</p>
                    </div>
                  </td>
                  <td className="p-4 text-right tabular-nums font-medium">
                    {formatCurrency(holding.marketValue)}
                  </td>
                  <td className="p-4 text-right tabular-nums">
                    {formatPercentFromBackend(holding.weight)}
                  </td>
                  <td className="p-4 text-right tabular-nums">
                    <span className={holding.sevenDayReturn >= 0 ? 'text-success' : 'text-error'}>
                      {holding.sevenDayReturn >= 0 ? '+' : ''}{formatPercentFromBackend(holding.sevenDayReturn)}
                    </span>
                  </td>
                  <td className="p-4 text-right tabular-nums">
                    <span className={holding.allTimeReturn >= 0 ? 'text-success' : 'text-error'}>
                      {holding.allTimeReturn >= 0 ? '+' : ''}{formatPercentFromBackend(holding.allTimeReturn)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Asset Allocation Card
 */
function AssetAllocationCard({ balance }: { balance: ParticipantInvestmentBalance | undefined }) {
  const categoryWeights = balance?.categoryWeightsPercentage ?? {};
  const categoryMarketValues = balance?.categoryMarketValues ?? {};

  const categories = Object.keys(categoryWeights).map((category) => ({
    name: category,
    weight: (categoryWeights as Record<string, number | undefined>)?.[category] ?? 0,
    value: (categoryMarketValues as Record<string, number | undefined>)?.[category] ?? 0,
  }));

  const sortedCategories = categories.sort((a, b) => b.weight - a.weight);

  const categoryColors: Record<string, string> = {
    'Equity': 'bg-primary',
    'Fixed Income': 'bg-info',
    'Money Market': 'bg-success',
    'Real Estate': 'bg-warning',
    'International': 'bg-secondary',
    'Other': 'bg-muted-foreground',
  };

  if (sortedCategories.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Asset Allocation</CardTitle>
        <CardDescription>Diversification by asset category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedCategories.map((category) => (
            <div key={category.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{category.name}</span>
                <span className="text-sm tabular-nums">
                  {formatPercentFromBackend(category.weight)} ({formatCurrency(category.value)})
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${categoryColors[category.name] ?? 'bg-muted-foreground'} transition-all`}
                  style={{ width: `${category.weight}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Investment Election Card with Edit Dialog
 */
function InvestmentElectionCard() {
  const queryClient = useQueryClient();
  const { data: fundsData, isLoading, refetch } = useGetActiveFundsWithMyAllocations();
  const saveElectionsMutation = useSaveMyElections();
  const validateMutation = useValidateFundAllocation();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const funds = (fundsData ?? []) as InvestmentFundDTO[];
  const electedFunds = funds.filter((f) => Number(f.allocationPercentage ?? 0) > 0);

  // Initialize allocations when dialog opens
  useEffect(() => {
    if (isEditOpen && funds.length > 0) {
      const initial: Record<string, number> = {};
      funds.forEach((fund) => {
        if (fund.fundId) {
          initial[fund.fundId] = Number(fund.allocationPercentage ?? 0);
        }
      });
      setAllocations(initial);
    }
  }, [isEditOpen, funds]);

  // Calculate total allocation
  const totalAllocation = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  const isValid = Math.abs(totalAllocation - 100) < 0.01;

  const handleAllocationChange = (fundId: string, value: string) => {
    const numValue = Math.max(0, Math.min(100, Number(value) || 0));
    setAllocations((prev) => ({ ...prev, [fundId]: numValue }));
  };

  const handleQuickSet = (fundId: string, value: number) => {
    setAllocations((prev) => ({ ...prev, [fundId]: value }));
  };

  const handleEqualDistribute = () => {
    const activeFunds = funds.filter((f) => f.fundId && f.isActive !== false);
    if (activeFunds.length === 0) return;

    const equalShare = Math.floor(100 / activeFunds.length);
    const remainder = 100 - (equalShare * activeFunds.length);

    const newAllocations: Record<string, number> = {};
    activeFunds.forEach((fund, index) => {
      if (fund.fundId) {
        newAllocations[fund.fundId] = equalShare + (index === 0 ? remainder : 0);
      }
    });
    setAllocations(newAllocations);
  };

  const handleSave = async () => {
    if (!isValid) {
      toast.error('Invalid Allocation', 'Total allocation must equal 100%');
      return;
    }

    setIsSaving(true);
    try {
      // Filter out zero allocations and create the request body
      const electionData: Record<string, number> = {};
      Object.entries(allocations).forEach(([fundId, percentage]) => {
        if (percentage > 0) {
          electionData[fundId] = percentage;
        }
      });

      // Validate first
      const isValidAllocation = await validateMutation.mutateAsync({ data: electionData });
      if (!isValidAllocation) {
        toast.error('Validation Failed', 'Please ensure allocations are valid and sum to 100%');
        setIsSaving(false);
        return;
      }

      // Save elections
      await saveElectionsMutation.mutateAsync({ data: electionData });

      toast.success('Elections Saved', 'Your investment elections have been updated.');
      setIsEditOpen(false);

      // Refresh data
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/investment-management'] });
    } catch (error) {
      toast.error('Save Failed', 'Unable to save your elections. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Investment Elections</CardTitle>
            <CardDescription>How new contributions are allocated</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
            <IconEdit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          {electedFunds.length === 0 ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                No investment elections configured. New contributions will follow your plan&apos;s default allocation.
              </p>
              <Button size="sm" onClick={() => setIsEditOpen(true)}>
                Set Investment Elections
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {electedFunds.map((fund) => (
                <div key={fund.fundId} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="font-medium text-sm truncate">{fund.fundName}</p>
                    <p className="text-xs text-muted-foreground">{fund.ticker}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {formatPercentFromBackend(Number(fund.allocationPercentage ?? 0))}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Elections Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Investment Elections</DialogTitle>
            <DialogDescription>
              Set how your future contributions will be allocated across funds. Total must equal 100%.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {/* Quick Actions */}
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={handleEqualDistribute}>
                Distribute Equally
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAllocations({})}
              >
                Clear All
              </Button>
            </div>

            {/* Total Indicator */}
            <div className={cn(
              "flex items-center justify-between p-3 rounded-lg mb-4",
              isValid ? "bg-success/10 border border-success/30" : "bg-warning/10 border border-warning/30"
            )}>
              <span className="font-medium">Total Allocation</span>
              <span className={cn(
                "text-lg font-bold",
                isValid ? "text-success" : "text-warning"
              )}>
                {totalAllocation.toFixed(1)}%
                {isValid && <IconCheck className="inline ml-1 h-4 w-4" />}
              </span>
            </div>

            {/* Fund Allocations */}
            <div className="space-y-4">
              {funds.map((fund) => {
                const fundId = fund.fundId ?? '';
                const currentValue = allocations[fundId] ?? 0;

                return (
                  <div key={fundId} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{fund.fundName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{fund.ticker}</span>
                          {fund.bucket && (
                            <Badge variant="outline" className="text-xs">
                              {fund.bucket}
                            </Badge>
                          )}
                          {fund.isQdia && (
                            <Badge variant="secondary" className="text-xs">
                              QDIA
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={currentValue || ''}
                          onChange={(e) => handleAllocationChange(fundId, e.target.value)}
                          className="w-20 text-right"
                          placeholder="0"
                        />
                        <span className="text-sm text-muted-foreground w-4">%</span>
                      </div>
                    </div>

                    {/* Quick percentage buttons */}
                    <div className="flex gap-1 mt-2">
                      {[0, 10, 20, 25, 50].map((pct) => (
                        <Button
                          key={pct}
                          variant={currentValue === pct ? "default" : "ghost"}
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleQuickSet(fundId, pct)}
                        >
                          {pct}%
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!isValid || isSaving}>
              {isSaving ? 'Saving...' : 'Save Elections'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Portfolio Page
 */
export default function PortfolioPage() {
  const { data: balanceData, isLoading, error, refetch } = useGetMyParticipantBalance();

  if (isLoading) {
    return (
      <DashboardContent>
        <PageHeader />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64" />
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent>
        <PageHeader />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconAlertTriangle className="h-12 w-12 text-error mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Portfolio</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was an error loading your portfolio data.
            </p>
            <Button onClick={() => refetch()}>
              <IconRefresh className="mr-2 h-4 w-4" />
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

      {/* Summary Cards */}
      <PortfolioSummaryCards balance={balanceData} />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HoldingsTable balance={balanceData} />
        </div>
        <div className="space-y-6">
          <AssetAllocationCard balance={balanceData} />
          <InvestmentElectionCard />
        </div>
      </div>
    </DashboardContent>
  );
}
