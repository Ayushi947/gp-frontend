'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetGroupedFunds } from '@/api/generated/endpoints/fund-master-controller/fund-master-controller';
import { useSaveMyElections } from '@/api/generated/endpoints/fund-allocation/fund-allocation';
import { ArrowRight, ArrowLeft, Info, Plus, Minus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from 'sonner';
import { ROUTES } from '@/config/routes';
import { Progress } from '@/components/ui/progress';

interface FundAllocation {
  fundId: string;
  percentage: number;
}

export default function CustomPortfolioPage() {
  const router = useRouter();
  const [allocations, setAllocations] = useState<FundAllocation[]>([]);

  const { data: fundGroups, isLoading } = useGetGroupedFunds();

  const saveElectionsMutation = useSaveMyElections({
    mutation: {
      onSuccess: () => {
        toast.success('Portfolio saved successfully');
        router.push(ROUTES.PARTICIPANT.DASHBOARD);
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to save portfolio';
        toast.error(message);
      },
    },
  });

  const totalAllocation = allocations.reduce((sum, a) => sum + a.percentage, 0);
  const isValidAllocation = totalAllocation === 100;

  const handleAllocationChange = (fundId: string, value: string) => {
    const percentage = Math.min(100, Math.max(0, parseFloat(value) || 0));

    setAllocations((prev) => {
      const existing = prev.find((a) => a.fundId === fundId);
      if (existing) {
        if (percentage === 0) {
          return prev.filter((a) => a.fundId !== fundId);
        }
        return prev.map((a) => (a.fundId === fundId ? { ...a, percentage } : a));
      }
      if (percentage > 0) {
        return [...prev, { fundId, percentage }];
      }
      return prev;
    });
  };

  const adjustAllocation = (fundId: string, delta: number) => {
    const current = getAllocation(fundId);
    const newValue = Math.min(100, Math.max(0, current + delta));
    handleAllocationChange(fundId, newValue.toString());
  };

  const getAllocation = (fundId: string) => {
    return allocations.find((a) => a.fundId === fundId)?.percentage || 0;
  };

  const handleSave = async () => {
    if (!isValidAllocation) {
      toast.error('Total allocation must equal 100%');
      return;
    }

    try {
      // Transform array to object map as required by SaveMyElectionsBody
      const electionsMap = allocations.reduce(
        (acc, a) => {
          acc[a.fundId] = a.percentage;
          return acc;
        },
        {} as { [key: string]: number },
      );

      await saveElectionsMutation.mutateAsync({
        data: electionsMap,
      });
    } catch (error) {
      // Handled by mutation
    }
  };

  const handleBack = () => {
    router.push(ROUTES.PARTICIPANT_ENROLLMENT.CHOOSE_INVESTMENT_PATH);
  };

  if (isLoading) {
    return (
      <OnboardingLayout
        title="Custom Portfolio"
        description="Choose your own investments and set your allocations"
        maxWidth="2xl"
      >
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading available funds...</p>
        </div>
      </OnboardingLayout>
    );
  }

  const allFunds =
    fundGroups?.flatMap((group: any) =>
      group.funds?.filter((fund: any) => fund.isActive).map((fund: any) => ({
        ...fund,
        categoryName: group.categoryName,
      }))
    ) || [];

  return (
    <OnboardingLayout
      title="Custom Portfolio"
      description="Choose your own investments and set your allocations"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        <Card
          className={`${
            totalAllocation === 100
              ? 'border-green-500'
              : totalAllocation > 100
              ? 'border-destructive'
              : 'border-amber-500'
          }`}
        >
          <CardContent className="py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Allocation</span>
                <span
                  className={`text-2xl font-bold ${
                    totalAllocation === 100
                      ? 'text-green-600'
                      : totalAllocation > 100
                      ? 'text-destructive'
                      : 'text-amber-600'
                  }`}
                >
                  {totalAllocation.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={Math.min(totalAllocation, 100)}
                className={`h-2 ${
                  isValidAllocation
                    ? '[&>div]:bg-green-600'
                    : totalAllocation > 100
                    ? '[&>div]:bg-destructive'
                    : '[&>div]:bg-amber-600'
                }`}
              />
              {totalAllocation !== 100 && (
                <p
                  className={`text-sm ${
                    totalAllocation > 100 ? 'text-destructive' : 'text-amber-600'
                  }`}
                >
                  {totalAllocation > 100
                    ? `Reduce by ${(totalAllocation - 100).toFixed(1)}% to continue`
                    : `Add ${(100 - totalAllocation).toFixed(1)}% more to continue`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {allFunds.map((fund: any) => {
            const allocation = getAllocation(fund.fundId);
            return (
              <Card
                key={fund.fundId}
                className={`transition-colors ${allocation > 0 ? 'border-primary bg-primary/5' : ''}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{fund.ticker}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted">
                          {fund.categoryName}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {fund.fundName || 'Fund'}
                      </p>
                      {fund.expenseRatio !== undefined && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Expense Ratio: {fund.expenseRatio}%
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => adjustAllocation(fund.fundId, -5)}
                        disabled={allocation === 0}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="relative w-20">
                        <Input
                          type="number"
                          step="0.1"
                          min={0}
                          max={100}
                          value={allocation || ''}
                          onChange={(e) => handleAllocationChange(fund.fundId, e.target.value)}
                          className="text-center pr-6 h-8"
                          placeholder="0"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                          %
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => adjustAllocation(fund.fundId, 5)}
                        disabled={totalAllocation >= 100}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {allFunds.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No funds available at this time.</p>
            </CardContent>
          </Card>
        )}

        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
          <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Your allocations must total exactly 100%. You can adjust these at any time from your
            dashboard. Consider diversifying across different asset classes to manage risk.
          </p>
        </div>

        <div className="flex justify-center gap-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={saveElectionsMutation.isPending}
            size="default"
            className="min-w-[140px] text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValidAllocation || saveElectionsMutation.isPending}
            size="default"
            className="min-w-[140px] text-sm"
          >
            {saveElectionsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save & Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
