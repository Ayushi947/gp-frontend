'use client';

import { useState } from 'react';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconExternalLink,
  IconHistory,
  IconLoader2,
  IconRefresh,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  KpiCard,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from '@/lib/toast';
import {
  useGetMyParticipantBalance,
  useGetMyParticipantPortfolioRows,
} from '@/api/generated/endpoints/investment-management/investment-management';
import { useGetParticipantPersonalDetails } from '@/api/generated/endpoints/participants/participants';
import type { FundRowDto } from '@/api/generated/models';
import { TransferWizard } from '@/components/transfers';

type TransferTab = 'fund-transfer' | 'external' | 'history';

export default function TransfersPage() {
  const [activeTab, setActiveTab] = useState<TransferTab>('fund-transfer');

  const { data: personalDetails } = useGetParticipantPersonalDetails();
  const participantId = personalDetails?.participantId || '';

  const {
    data: portfolioData,
    isLoading: isPortfolioLoading,
    isError: isPortfolioError,
    refetch: refetchPortfolio,
  } = useGetMyParticipantPortfolioRows();

  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
    refetch: refetchBalance,
  } = useGetMyParticipantBalance();

  const isLoading = isPortfolioLoading || isBalanceLoading;
  const isError = isPortfolioError || isBalanceError;

  const refetchAll = () => {
    refetchPortfolio();
    refetchBalance();
  };

  const allFunds: FundRowDto[] = portfolioData?.funds || [];
  const fundsWithHoldings = allFunds.filter((fund) => (fund.marketValue || 0) > 0);
  const totalBalance =
    balanceData?.totalInvestmentValue ??
    fundsWithHoldings.reduce((sum, fund) => sum + (fund.marketValue || 0), 0);

  const handleExternalTransfer = () => {
    toast.info('External transfer requests must be initiated by contacting support');
  };

  return (
    <DashboardContent>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transfers</h1>
          <p className="text-muted-foreground mt-1">
            Move funds between investments or request external transfers
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={refetchAll} disabled={isLoading}>
          <IconRefresh className={cn('h-4 w-4', isLoading && 'animate-spin')} />
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading portfolio data...</span>
        </div>
      )}

      {isError && (
        <Card className="border-destructive mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <IconAlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load portfolio</h3>
              <p className="text-muted-foreground mb-4">
                Unable to fetch your fund holdings. Please try again.
              </p>
              <Button onClick={refetchAll}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <KpiCard
              label="Total Account Balance"
              value={formatCurrency(totalBalance)}
              description="Across all invested funds"
            />
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TransferTab)}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="fund-transfer" className="text-sm">
                Fund-to-Fund
              </TabsTrigger>
              <TabsTrigger value="external" className="text-sm">
                External Transfer
              </TabsTrigger>
              <TabsTrigger value="history" className="text-sm">
                Transfer History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fund-transfer">
              <TransferWizard
                allFunds={allFunds}
                fundsWithHoldings={fundsWithHoldings}
                totalBalance={totalBalance}
                participantId={participantId}
                onViewHistory={() => setActiveTab('history')}
              />
            </TabsContent>

            <TabsContent value="external">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">
                    External Transfer / Rollover
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Transfer funds to or from an external retirement account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex gap-3">
                      <IconAlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium mb-2">External Transfer Types</p>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>
                            <strong className="text-foreground">Rollover In:</strong> Move
                            funds from another 401(k) or IRA into this account
                          </li>
                          <li>
                            <strong className="text-foreground">Rollover Out:</strong> Move
                            funds from this account to another 401(k) or IRA
                          </li>
                          <li>
                            <strong className="text-foreground">Direct Transfer:</strong> Move
                            funds directly between custodians
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-8 space-y-4">
                    <IconExternalLink className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-base font-semibold mb-2">
                        Contact Support for External Transfers
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                        External transfers require additional documentation and verification.
                        Please contact our support team to initiate the process.
                      </p>
                      <Button
                        onClick={handleExternalTransfer}
                        variant="outline"
                        className="h-10 px-6"
                      >
                        Contact Support
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <IconHistory className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base font-medium">Transfer History</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    View your past transfer requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <IconHistory className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-base font-semibold mb-2">No Transfer History</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      You haven&apos;t made any transfers yet. Your transfer history will
                      appear here once you submit a request.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardContent>
  );
}
