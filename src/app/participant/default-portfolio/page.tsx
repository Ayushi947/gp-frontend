'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useListPortfolios } from '@/api/generated/endpoints/model-portfolios/model-portfolios';
import { useElectPortfolio } from '@/api/generated/endpoints/participant-portfolio-assignment/participant-portfolio-assignment';
import { useGetParticipantPersonalDetails } from '@/api/generated/endpoints/participants/participants';
import { ArrowRight, Loader2, Info, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from 'sonner';
import { ROUTES } from '@/config/routes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function DefaultPortfolioPage() {
  const router = useRouter();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');

  // Get participantId from authenticated user's personal details
  const { data: participantDetails, isLoading: isLoadingParticipant } = useGetParticipantPersonalDetails();
  const participantId = participantDetails?.participantId || null;

  const { data: portfoliosData, isLoading: isLoadingPortfolios } = useListPortfolios({
    page: 0,
    size: 100,
  });

  const electPortfolioMutation = useElectPortfolio({
    mutation: {
      onSuccess: () => {
        toast.success('Portfolio selected successfully');
        router.push(ROUTES.PARTICIPANT.DASHBOARD);
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to select portfolio';
        toast.error(message);
      },
    },
  });

  // Filter for active portfolios client-side
  const allPortfolios = portfoliosData?.content || [];
  const portfolios = allPortfolios.filter((p: any) => p.isActive !== false);
  const selectedPortfolio = portfolios.find((p: any) => p.id === selectedPortfolioId);

  const handleContinueToDashboard = async () => {
    if (!selectedPortfolioId) {
      toast.error('Please select a portfolio');
      return;
    }

    if (!participantId) {
      toast.error('Unable to identify participant. Please try refreshing the page.');
      return;
    }

    try {
      await electPortfolioMutation.mutateAsync({
        participantId: participantId,
        portfolioId: selectedPortfolioId,
      });
    } catch (error) {
      // Handled by mutation
    }
  };

  const isLoading = isLoadingParticipant || isLoadingPortfolios;

  if (isLoading) {
    return (
      <OnboardingLayout
        title="Select Portfolio"
        description="Choose a pre-configured investment portfolio"
        maxWidth="2xl"
      >
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading portfolios...</p>
        </div>
      </OnboardingLayout>
    );
  }

  const getRiskProfileColor = (riskProfile: string) => {
    switch (riskProfile) {
      case 'CONSERVATIVE':
        return 'text-blue-600';
      case 'MODERATE':
        return 'text-green-600';
      case 'BALANCED':
        return 'text-yellow-600';
      case 'GROWTH':
        return 'text-orange-600';
      case 'AGGRESSIVE':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <OnboardingLayout
      title="Select Portfolio"
      description="Choose a pre-configured investment portfolio"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Choose Your Portfolio
            </CardTitle>
            <CardDescription>
              Select a model portfolio that matches your investment goals and risk tolerance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio-select">Portfolio Selection</Label>
              <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                <SelectTrigger id="portfolio-select">
                  <SelectValue placeholder="Select a portfolio..." />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map((portfolio: any) => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>
                      <div className="flex items-center gap-2">
                        <span>{portfolio.name}</span>
                        <span className={`text-xs ${getRiskProfileColor(portfolio.riskProfile)}`}>
                          ({portfolio.riskProfile.charAt(0) + portfolio.riskProfile.slice(1).toLowerCase()})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPortfolio && (
              <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-lg">{selectedPortfolio.portfolioName}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedPortfolio.description || 'No description available'}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      selectedPortfolio.riskProfile === 'CONSERVATIVE'
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : selectedPortfolio.riskProfile === 'MODERATE'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : selectedPortfolio.riskProfile === 'BALANCED'
                        ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                        : selectedPortfolio.riskProfile === 'GROWTH'
                        ? 'bg-orange-100 text-orange-700 border-orange-200'
                        : 'bg-red-100 text-red-700 border-red-200'
                    }`}
                  >
                    {selectedPortfolio.riskProfile
                      ? selectedPortfolio.riskProfile.charAt(0) +
                        selectedPortfolio.riskProfile.slice(1).toLowerCase()
                      : 'Unknown'}
                  </span>
                </div>

                {selectedPortfolio.allocations && selectedPortfolio.allocations.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Fund Allocations</h5>
                    <div className="space-y-2">
                      {selectedPortfolio.allocations.map((allocation: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-background rounded border"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{allocation.fundName}</p>
                          </div>
                          <span className="font-bold text-primary">
                            {allocation.allocationPercentage ?? allocation.targetAllocation ?? 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
          <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Model portfolios are professionally designed investment strategies that automatically
            maintain target allocations across multiple funds. You can change your selection at any
            time from your dashboard.
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleContinueToDashboard}
            disabled={!selectedPortfolioId || !participantId || electPortfolioMutation.isPending || isLoading}
            size="default"
            className="min-w-[140px] text-sm"
          >
            {electPortfolioMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving Portfolio...
              </>
            ) : (
              <>
                Continue to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
