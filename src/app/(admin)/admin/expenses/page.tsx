'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useListExpenses,
  useCreateExpense,
  useUpdateExpense,
  useApproveExpense,
  useRejectExpense,
  useMarkExpenseAsPaid,
  useCancelExpense,
  useDeleteExpense,
} from '@/api/generated/endpoints/plan-expense-management/plan-expense-management';
import { useGetAllActiveProvidersForDropdown } from '@/api/generated/endpoints/service-provider-management/service-provider-management';
import {
  ExpenseDTOCategory,
  ExpenseDTOAllocationMethod,
  ExpenseDTOStatus,
  ListExpensesStatus,
  ListExpensesCategory,
} from '@/api/generated/models';
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
  IconReceipt,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCircleCheck,
  IconX,
  IconCreditCard,
  IconBan,
  IconLoader2,
  IconSearch,
  IconFilter,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const EXPENSE_CATEGORIES = [
  { value: 'ADMINISTRATIVE_TPA', label: 'Administrative - TPA' },
  { value: 'ADMINISTRATIVE_RECORDKEEPING', label: 'Administrative - Recordkeeping' },
  { value: 'ADMINISTRATIVE_AUDIT', label: 'Administrative - Audit' },
  { value: 'ADMINISTRATIVE_LEGAL', label: 'Administrative - Legal' },
  { value: 'INVESTMENT_MANAGEMENT', label: 'Investment Management' },
  { value: 'CUSTODIAN_TRUSTEE', label: 'Custodian/Trustee' },
  { value: 'PARTICIPANT_EDUCATION', label: 'Participant Education' },
  { value: 'DOCUMENT_FILING', label: 'Document Filing' },
  { value: 'OTHER', label: 'Other' },
];

const ALLOCATION_METHODS = [
  { value: 'PLAN_LEVEL', label: 'Plan Level' },
  { value: 'PER_PARTICIPANT_EQUAL', label: 'Per Participant (Equal)' },
  { value: 'PERCENTAGE_OF_BALANCE', label: 'Percentage of Balance' },
  { value: 'CUSTOM_ALLOCATION', label: 'Custom Allocation' },
  { value: 'SINGLE_PARTICIPANT', label: 'Single Participant' },
];

const expenseSchema = z.object({
  serviceProviderId: z.string().optional(),
  expenseDate: z.string().min(1, 'Expense date is required'),
  category: z.enum([
    'ADMINISTRATIVE_TPA',
    'ADMINISTRATIVE_RECORDKEEPING',
    'ADMINISTRATIVE_AUDIT',
    'ADMINISTRATIVE_LEGAL',
    'INVESTMENT_MANAGEMENT',
    'CUSTODIAN_TRUSTEE',
    'PARTICIPANT_EDUCATION',
    'DOCUMENT_FILING',
    'OTHER',
  ]),
  allocationMethod: z.enum([
    'PLAN_LEVEL',
    'PER_PARTICIPANT_EQUAL',
    'PERCENTAGE_OF_BALANCE',
    'CUSTOM_ALLOCATION',
    'SINGLE_PARTICIPANT',
  ]),
  totalAmount: z.number().min(0.01, 'Amount must be greater than 0'),
  invoiceNumber: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional(),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const { data: expensesData, isLoading, refetch } = useListExpenses({
    page,
    size: 15,
    status: (statusFilter?.trim() || undefined) as ListExpensesStatus | undefined,
    category: (categoryFilter?.trim() || undefined) as ListExpensesCategory | undefined,
  });

  const { data: providersData } = useGetAllActiveProvidersForDropdown();

  const createMutation = useCreateExpense({
    mutation: {
      onSuccess: () => {
        toast.success('Expense created successfully');
        setDialogOpen(false);
        reset();
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to create expense';
        toast.error(message);
      },
    },
  });

  const updateMutation = useUpdateExpense({
    mutation: {
      onSuccess: () => {
        toast.success('Expense updated successfully');
        setDialogOpen(false);
        setEditingExpense(null);
        reset();
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to update expense';
        toast.error(message);
      },
    },
  });

  const approveMutation = useApproveExpense({
    mutation: {
      onSuccess: () => {
        toast.success('Expense approved');
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to approve expense';
        toast.error(message);
      },
    },
  });

  const rejectMutation = useRejectExpense({
    mutation: {
      onSuccess: () => {
        toast.success('Expense rejected');
        setRejectDialogOpen(false);
        setSelectedExpense(null);
        setRejectionReason('');
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to reject expense';
        toast.error(message);
      },
    },
  });

  const markPaidMutation = useMarkExpenseAsPaid({
    mutation: {
      onSuccess: () => {
        toast.success('Expense marked as paid');
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to mark as paid';
        toast.error(message);
      },
    },
  });

  const cancelMutation = useCancelExpense({
    mutation: {
      onSuccess: () => {
        toast.success('Expense cancelled');
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to cancel expense';
        toast.error(message);
      },
    },
  });

  const deleteMutation = useDeleteExpense({
    mutation: {
      onSuccess: () => {
        toast.success('Expense deleted');
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to delete expense';
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
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    mode: 'onSubmit',
    defaultValues: {
      category: 'ADMINISTRATIVE_TPA',
      allocationMethod: 'PLAN_LEVEL',
      totalAmount: 0,
    },
  });

  const onSubmit = async (data: ExpenseForm) => {
    try {
      if (editingExpense) {
        await updateMutation.mutateAsync({
          expenseId: editingExpense.id,
          data: {
            ...data,
            serviceProviderId: data.serviceProviderId || '',
          },
        });
      } else {
        await createMutation.mutateAsync({
          data: {
            ...data,
            planId: '', // TODO: Get actual planId from context or make this optional in backend
            serviceProviderId: data.serviceProviderId || '',
          },
        });
      }
    } catch (error) {
      // Handled by mutation
    }
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    reset({
      serviceProviderId: expense.serviceProviderId || '',
      expenseDate: expense.expenseDate || '',
      category: expense.category || 'ADMINISTRATIVE_TPA',
      allocationMethod: expense.allocationMethod || 'PLAN_LEVEL',
      totalAmount: expense.totalAmount || 0,
      invoiceNumber: expense.invoiceNumber || '',
      description: expense.description || '',
      notes: expense.notes || '',
    });
    setDialogOpen(true);
  };

  const handleReject = (expense: any) => {
    setSelectedExpense(expense);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        expenseId: selectedExpense.id,
        data: { reason: rejectionReason },
      });
    } catch (error) {
      // Handled by mutation
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="default">Approved</Badge>;
      case 'PAID':
        return <Badge className="bg-green-600">Paid</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const expenses = expensesData?.content || [];
  const providers = providersData || [];

  return (
    <div className="space-y-8 w-full">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <IconReceipt className="h-6 w-6" />
          Plan Expenses
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage plan-level expenses and allocations
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Expense List</CardTitle>
              <CardDescription>All plan expenses and service provider fees</CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingExpense(null);
                reset({
                  category: 'ADMINISTRATIVE_TPA',
                  allocationMethod: 'PLAN_LEVEL',
                  totalAmount: 0,
                  expenseDate: new Date().toISOString().split('T')[0],
                });
                setDialogOpen(true);
              }}
            >
              <IconPlus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All categories</SelectItem>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconReceipt className="h-12 w-12 text-muted-foreground mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground">
                {statusFilter || categoryFilter ? 'No expenses found matching your filters' : 'No expenses recorded yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Allocation</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense: any) => (
                      <TableRow key={expense.id}>
                        <TableCell className="text-xs">
                          {expense.expenseDate
                            ? format(new Date(expense.expenseDate), 'MMM d, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{expense.categoryDisplayName || expense.category}</p>
                            {expense.invoiceNumber && (
                              <p className="text-xs text-muted-foreground">
                                Invoice: {expense.invoiceNumber}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {expense.serviceProviderName ? (
                            <div className="text-sm">
                              <p className="font-medium">{expense.serviceProviderName}</p>
                              {expense.serviceProviderType && (
                                <p className="text-xs text-muted-foreground">
                                  {expense.serviceProviderType}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm truncate">{expense.description || 'N/A'}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {expense.allocationMethodDisplayName || expense.allocationMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ${expense.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </TableCell>
                        <TableCell>{getStatusBadge(expense.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {expense.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => approveMutation.mutate({ expenseId: expense.id })}
                                  disabled={approveMutation.isPending}
                                >
                                  <IconCircleCheck className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleReject(expense)}
                                >
                                  <IconX className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                            {expense.status === 'APPROVED' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  markPaidMutation.mutate({
                                    expenseId: expense.id,
                                    data: { paidDate: new Date().toISOString().split('T')[0] },
                                  })
                                }
                                disabled={markPaidMutation.isPending}
                              >
                                <IconCreditCard className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                            {expense.isEditable && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEdit(expense)}
                              >
                                <IconEdit className="h-4 w-4" />
                              </Button>
                            )}
                            {(expense.status === 'PENDING' || expense.status === 'APPROVED') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => cancelMutation.mutate({ expenseId: expense.id })}
                                disabled={cancelMutation.isPending}
                              >
                                <IconBan className="h-4 w-4 text-orange-600" />
                              </Button>
                            )}
                            {expense.isEditable && expense.status === 'CANCELLED' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this expense?')) {
                                    deleteMutation.mutate({ expenseId: expense.id });
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                              >
                                <IconTrash className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {expensesData && (expensesData.totalPages ?? 0) > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(expensesData.number ?? 0) * (expensesData.size ?? 15) + 1} to{' '}
                    {Math.min(
                      ((expensesData.number ?? 0) + 1) * (expensesData.size ?? 15),
                      expensesData.totalElements ?? 0,
                    )}{' '}
                    of {expensesData.totalElements ?? 0} expenses
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
                      disabled={page >= (expensesData.totalPages ?? 1) - 1}
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

      {/* Create/Edit Expense Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            <DialogDescription>
              {editingExpense ? 'Update expense details' : 'Create a new plan expense'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expenseDate">
                  Expense Date <span className="text-destructive">*</span>
                </Label>
                <Input id="expenseDate" type="date" {...register('expenseDate')} />
                {errors.expenseDate && (
                  <p className="text-sm text-destructive">{errors.expenseDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalAmount">
                  Total Amount <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  {...register('totalAmount', { valueAsNumber: true })}
                />
                {errors.totalAmount && (
                  <p className="text-sm text-destructive">{errors.totalAmount.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('category')}
                  onValueChange={(value) => setValue('category', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="allocationMethod">
                  Allocation Method <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('allocationMethod')}
                  onValueChange={(value) => setValue('allocationMethod', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select allocation method" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALLOCATION_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.allocationMethod && (
                  <p className="text-sm text-destructive">{errors.allocationMethod.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serviceProviderId">Service Provider</Label>
                <Select
                  value={watch('serviceProviderId')}
                  onValueChange={(value) => setValue('serviceProviderId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">None</SelectItem>
                    {providers.map((provider: any) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.providerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input id="invoiceNumber" {...register('invoiceNumber')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Input id="description" {...register('description')} />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional notes or details..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingExpense(null);
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
                    {editingExpense ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>{editingExpense ? 'Update Expense' : 'Create Expense'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Expense Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this expense
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this expense is being rejected..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setSelectedExpense(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
            >
              {rejectMutation.isPending ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject Expense'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
