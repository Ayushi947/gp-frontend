'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useListPortfolios,
  useDeletePortfolio,
} from '@/api/generated/endpoints/model-portfolios/model-portfolios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const RISK_PROFILES = ['CONSERVATIVE', 'MODERATE', 'BALANCED', 'GROWTH', 'AGGRESSIVE'];

export default function ModelPortfoliosPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [riskProfileFilter, setRiskProfileFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState<{ id: string; name: string } | null>(
    null
  );

  const { data: portfoliosData, isLoading, error, refetch } = useListPortfolios({
    page,
    size: pageSize,
  });

  const deletePortfolioMutation = useDeletePortfolio({
    mutation: {
      onSuccess: () => {
        toast.success('Portfolio deleted successfully');
        setDeleteDialogOpen(false);
        setPortfolioToDelete(null);
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to delete portfolio';
        toast.error(message);
      },
    },
  });

  const handleDelete = () => {
    if (portfolioToDelete) {
      deletePortfolioMutation.mutate({ portfolioId: portfolioToDelete.id });
    }
  };

  const openDeleteDialog = (id: string, name: string) => {
    setPortfolioToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleEdit = (portfolioId: string) => {
    router.push(`/admin/portfolios/${portfolioId}`);
  };

  const handleCreate = () => {
    router.push('/admin/portfolios/create');
  };

  const getRiskProfileBadgeColor = (riskProfile: string) => {
    switch (riskProfile) {
      case 'CONSERVATIVE':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'MODERATE':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'BALANCED':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'GROWTH':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'AGGRESSIVE':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const allPortfolios = portfoliosData?.content || [];
  const portfolios = allPortfolios.filter((portfolio: any) => {
    const matchesSearch =
      !searchQuery ||
      portfolio.portfolioName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      portfolio.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRiskProfile =
      riskProfileFilter === 'all' || portfolio.riskProfile === riskProfileFilter;
    return matchesSearch && matchesRiskProfile;
  });
  const totalPages = portfoliosData?.totalPages || 0;

  if (error) {
    return (
      <div className="space-y-8 w-full">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Model Portfolios</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage investment portfolio templates</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">Failed to load portfolios</p>
            <p className="text-sm text-muted-foreground">
              {(error as any)?.response?.data?.message || 'An error occurred'}
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Model Portfolios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage investment portfolio templates for participants
          </p>
        </div>
        <Button onClick={handleCreate} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Create Portfolio
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Templates</CardTitle>
          <CardDescription>
            Pre-configured investment portfolios with target allocations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search portfolios by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={riskProfileFilter} onValueChange={setRiskProfileFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Profiles</SelectItem>
                {RISK_PROFILES.map((profile) => (
                  <SelectItem key={profile} value={profile}>
                    {profile.charAt(0) + profile.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : portfolios.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 border-2 border-dashed rounded-lg">
              <TrendingUp className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-lg font-medium">No portfolios found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || riskProfileFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first portfolio template to get started'}
                </p>
              </div>
              {!searchQuery && riskProfileFilter === 'all' && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Portfolio
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Risk Profile</TableHead>
                      <TableHead className="text-center">Allocations</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolios.map((portfolio: any) => (
                      <TableRow key={portfolio.id}>
                        <TableCell className="font-medium">{portfolio.portfolioName}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskProfileBadgeColor(
                              portfolio.riskProfile
                            )}`}
                          >
                            {portfolio.riskProfile?.charAt(0) +
                              portfolio.riskProfile?.slice(1).toLowerCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {portfolio.allocations?.length || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              portfolio.isActive
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {portfolio.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {portfolio.createdAt
                            ? format(new Date(portfolio.createdAt), 'MMM d, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(portfolio.id)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(portfolio.id, portfolio.portfolioName)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Portfolio</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{portfolioToDelete?.name}</strong>? This
              action cannot be undone and may affect participants assigned to this portfolio.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletePortfolioMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePortfolioMutation.isPending}
            >
              {deletePortfolioMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Portfolio'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
