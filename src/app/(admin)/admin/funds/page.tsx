'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useListAllFunds,
  useCreateFund,
  useUpdateFund,
  useDeleteFund,
} from '@/api/generated/endpoints/super-admin-investments/super-admin-investments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  IconChartPie,
  IconPlus,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconSearch,
  IconFilter,
  IconShield,
  IconX,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const FUND_TYPES = [
  { value: 'STOCK', label: 'Stock' },
  { value: 'BOND', label: 'Bond' },
  { value: 'BALANCED', label: 'Balanced' },
  { value: 'TARGET_DATE', label: 'Target Date' },
  { value: 'MONEY_MARKET', label: 'Money Market' },
  { value: 'STABLE_VALUE', label: 'Stable Value' },
  { value: 'OTHER', label: 'Other' },
];

const FUND_BUCKETS = [
  { value: 'CONSERVATIVE', label: 'Conservative' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'AGGRESSIVE', label: 'Aggressive' },
  { value: 'TARGET_DATE', label: 'Target Date' },
  { value: 'SPECIALTY', label: 'Specialty' },
  { value: 'OTHER', label: 'Other' },
];

const fundSchema = z.object({
  fundName: z.string().min(1, 'Fund name is required').max(200),
  fundType: z.string().min(1, 'Fund type is required'),
  cusip: z.string().optional().or(z.literal('')),
  bucket: z.string().optional().or(z.literal('')),
  ticker: z.string().optional().or(z.literal('')),
  expenseRatio: z.string().optional().or(z.literal('')),
  ytdReturn: z.string().optional().or(z.literal('')),
  oneYearReturn: z.string().optional().or(z.literal('')),
  fiveYearReturn: z.string().optional().or(z.literal('')),
  tenYearReturn: z.string().optional().or(z.literal('')),
  allocationPercentage: z.string().optional().or(z.literal('')),
  isQdia: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type FundFormData = z.infer<typeof fundSchema>;

// Reusable status badge with aligned chip colors (same as tenants table)
const StatusChip = ({ status }: { status: string | undefined }) => {
  if (!status) return null;

  const statusUpper = status.toUpperCase();

  const badgeConfig: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800 border-green-200',
    INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const className = badgeConfig[statusUpper] ?? 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <Badge variant="outline" className={className}>
      {statusUpper.charAt(0) + statusUpper.slice(1).toLowerCase()}
    </Badge>
  );
};

// Bucket chip with aligned colors per risk bucket
const BucketChip = ({ bucket }: { bucket: string | undefined }) => {
  if (!bucket) return null;

  const bucketUpper = bucket.toUpperCase();

  const bucketConfig: Record<string, string> = {
    CONSERVATIVE: 'bg-blue-100 text-blue-800 border-blue-200',
    MODERATE: 'bg-amber-100 text-amber-800 border-amber-200',
    AGGRESSIVE: 'bg-red-100 text-red-800 border-red-200',
    TARGET_DATE: 'bg-purple-100 text-purple-800 border-purple-200',
    SPECIALTY: 'bg-slate-100 text-slate-800 border-slate-200',
    OTHER: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const className = bucketConfig[bucketUpper] ?? bucketConfig.OTHER;
  const label =
    FUND_BUCKETS.find((b) => b.value === bucketUpper)?.label ||
    bucketUpper.charAt(0) + bucketUpper.slice(1).toLowerCase();

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
};

export default function AdminFundsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [bucketFilter, setBucketFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<any | null>(null);

  const { data: fundsData, isLoading, error, refetch } = useListAllFunds({
    page,
    size: 20,
  });

  // Debug: Log API response
  console.log('Funds API Response:', { fundsData, error, isLoading });

  const createMutation = useCreateFund({
    mutation: {
      onSuccess: () => {
        toast.success('Fund created successfully');
        setDialogOpen(false);
        form.reset();
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to create fund';
        toast.error(message);
      },
    },
  });

  const updateMutation = useUpdateFund({
    mutation: {
      onSuccess: () => {
        toast.success('Fund updated successfully');
        setDialogOpen(false);
        setEditingFund(null);
        form.reset();
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to update fund';
        toast.error(message);
      },
    },
  });

  const deleteMutation = useDeleteFund({
    mutation: {
      onSuccess: () => {
        toast.success('Fund deleted successfully');
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to delete fund';
        toast.error(message);
      },
    },
  });

  const form = useForm<FundFormData>({
    resolver: zodResolver(fundSchema),
    mode: 'onSubmit',
    defaultValues: {
      fundName: '',
      fundType: '',
      cusip: '',
      bucket: '',
      ticker: '',
      expenseRatio: '',
      ytdReturn: '',
      oneYearReturn: '',
      fiveYearReturn: '',
      tenYearReturn: '',
      allocationPercentage: '',
      isQdia: false,
      isActive: true,
    },
  });

  const funds = fundsData?.content || [];

  // Filter funds client-side based on search and filters
  const filteredFunds = funds.filter((fund: any) => {
    const matchesSearch = !search ||
      fund.fundName?.toLowerCase().includes(search.toLowerCase()) ||
      fund.ticker?.toLowerCase().includes(search.toLowerCase()) ||
      fund.cusip?.toLowerCase().includes(search.toLowerCase());

    const matchesType = !typeFilter || fund.fundType === typeFilter;
    const matchesBucket = !bucketFilter || fund.bucket === bucketFilter;

    return matchesSearch && matchesType && matchesBucket;
  });

  const handleOpenDialog = (fund: any = null) => {
    if (fund) {
      setEditingFund(fund);
      form.reset({
        fundName: fund.fundName || '',
        fundType: fund.fundType || '',
        cusip: fund.cusip || '',
        bucket: fund.bucket || '',
        ticker: fund.ticker || '',
        expenseRatio: fund.expenseRatio || '',
        ytdReturn: fund.ytdReturn || '',
        oneYearReturn: fund.oneYearReturn || '',
        fiveYearReturn: fund.fiveYearReturn || '',
        tenYearReturn: fund.tenYearReturn || '',
        allocationPercentage: fund.allocationPercentage || '',
        isQdia: fund.isQdia || false,
        isActive: fund.isActive !== false,
      });
    } else {
      setEditingFund(null);
      form.reset();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (data: FundFormData) => {
    const transformedData = {
      ...data,
      expenseRatio: data.expenseRatio ? parseFloat(data.expenseRatio) : undefined,
      ytdReturn: data.ytdReturn ? parseFloat(data.ytdReturn) : undefined,
      oneYearReturn: data.oneYearReturn ? parseFloat(data.oneYearReturn) : undefined,
      fiveYearReturn: data.fiveYearReturn ? parseFloat(data.fiveYearReturn) : undefined,
      tenYearReturn: data.tenYearReturn ? parseFloat(data.tenYearReturn) : undefined,
      allocationPercentage: data.allocationPercentage
        ? parseFloat(data.allocationPercentage)
        : undefined,
    };

    if (editingFund) {
      await updateMutation.mutateAsync({
        fundId: editingFund.fundId || editingFund.id,
        data: transformedData,
      });
    } else {
      await createMutation.mutateAsync({ data: transformedData });
    }
  };

  const handleDelete = (fund: any) => {
    const id = fund.fundId || fund.id;
    if (confirm('Are you sure you want to delete this fund? This action cannot be undone.')) {
      deleteMutation.mutate({ fundId: id });
    }
  };

  const handleToggleQdia = async (fund: any) => {
    await updateMutation.mutateAsync({
      fundId: fund.fundId || fund.id,
      data: {
        ...fund,
        isQdia: !fund.isQdia,
      },
    });
  };

  const handleToggleActive = async (fund: any) => {
    await updateMutation.mutateAsync({
      fundId: fund.fundId || fund.id,
      data: {
        ...fund,
        isActive: !fund.isActive,
      },
    });
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setBucketFilter('');
  };

  return (
    <div className="space-y-8 w-full">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <IconChartPie className="h-6 w-6" />
          Fund Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage investment funds and options across all plans
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Investment Funds</CardTitle>
              <CardDescription>Configure and manage investment fund options</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <IconPlus className="h-4 w-4 mr-2" />
              Add Fund
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ticker, or CUSIP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Fund Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Types</SelectItem>
                {FUND_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={bucketFilter} onValueChange={setBucketFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Bucket" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Buckets</SelectItem>
                {FUND_BUCKETS.map((bucket) => (
                  <SelectItem key={bucket.value} value={bucket.value}>
                    {bucket.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || typeFilter || bucketFilter) && (
              <Button variant="outline" size="icon" onClick={clearFilters}>
                <IconX className="h-4 w-4" />
              </Button>
            )}
          </div>

          {error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconX className="h-12 w-12 text-destructive mb-3" />
              <p className="text-sm text-destructive font-medium mb-2">
                Failed to load funds
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {(error as any)?.response?.data?.message || (error as any)?.message || 'Unknown error'}
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredFunds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconChartPie className="h-12 w-12 text-muted-foreground mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground">
                {search || typeFilter || bucketFilter
                  ? 'No funds found matching your filters'
                  : 'No funds configured yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fund Name</TableHead>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Bucket</TableHead>
                      <TableHead>Expense Ratio</TableHead>
                      <TableHead>YTD Return</TableHead>
                      <TableHead>1 Yr</TableHead>
                      <TableHead>5 Yr</TableHead>
                      <TableHead>10 Yr</TableHead>
                      <TableHead>QDIA</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFunds.map((fund: any) => (
                      <TableRow key={fund.fundId || fund.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{fund.fundName}</p>
                            {fund.cusip && (
                              <p className="text-xs text-muted-foreground font-mono">
                                CUSIP: {fund.cusip}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{fund.ticker || 'N/A'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {FUND_TYPES.find((t) => t.value === fund.fundType)?.label ||
                              fund.fundType ||
                              'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {fund.bucket ? (
                            <BucketChip bucket={fund.bucket} />
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {fund.expenseRatio ? (
                            <span className="text-sm">{fund.expenseRatio}%</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {fund.ytdReturn ? (
                            <span
                              className={`text-sm font-medium ${
                                parseFloat(fund.ytdReturn) >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {fund.ytdReturn}%
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {fund.oneYearReturn ? (
                            <span className="text-sm">{fund.oneYearReturn}%</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {fund.fiveYearReturn ? (
                            <span className="text-sm">{fund.fiveYearReturn}%</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {fund.tenYearReturn ? (
                            <span className="text-sm">{fund.tenYearReturn}%</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={fund.isQdia || false}
                              onCheckedChange={() => handleToggleQdia(fund)}
                            />
                            {fund.isQdia && (
                              <IconShield className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={fund.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenDialog(fund)}
                            >
                              <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(fund)}
                            >
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {fundsData && (fundsData.totalPages ?? 0) > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(fundsData.number ?? 0) * (fundsData.size ?? 20) + 1} to{' '}
                    {Math.min(
                      ((fundsData.number ?? 0) + 1) * (fundsData.size ?? 20),
                      fundsData.totalElements ?? 0,
                    )}{' '}
                    of {fundsData.totalElements ?? 0} funds
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
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= (fundsData.totalPages ?? 1) - 1}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFund ? 'Edit Fund' : 'Add New Fund'}</DialogTitle>
            <DialogDescription>
              {editingFund
                ? 'Update fund information and performance metrics'
                : 'Configure a new investment fund option'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="fundName">
                  Fund Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fundName"
                  {...form.register('fundName')}
                  placeholder="e.g., Vanguard Total Stock Market Index"
                />
                {form.formState.errors.fundName && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.fundName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="fundType">
                  Fund Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch('fundType')}
                  onValueChange={(value) => form.setValue('fundType', value)}
                >
                  <SelectTrigger id="fundType">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FUND_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.fundType && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.fundType.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="bucket">Bucket/Category</Label>
                <Select
                  value={form.watch('bucket') || ''}
                  onValueChange={(value) => form.setValue('bucket', value)}
                >
                  <SelectTrigger id="bucket">
                    <SelectValue placeholder="Select bucket..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FUND_BUCKETS.map((bucket) => (
                      <SelectItem key={bucket.value} value={bucket.value}>
                        {bucket.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ticker">Ticker Symbol</Label>
                <Input
                  id="ticker"
                  {...form.register('ticker')}
                  placeholder="e.g., VTSAX"
                  className="uppercase"
                />
              </div>

              <div>
                <Label htmlFor="cusip">CUSIP</Label>
                <Input
                  id="cusip"
                  {...form.register('cusip')}
                  placeholder="e.g., 922908769"
                />
              </div>

              <div>
                <Label htmlFor="expenseRatio">Expense Ratio (%)</Label>
                <Input
                  id="expenseRatio"
                  {...form.register('expenseRatio')}
                  placeholder="e.g., 0.04"
                  type="number"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="allocationPercentage">Default Allocation (%)</Label>
                <Input
                  id="allocationPercentage"
                  {...form.register('allocationPercentage')}
                  placeholder="e.g., 10.00"
                  type="number"
                  step="0.01"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Performance Returns (%)</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="ytdReturn">YTD</Label>
                  <Input
                    id="ytdReturn"
                    {...form.register('ytdReturn')}
                    placeholder="e.g., 12.5"
                    type="number"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="oneYearReturn">1 Year</Label>
                  <Input
                    id="oneYearReturn"
                    {...form.register('oneYearReturn')}
                    placeholder="e.g., 15.2"
                    type="number"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="fiveYearReturn">5 Year</Label>
                  <Input
                    id="fiveYearReturn"
                    {...form.register('fiveYearReturn')}
                    placeholder="e.g., 10.8"
                    type="number"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="tenYearReturn">10 Year</Label>
                  <Input
                    id="tenYearReturn"
                    {...form.register('tenYearReturn')}
                    placeholder="e.g., 9.5"
                    type="number"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isQdia" className="flex items-center gap-2">
                    <IconShield className="h-4 w-4" />
                    Qualified Default Investment Alternative (QDIA)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Mark this fund as a QDIA option for automatic enrollment
                  </p>
                </div>
                <Switch
                  id="isQdia"
                  checked={form.watch('isQdia')}
                  onCheckedChange={(checked) => form.setValue('isQdia', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Active Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Active funds are available for participant selection
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={form.watch('isActive')}
                  onCheckedChange={(checked) => form.setValue('isActive', checked)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingFund(null);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingFund ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>{editingFund ? 'Update Fund' : 'Create Fund'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
