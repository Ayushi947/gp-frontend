'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useListProviders,
  useCreateProvider,
  useUpdateProvider,
  useActivateProvider,
  useDeactivateProvider,
} from '@/api/generated/endpoints/service-provider-management/service-provider-management';
import { ServiceProviderDTOProviderType } from '@/api/generated/models';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import {
  IconBuilding,
  IconPlus,
  IconEdit,
  IconBan,
  IconCircleCheck,
  IconLoader2,
  IconSearch,
  IconBriefcase,
  IconMail,
  IconPhone,
  IconMapPin,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const PROVIDER_TYPES = [
  { value: 'TPA', label: 'TPA (Third Party Administrator)' },
  { value: 'RECORDKEEPER', label: 'Recordkeeper' },
  { value: 'CUSTODIAN', label: 'Custodian' },
  { value: 'TRUSTEE', label: 'Trustee' },
  { value: 'INVESTMENT_ADVISOR', label: 'Investment Advisor' },
  { value: 'AUDITOR', label: 'Auditor' },
  { value: 'LEGAL', label: 'Legal Counsel' },
  { value: 'CONSULTANT', label: 'Consultant' },
  { value: 'EDUCATION_PROVIDER', label: 'Education Provider' },
  { value: 'OTHER', label: 'Other' },
];

const providerSchema = z.object({
  providerName: z.string().min(1, 'Provider name is required').max(200),
  providerType: z.enum([
    'TPA',
    'RECORDKEEPER',
    'CUSTODIAN',
    'TRUSTEE',
    'INVESTMENT_ADVISOR',
    'AUDITOR',
    'LEGAL',
    'CONSULTANT',
    'EDUCATION_PROVIDER',
    'OTHER',
  ]),
  ein: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

type ProviderForm = z.infer<typeof providerSchema>;

export default function ServiceProvidersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const { data: providersData, isLoading, refetch } = useListProviders({
    page,
    size: 10,
  });

  const createMutation = useCreateProvider({
    mutation: {
      onSuccess: () => {
        toast.success('Service provider created successfully');
        setDialogOpen(false);
        reset();
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to create provider';
        toast.error(message);
      },
    },
  });

  const updateMutation = useUpdateProvider({
    mutation: {
      onSuccess: () => {
        toast.success('Service provider updated successfully');
        setDialogOpen(false);
        setEditingProvider(null);
        reset();
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to update provider';
        toast.error(message);
      },
    },
  });

  const activateMutation = useActivateProvider({
    mutation: {
      onSuccess: () => {
        toast.success('Service provider activated');
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to activate provider';
        toast.error(message);
      },
    },
  });

  const deactivateMutation = useDeactivateProvider({
    mutation: {
      onSuccess: () => {
        toast.success('Service provider deactivated');
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to deactivate provider';
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
    reset,
  } = useForm<ProviderForm>({
    resolver: zodResolver(providerSchema),
    mode: 'onSubmit',
    defaultValues: {
      providerName: '',
      providerType: 'TPA',
      contactEmail: '',
    },
  });

  const onSubmit = async (data: ProviderForm) => {
    try {
      if (editingProvider) {
        await updateMutation.mutateAsync({
          providerId: editingProvider.id,
          data: {
            ...data,
            contactEmail: data.contactEmail || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          data: {
            ...data,
            contactEmail: data.contactEmail || undefined,
          },
        });
      }
    } catch (error) {
      // Handled by mutation
    }
  };

  const handleEdit = (provider: any) => {
    setEditingProvider(provider);
    reset({
      providerName: provider.providerName || '',
      providerType: provider.providerType || 'TPA',
      ein: provider.ein || '',
      contactName: provider.contactName || '',
      contactEmail: provider.contactEmail || '',
      contactPhone: provider.contactPhone || '',
      addressLine1: provider.addressLine1 || '',
      addressLine2: provider.addressLine2 || '',
      city: provider.city || '',
      state: provider.state || '',
      postalCode: provider.postalCode || '',
      country: provider.country || '',
      paymentTerms: provider.paymentTerms || '',
      notes: provider.notes || '',
    });
    setDialogOpen(true);
  };

  const handleToggleActive = (provider: any) => {
    if (provider.isActive) {
      deactivateMutation.mutate({ providerId: provider.id });
    } else {
      activateMutation.mutate({ providerId: provider.id });
    }
  };

  const allProviders = providersData?.content || [];
  const providers = allProviders.filter((provider: any) => {
    const matchesSearch =
      !search ||
      provider.providerName?.toLowerCase().includes(search.toLowerCase()) ||
      provider.contactName?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || provider.providerType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 w-full">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <IconBriefcase className="h-6 w-6" />
          Service Providers
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage third-party service providers and vendors
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Provider List</CardTitle>
              <CardDescription>All registered service providers</CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingProvider(null);
                reset({
                  providerName: '',
                  providerType: 'TPA',
                  contactEmail: '',
                });
                setDialogOpen(true);
              }}
            >
              <IconPlus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by provider name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="All provider types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All types</SelectItem>
                {PROVIDER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : providers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconBriefcase className="h-12 w-12 text-muted-foreground mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground">
                {search || typeFilter ? 'No providers found matching your filters' : 'No service providers added yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.map((provider: any) => (
                      <TableRow key={provider.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{provider.providerName}</p>
                            {provider.ein && (
                              <p className="text-xs text-muted-foreground">EIN: {provider.ein}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {PROVIDER_TYPES.find((t) => t.value === provider.providerType)?.label ||
                              provider.providerType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {provider.contactName && <p className="font-medium">{provider.contactName}</p>}
                            {provider.contactEmail && (
                              <p className="text-muted-foreground flex items-center gap-1">
                                <IconMail className="h-3 w-3" />
                                {provider.contactEmail}
                              </p>
                            )}
                            {provider.contactPhone && (
                              <p className="text-muted-foreground flex items-center gap-1">
                                <IconPhone className="h-3 w-3" />
                                {provider.contactPhone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {provider.city && provider.state ? (
                            <div className="text-sm flex items-center gap-1">
                              <IconMapPin className="h-3 w-3 text-muted-foreground" />
                              {provider.city}, {provider.state}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={provider.isActive ? 'default' : 'secondary'}>
                            {provider.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(provider)}
                            >
                              <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggleActive(provider)}
                              disabled={
                                activateMutation.isPending || deactivateMutation.isPending
                              }
                            >
                              {provider.isActive ? (
                                <IconBan className="h-4 w-4 text-destructive" />
                              ) : (
                                <IconCircleCheck className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {providersData && (providersData.totalPages ?? 0) > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(providersData.number ?? 0) * (providersData.size ?? 10) + 1} to{' '}
                    {Math.min(
                      ((providersData.number ?? 0) + 1) * (providersData.size ?? 10),
                      providersData.totalElements ?? 0,
                    )}{' '}
                    of {providersData.totalElements ?? 0} providers
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
                      disabled={page >= (providersData.totalPages ?? 1) - 1}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? 'Edit Service Provider' : 'Add Service Provider'}
            </DialogTitle>
            <DialogDescription>
              {editingProvider
                ? 'Update service provider information'
                : 'Add a new service provider to your system'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="providerName">
                  Provider Name <span className="text-destructive">*</span>
                </Label>
                <Input id="providerName" {...register('providerName')} />
                {errors.providerName && (
                  <p className="text-sm text-destructive">{errors.providerName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="providerType">
                  Provider Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('providerType')}
                  onValueChange={(value) => setValue('providerType', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.providerType && (
                  <p className="text-sm text-destructive">{errors.providerType.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ein">EIN (Employer Identification Number)</Label>
                <Input id="ein" {...register('ein')} placeholder="XX-XXXXXXX" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input id="contactName" {...register('contactName')} />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input id="contactEmail" type="email" {...register('contactEmail')} />
                {errors.contactEmail && (
                  <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input id="contactPhone" {...register('contactPhone')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input id="addressLine1" {...register('addressLine1')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input id="addressLine2" {...register('addressLine2')} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register('city')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" {...register('state')} placeholder="e.g., CA" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" {...register('postalCode')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" {...register('country')} defaultValue="USA" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                {...register('paymentTerms')}
                placeholder="e.g., Net 30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional information about this provider..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingProvider(null);
                  reset();
                }}
                disabled={createMutation.isPending || updateMutation.isPending}
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
                    {editingProvider ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>{editingProvider ? 'Update Provider' : 'Create Provider'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
