'use client';

import { useState } from 'react';
import {
  IconWallet,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconRefresh,
  IconSearch,
  IconChartPie,
  IconTrendingUp,
  IconTrendingDown,
  IconInfoCircle,
  IconShieldCheck,
  IconAlertTriangle,
  IconEye,
  IconSettings,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useGetGroupedFunds } from '@/api/generated/endpoints/fund-master-controller/fund-master-controller';
import {
  useListPortfolios,
  useDeletePortfolio,
  useGetQdiaPortfolio,
} from '@/api/generated/endpoints/model-portfolios/model-portfolios';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import type { ModelPortfolioDTO, PortfolioFundGroupDTO } from '@/api/generated/models';

// Allocation bar colors
const ALLOCATION_COLORS = [
  'bg-green-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-yellow-500',
  'bg-red-500',
];

// Risk profile colors
const riskProfileColors: Record<string, { bg: string; text: string }> = {
  'Capital Preservation': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Conservative': { bg: 'bg-green-100', text: 'text-green-700' },
  'Moderate': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'Growth': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Aggressive Growth': { bg: 'bg-red-100', text: 'text-red-700' },
};

/**
 * Page Header
 */
function PageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Investments</h1>
        <p className="text-muted-foreground">
          Manage investment funds and model portfolios
        </p>
      </div>
    </div>
  );
}

/**
 * Stats Cards
 */
function StatsCards({
  fundsCount,
  portfoliosCount,
  qdiaName,
}: {
  fundsCount: number;
  portfoliosCount: number;
  qdiaName: string | undefined;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <IconWallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available Funds</p>
              <p className="text-2xl font-bold">{fundsCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <IconChartPie className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Model Portfolios</p>
              <p className="text-2xl font-bold">{portfoliosCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
              <IconShieldCheck className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">QDIA Portfolio</p>
              <p className="text-lg font-semibold truncate">{qdiaName ?? 'Not Set'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Funds Tab Content
 */
function FundsTab({ fundGroups }: { fundGroups: PortfolioFundGroupDTO[] | undefined }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!fundGroups || fundGroups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <IconWallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Funds Available</h3>
          <p className="text-muted-foreground">
            Investment funds will appear here once configured.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search funds..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Fund Groups */}
      {fundGroups.map((group, groupIndex) => {
        const filteredFunds = (group.funds ?? []).filter(
          (fund) =>
            fund.fundName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fund.ticker?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredFunds.length === 0 && searchTerm) return null;

        return (
          <Card key={group.categoryName ?? groupIndex}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div
                  className={cn(
                    'w-3 h-3 rounded-full',
                    ALLOCATION_COLORS[groupIndex % ALLOCATION_COLORS.length]
                  )}
                />
                {group.categoryName}
              </CardTitle>
              {group.defaultAllocation !== undefined && (
                <CardDescription>
                  Default Allocation: {formatPercent(group.defaultAllocation)}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fund Name</TableHead>
                    <TableHead>Ticker</TableHead>
                    <TableHead className="text-right">Expense Ratio</TableHead>
                    <TableHead className="text-right">YTD Return</TableHead>
                    <TableHead className="text-right">1Y Return</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(searchTerm ? filteredFunds : group.funds ?? []).map((fund, fundIndex) => (
                    <TableRow key={fund.fundId ?? fundIndex}>
                      <TableCell className="font-medium">{fund.fundName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{fund.ticker}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {fund.expenseRatio ?? '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {fund.ytdReturn ? (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1',
                              parseFloat(fund.ytdReturn) >= 0 ? 'text-success' : 'text-destructive'
                            )}
                          >
                            {parseFloat(fund.ytdReturn) >= 0 ? (
                              <IconTrendingUp className="h-4 w-4" />
                            ) : (
                              <IconTrendingDown className="h-4 w-4" />
                            )}
                            {fund.ytdReturn}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {fund.oneYearReturn ?? '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Portfolio Card Component
 */
function PortfolioCard({
  portfolio,
  isQdia,
  onView,
  onEdit,
  onDelete,
}: {
  portfolio: ModelPortfolioDTO;
  isQdia: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const riskColors = riskProfileColors[portfolio.riskProfile ?? ''] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
  const allocations = portfolio.allocations ?? [];

  return (
    <Card className={cn(isQdia && 'border-info')}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{portfolio.portfolioName}</h3>
              {isQdia && (
                <Badge variant="outline" className="border-info text-info">
                  <IconShieldCheck className="h-3 w-3 mr-1" />
                  QDIA
                </Badge>
              )}
            </div>
            <Badge className={cn(riskColors.bg, riskColors.text, 'font-medium')}>
              {portfolio.riskProfile}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onView}>
              <IconEye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <IconEdit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
              <IconTrash className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {portfolio.description && (
          <p className="text-sm text-muted-foreground mb-4">{portfolio.description}</p>
        )}

        {/* Allocation Bar */}
        {allocations.length > 0 && (
          <div className="space-y-3">
            <div className="h-4 rounded-full overflow-hidden flex">
              {allocations.map((allocation, i) => (
                <div
                  key={allocation.fundId ?? i}
                  className={cn('h-full transition-all', ALLOCATION_COLORS[i % ALLOCATION_COLORS.length])}
                  style={{ width: `${allocation.allocationPercentage ?? 0}%` }}
                  title={`${allocation.fundName}: ${allocation.allocationPercentage}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {allocations.slice(0, 4).map((allocation, i) => (
                <div key={allocation.fundId ?? i} className="flex items-center gap-1 text-xs">
                  <div
                    className={cn('w-2 h-2 rounded-full', ALLOCATION_COLORS[i % ALLOCATION_COLORS.length])}
                  />
                  <span className="truncate max-w-24">{allocation.fundName}</span>
                  <span className="text-muted-foreground">{allocation.allocationPercentage}%</span>
                </div>
              ))}
              {allocations.length > 4 && (
                <span className="text-xs text-muted-foreground">+{allocations.length - 4} more</span>
              )}
            </div>
          </div>
        )}

        {allocations.length === 0 && (
          <div className="p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
            No allocations configured
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Portfolios Tab Content
 */
function PortfoliosTab({
  portfolios,
  qdiaPortfolioId,
  onRefresh,
}: {
  portfolios: ModelPortfolioDTO[] | undefined;
  qdiaPortfolioId: string | undefined;
  onRefresh: () => void;
}) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<ModelPortfolioDTO | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingPortfolioId, setDeletingPortfolioId] = useState<string | null>(null);

  const deletePortfolioMutation = useDeletePortfolio();

  const handleView = (portfolio: ModelPortfolioDTO) => {
    setSelectedPortfolio(portfolio);
    setViewDialogOpen(true);
  };

  const handleEdit = (portfolio: ModelPortfolioDTO) => {
    toast.info('Coming soon', 'Portfolio editing will be available in a future update.');
  };

  const handleDelete = (portfolioId: string) => {
    setDeletingPortfolioId(portfolioId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingPortfolioId) {
      try {
        await deletePortfolioMutation.mutateAsync({ portfolioId: deletingPortfolioId });
        toast.success('Portfolio deleted', 'The portfolio has been removed.');
        onRefresh();
      } catch {
        toast.error('Delete failed', 'Unable to delete portfolio. Please try again.');
      }
    }
    setDeleteConfirmOpen(false);
    setDeletingPortfolioId(null);
  };

  if (!portfolios || portfolios.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <IconChartPie className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Portfolios Configured</h3>
          <p className="text-muted-foreground mb-4">
            Create model portfolios for your participants to choose from.
          </p>
          <Button>
            <IconPlus className="h-4 w-4 mr-2" />
            Create Portfolio
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{portfolios.length} portfolio(s) available</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <IconPlus className="h-4 w-4 mr-2" />
            Create Portfolio
          </Button>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {portfolios.map((portfolio) => (
          <PortfolioCard
            key={portfolio.id}
            portfolio={portfolio}
            isQdia={portfolio.id === qdiaPortfolioId}
            onView={() => handleView(portfolio)}
            onEdit={() => handleEdit(portfolio)}
            onDelete={() => handleDelete(portfolio.id ?? '')}
          />
        ))}
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedPortfolio?.portfolioName}</DialogTitle>
            <DialogDescription>{selectedPortfolio?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Risk Profile:</span>
              <Badge>{selectedPortfolio?.riskProfile}</Badge>
            </div>
            {selectedPortfolio?.isQdia && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 border border-info/30">
                <IconShieldCheck className="h-5 w-5 text-info flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-info">Qualified Default Investment Alternative</p>
                  <p className="text-muted-foreground">
                    This portfolio meets DOL QDIA requirements under ERISA.
                  </p>
                </div>
              </div>
            )}
            <div>
              <h4 className="font-medium mb-2">Allocations</h4>
              <div className="space-y-2">
                {selectedPortfolio?.allocations?.map((allocation, i) => (
                  <div key={allocation.fundId ?? i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn('w-3 h-3 rounded-full', ALLOCATION_COLORS[i % ALLOCATION_COLORS.length])}
                      />
                      <span>{allocation.fundName}</span>
                    </div>
                    <span className="font-medium">{allocation.allocationPercentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Portfolio?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this model portfolio. Participants currently using this portfolio will need to select a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Investments Page
 */
export default function InvestmentsPage() {
  const [activeTab, setActiveTab] = useState('portfolios');

  // Fetch data
  const { data: fundGroups, isLoading: isLoadingFunds, error: fundsError, refetch: refetchFunds } = useGetGroupedFunds();
  const { data: portfoliosData, isLoading: isLoadingPortfolios, error: portfoliosError, refetch: refetchPortfolios } = useListPortfolios();
  const { data: qdiaPortfolio } = useGetQdiaPortfolio();

  const portfolios = portfoliosData?.content ?? [];
  const fundsCount = fundGroups?.reduce((sum, group) => sum + (group.funds?.length ?? 0), 0) ?? 0;

  const handleRefresh = () => {
    refetchFunds();
    refetchPortfolios();
  };

  // Loading state
  if (isLoadingFunds || isLoadingPortfolios) {
    return (
      <DashboardContent>
        <PageHeader />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </DashboardContent>
    );
  }

  // Error state
  if (fundsError || portfoliosError) {
    return (
      <DashboardContent>
        <PageHeader />
        <Card>
          <CardContent className="py-12 text-center">
            <IconAlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Investment Data</h3>
            <p className="text-muted-foreground mb-4">
              There was an error loading the investment information.
            </p>
            <Button onClick={handleRefresh}>
              <IconRefresh className="h-4 w-4 mr-2" />
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

      {/* Stats */}
      <StatsCards
        fundsCount={fundsCount}
        portfoliosCount={portfolios.length}
        qdiaName={qdiaPortfolio?.portfolioName}
      />

      {/* QDIA Notice */}
      {!qdiaPortfolio && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <IconAlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning">No QDIA Portfolio Set</p>
            <p className="text-xs text-muted-foreground mt-1">
              You should designate a Qualified Default Investment Alternative (QDIA) to comply with DOL regulations.
              The QDIA will be used for participants who don&apos;t make an investment election.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="portfolios" className="gap-2">
            <IconChartPie className="h-4 w-4" />
            Model Portfolios
          </TabsTrigger>
          <TabsTrigger value="funds" className="gap-2">
            <IconWallet className="h-4 w-4" />
            Investment Funds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolios" className="mt-6">
          <PortfoliosTab
            portfolios={portfolios}
            qdiaPortfolioId={qdiaPortfolio?.id}
            onRefresh={refetchPortfolios}
          />
        </TabsContent>

        <TabsContent value="funds" className="mt-6">
          <FundsTab fundGroups={fundGroups} />
        </TabsContent>
      </Tabs>
    </DashboardContent>
  );
}
