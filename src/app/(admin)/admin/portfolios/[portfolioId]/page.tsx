'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetPortfolio,
  useUpdatePortfolio,
  useSetAllocations,
} from '@/api/generated/endpoints/model-portfolios/model-portfolios';
import { useListAllFunds } from '@/api/generated/endpoints/super-admin-investments/super-admin-investments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Loader2, TrendingUp, AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const RISK_PROFILES = ['CONSERVATIVE', 'MODERATE', 'BALANCED', 'GROWTH', 'AGGRESSIVE'];

const allocationSchema = z.object({
  fundId: z.string().min(1, 'Fund is required'),
  fundName: z.string().min(1, 'Fund name is required'),
  fundTicker: z.string().optional(),
  targetAllocation: z.number().min(0, 'Must be 0 or greater').max(100, 'Cannot exceed 100%'),
});

const portfolioSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  riskProfile: z.enum(['CONSERVATIVE', 'MODERATE', 'BALANCED', 'GROWTH', 'AGGRESSIVE']),
  active: z.boolean(),
  allocations: z.array(allocationSchema).min(1, 'At least one fund allocation is required'),
});

type PortfolioForm = z.infer<typeof portfolioSchema>;

export default function EditPortfolioPage() {
  const router = useRouter();
  const params = useParams();
  const portfolioId = params.portfolioId as string;
  const queryClient = useQueryClient();

  const { data: portfolio, isLoading } = useGetPortfolio(portfolioId);

  // Fetch available funds for dropdown
  const { data: fundsData, isLoading: isLoadingFunds } = useListAllFunds({ page: 0, size: 100 });
  const availableFunds = fundsData?.content || [];

  const updatePortfolioMutation = useUpdatePortfolio({
    mutation: {
      onSuccess: () => {
        toast.success('Portfolio details updated successfully');
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to update portfolio';
        toast.error(message);
      },
    },
  });

  const updateAllocationsMutation = useSetAllocations({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/model-portfolios'] });
        queryClient.invalidateQueries({ queryKey: [`/model-portfolios/${portfolioId}`] });
        toast.success('Portfolio saved successfully');
        router.push('/admin/portfolios');
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to update allocations';
        toast.error(message);
      },
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    reset,
  } = useForm<PortfolioForm>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      name: '',
      description: '',
      riskProfile: 'BALANCED',
      active: true,
      allocations: [{ fundId: '', fundName: '', fundTicker: '', targetAllocation: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'allocations',
  });

  useEffect(() => {
    if (portfolio) {
      reset({
        name: portfolio.portfolioName || '',
        description: portfolio.description || '',
        riskProfile: (portfolio.riskProfile || 'BALANCED') as
          | 'CONSERVATIVE'
          | 'MODERATE'
          | 'BALANCED'
          | 'GROWTH'
          | 'AGGRESSIVE',
        active: portfolio.isActive ?? true,
        allocations:
          portfolio.allocations && portfolio.allocations.length > 0
            ? portfolio.allocations.map((allocation: any) => ({
                fundId: allocation.fundId || '',
                fundName: allocation.fundName || '',
                fundTicker: allocation.fundTicker || '',
                targetAllocation: allocation.allocationPercentage ?? allocation.targetAllocation ?? 0,
              }))
            : [{ fundId: '', fundName: '', fundTicker: '', targetAllocation: 0 }],
      });
    }
  }, [portfolio, reset]);

  const allocations = watch('allocations');

  const total = useMemo(() => {
    return allocations.reduce((sum, allocation) => {
      const value = Number(allocation.targetAllocation) || 0;
      return sum + value;
    }, 0);
  }, [allocations]);

  // Get already selected fund IDs to prevent duplicates
  const selectedFundIds = useMemo(() => {
    return allocations.map(a => a.fundId).filter(Boolean);
  }, [allocations]);

  const handleFundSelect = (index: number, fundId: string) => {
    const selectedFund = availableFunds.find((f: any) => (f.fundId || f.id) === fundId);
    if (selectedFund) {
      setValue(`allocations.${index}.fundId`, fundId);
      setValue(`allocations.${index}.fundName`, selectedFund.fundName || '');
      setValue(`allocations.${index}.fundTicker`, selectedFund.ticker || '');
    }
  };

  const onSubmit = async (data: PortfolioForm) => {

    if (total !== 100) {
      toast.error('Total allocation must equal 100%');
      return;
    }

    try {
      await updatePortfolioMutation.mutateAsync({
        portfolioId,
        data: {
          portfolioName: data.name,
          portfolioCode: portfolio?.portfolioCode || data.name.toUpperCase().replace(/\s+/g, '_'),
          description: data.description || '',
          riskProfile: data.riskProfile,
        },
      });

      await updateAllocationsMutation.mutateAsync({
        portfolioId,
        data: data.allocations.reduce(
          (acc, allocation) => {
            acc[allocation.fundId] = allocation.targetAllocation;
            return acc;
          },
          {} as { [key: string]: number },
        ),
      });
    } catch (error) {
      // Handled by mutations
    }
  };

  const addAllocation = () => {
    append({ fundId: '', fundName: '', fundTicker: '', targetAllocation: 0 });
  };

  const removeAllocation = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const isValid = total === 100;

  if (isLoading) {
    return (
      <div className="space-y-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button onClick={() => router.push('/admin/portfolios')} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Edit Portfolio</h1>
            <p className="text-sm text-muted-foreground mt-1">Loading portfolio details...</p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button onClick={() => router.push('/admin/portfolios')} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Edit Portfolio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update portfolio template and fund allocations
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Details</CardTitle>
            <CardDescription>Basic information about the portfolio template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Portfolio Name <span className="text-destructive">*</span>
                </Label>
                <Input id="name" {...register('name')} placeholder="e.g., Conservative Growth" />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskProfile">
                  Risk Profile <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('riskProfile')}
                  onValueChange={(value) => setValue('riskProfile', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_PROFILES.map((profile) => (
                      <SelectItem key={profile} value={profile}>
                        {profile.charAt(0) + profile.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.riskProfile && (
                  <p className="text-sm text-destructive">{errors.riskProfile.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe the investment strategy and target participants..."
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-1">
                <Label>Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Active portfolios are available for participant selection
                </p>
              </div>
              <Switch
                checked={watch('active')}
                onCheckedChange={(checked) => setValue('active', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Fund Allocations</CardTitle>
                <CardDescription>
                  Define target allocation percentages for each fund
                </CardDescription>
              </div>
              <Button type="button" onClick={addAllocation} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Fund
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`p-4 rounded-lg border-2 ${
                isValid
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                  : total > 100
                  ? 'bg-destructive/5 border-destructive'
                  : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Total Allocation</span>
                <span
                  className={`text-2xl font-bold ${
                    isValid
                      ? 'text-green-600 dark:text-green-400'
                      : total > 100
                      ? 'text-destructive'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {total.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={Math.min(total, 100)}
                className={`h-2 ${isValid ? '[&>div]:bg-green-600' : total > 100 ? '[&>div]:bg-destructive' : '[&>div]:bg-amber-600'}`}
              />
              <div className="flex items-center gap-2 mt-2">
                {isValid ? (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Allocations are balanced
                  </p>
                ) : total > 100 ? (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Reduce by {(total - 100).toFixed(1)}% to continue
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Add {(100 - total).toFixed(1)}% more to reach 100%
                  </p>
                )}
              </div>
            </div>

            {isLoadingFunds ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading funds...</span>
              </div>
            ) : availableFunds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No funds available. Please create funds first.</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/admin/funds')}
                >
                  Go to Fund Management
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 border rounded-lg space-y-4 bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Fund #{index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAllocation(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                        <Label>
                          Select Fund <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={allocations[index]?.fundId || ''}
                          onValueChange={(value) => handleFundSelect(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a fund..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFunds
                              .filter((fund: any) => {
                                const fundId = fund.fundId || fund.id;
                                // Show fund if it's not selected OR if it's the current field's selection
                                return !selectedFundIds.includes(fundId) || fundId === allocations[index]?.fundId;
                              })
                              .map((fund: any) => (
                                <SelectItem key={fund.fundId || fund.id} value={fund.fundId || fund.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{fund.fundName}</span>
                                    {fund.ticker && (
                                      <span className="text-xs text-muted-foreground font-mono">
                                        ({fund.ticker})
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {errors.allocations?.[index]?.fundId && (
                          <p className="text-sm text-destructive">
                            {errors.allocations[index]?.fundId?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Fund Name</Label>
                        <Input
                          value={allocations[index]?.fundName || ''}
                          readOnly
                          className="bg-muted"
                          placeholder="Selected fund name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Ticker</Label>
                        <Input
                          value={allocations[index]?.fundTicker || ''}
                          readOnly
                          className="bg-muted font-mono"
                          placeholder="Ticker"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`allocations.${index}.targetAllocation`}>
                          Target Allocation (%) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          {...register(`allocations.${index}.targetAllocation`, {
                            valueAsNumber: true,
                          })}
                          placeholder="0.00"
                        />
                        {errors.allocations?.[index]?.targetAllocation && (
                          <p className="text-sm text-destructive">
                            {errors.allocations[index]?.targetAllocation?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {errors.allocations && !Array.isArray(errors.allocations) && (
              <p className="text-sm text-destructive">{errors.allocations.message}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/portfolios')}
            disabled={updatePortfolioMutation.isPending || updateAllocationsMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              updatePortfolioMutation.isPending || updateAllocationsMutation.isPending || !isValid
            }
          >
            {updatePortfolioMutation.isPending || updateAllocationsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
