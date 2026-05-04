'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  DollarSign,
  AlertTriangle,
  Info,
  ChevronRight,
  Clock,
  Check,
  X,
  Calculator,
  FileText,
  ShieldCheck,
  Loader2,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useGetMyParticipantBalance } from '@/api/generated/endpoints/investment-management/investment-management';
import {
  useCreateWithdrawalRequest,
  useGetParticipantWithdrawalRequests,
} from '@/api/generated/endpoints/withdrawal-management/withdrawal-management';
import { useSubmitWithdrawalPayment } from '@/api/generated/endpoints/btc-file-operations/btc-file-operations';
import type { WithdrawalPaymentRequestAccountType } from '@/api/generated/models';
import type { CreateWithdrawalRequestDTOWithdrawalType } from '@/api/generated/models';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const bankDetailsSchema = z.object({
  accountName: z.string().min(1, 'Account name is required'),
  routingNumber: z
    .string()
    .min(9, 'Routing number must be 9 digits')
    .max(9, 'Routing number must be 9 digits')
    .regex(/^\d+$/, 'Routing number must contain only digits'),
  accountNumber: z.string().min(4, 'Account number is required'),
  accountType: z.enum(['CHECKING', 'SAVINGS']),
  bankName: z.string().min(1, 'Bank name is required'),
});

type BankDetailsForm = z.infer<typeof bankDetailsSchema>;

function PageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Withdrawals</h1>
        <p className="text-muted-foreground">Request distributions from your retirement account</p>
      </div>
    </div>
  );
}

function AccountSummaryCard() {
  const { data: balanceData, isLoading } = useGetMyParticipantBalance();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-48 mb-4" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalValue = balanceData?.totalInvestmentValue ?? 0;
  const vestedValue = totalValue;
  const vestedPercent = 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Account Summary</CardTitle>
            <CardDescription>Your current balance and vesting status</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Total Account Value</p>
          <p className="text-3xl font-bold">{formatCurrency(totalValue)}</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vested Balance</span>
            <span className="font-medium">{formatCurrency(vestedValue)}</span>
          </div>
          <Progress value={vestedPercent} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {vestedPercent.toFixed(0)}% vested - Only vested funds are available for withdrawal
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function WithdrawalTypesCard({ onSelectType }: { onSelectType: (type: string) => void }) {
  const withdrawalTypes = [
    {
      id: 'HARDSHIP',
      title: 'Hardship Withdrawal',
      description: 'For immediate and heavy financial need',
      icon: AlertTriangle,
      available: true,
      restrictions: [
        'Must demonstrate financial hardship',
        'Subject to 10% early withdrawal penalty if under 59.5',
        'Income taxes apply',
      ],
    },
    {
      id: 'LOAN',
      title: '401(k) Loan',
      description:
        'Though not recommended, your plan allows you to borrow from your account and repay with interest',
      icon: DollarSign,
      available: true,
      restrictions: [
        'Loan repayment is with after-tax dollars',
        'Must repay in full within 5 years (except a Primary Residence Loan) or immediately when you leave your company.',
        'Interest paid back to your account',
      ],
    },
    {
      id: 'ROLLOVER',
      title: 'Rollover',
      description: 'Transfer to another qualified retirement account',
      icon: Building2,
      available: true,
      restrictions: [
        'Must be to qualified retirement plan',
        'No taxes or penalties if direct rollover',
        'Available upon separation from service',
      ],
    },
    {
      id: 'RMD',
      title: 'Required Minimum Distribution',
      description: 'Mandatory distribution after age 73',
      icon: Clock,
      available: false,
      restrictions: [
        'Required starting at age 73',
        'Penalty for not taking RMD',
        'Amount calculated based on life expectancy',
      ],
    },
  ];

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Withdrawal Options</CardTitle>
            <CardDescription>Select the type of distribution you need</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {withdrawalTypes.map((type) => (
            <div
              key={type.id}
              className={`p-4 border rounded-lg transition-all duration-200 h-full ${
                type.available
                  ? 'cursor-pointer hover:border-primary hover:bg-muted/30 hover:shadow-sm'
                  : 'opacity-50 cursor-not-allowed bg-muted/20'
              }`}
              onClick={() => type.available && onSelectType(type.id)}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      type.available ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <type.icon className="h-5 w-5" />
                  </div>
                  {type.available ? (
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  ) : (
                    <Badge variant="secondary" className="shrink-0 text-xs">N/A</Badge>
                  )}
                </div>
                <h4 className="font-semibold text-sm mb-1">{type.title}</h4>
                <p className="text-xs text-muted-foreground mb-2 flex-1">{type.description}</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {type.restrictions.slice(0, 2).map((restriction, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Info className="h-3 w-3 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{restriction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WithdrawalRequestForm({ type, onCancel }: { type: string; onCancel: () => void }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [withdrawalRequestId, setWithdrawalRequestId] = useState<string | null>(null);
  const { data: balanceData } = useGetMyParticipantBalance();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BankDetailsForm>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      accountType: 'CHECKING',
    },
  });

  const createWithdrawalMutation = useCreateWithdrawalRequest({
    mutation: {
      onSuccess: (data: any) => {
        toast.success('Withdrawal request created');
        // Store the withdrawal request ID for submitting payment details
        if (data?.id) {
          setWithdrawalRequestId(data.id);
        }
        setShowBankDetails(true);
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to create withdrawal request';
        toast.error(message);
      },
    },
  });

  // Use the new unified endpoint that embeds bank details directly in the Distribution File
  const submitPaymentMutation = useSubmitWithdrawalPayment({
    mutation: {
      onSuccess: () => {
        toast.success('Withdrawal submitted successfully');
        toast.success('Payment details sent to custodian');
        onCancel();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to submit payment details';
        toast.error(message);
      },
    },
  });

  const vestedValue = balanceData?.totalInvestmentValue ?? 0;

  const typeLabels: Record<string, string> = {
    HARDSHIP: 'Hardship Withdrawal',
    LOAN: '401(k) Loan',
    ROLLOVER: 'Rollover',
    RMD: 'Required Minimum Distribution',
  };

  const handleWithdrawalSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (parseFloat(amount) > vestedValue) {
      toast.error('Amount exceeds your vested balance');
      return;
    }

    try {
      await createWithdrawalMutation.mutateAsync({
        data: {
          withdrawalType: type as CreateWithdrawalRequestDTOWithdrawalType,
          requestedAmount: parseFloat(amount),
          hardshipReason: type === 'HARDSHIP' ? reason || undefined : undefined,
          notes: type !== 'HARDSHIP' ? reason || undefined : undefined,
        },
      });
    } catch (error) {
      // Handled by mutation
    }
  };

  const onBankDetailsSubmit = async (data: BankDetailsForm) => {
    if (!withdrawalRequestId) {
      toast.error('Missing withdrawal request ID. Please try again.');
      return;
    }

    try {
      // Submit payment details using the unified endpoint
      // Bank details are sent directly to BTC via Distribution File (DS) - NOT stored in database
      await submitPaymentMutation.mutateAsync({
        data: {
          withdrawalRequestId: withdrawalRequestId,
          // Bank payment details (passed directly to BTC, not stored)
          accountHolderName: data.accountName,
          bankName: data.bankName,
          routingNumber: data.routingNumber,
          accountNumber: data.accountNumber,
          accountType: (data.accountType === 'CHECKING' ? 'C' : 'S') as WithdrawalPaymentRequestAccountType,
          // Distribution details
          grossAmount: parseFloat(amount),
          distributionType: type === 'HARDSHIP' ? 'I' : type === 'ROLLOVER' ? 'R' : 'I',
        },
      });
    } catch (error) {
      // Handled by mutation
    }
  };

  if (showBankDetails) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Bank Account Details</CardTitle>
              <CardDescription>
                Provide your bank details for the withdrawal payment
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onBankDetailsSubmit)}>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Secure & Private</p>
                  <p className="text-blue-700 mt-1">
                    Your bank details are sent directly to our custodian (BTC) and are NOT stored in
                    our database for your security and privacy.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="accountName">
                  Account Name <span className="text-destructive">*</span>
                </Label>
                <Input id="accountName" {...register('accountName')} placeholder="John Doe" />
                {errors.accountName && (
                  <p className="text-sm text-destructive">{errors.accountName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">
                  Bank Name <span className="text-destructive">*</span>
                </Label>
                <Input id="bankName" {...register('bankName')} placeholder="Bank of America" />
                {errors.bankName && (
                  <p className="text-sm text-destructive">{errors.bankName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="routingNumber">
                  Routing Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="routingNumber"
                  {...register('routingNumber')}
                  placeholder="123456789"
                  maxLength={9}
                />
                {errors.routingNumber && (
                  <p className="text-sm text-destructive">{errors.routingNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">
                  Account Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="accountNumber"
                  type="password"
                  {...register('accountNumber')}
                  placeholder="••••••••"
                />
                {errors.accountNumber && (
                  <p className="text-sm text-destructive">{errors.accountNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType">
                  Account Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('accountType')}
                  onValueChange={(value) => setValue('accountType', value as any)}
                >
                  <SelectTrigger id="accountType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHECKING">Checking</SelectItem>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="font-medium text-sm">Withdrawal Summary</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="text-right font-medium">{typeLabels[type]}</span>
                <span className="text-muted-foreground">Amount</span>
                <span className="text-right font-medium">{formatCurrency(parseFloat(amount))}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowBankDetails(false)}
              disabled={submitPaymentMutation.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={submitPaymentMutation.isPending}
            >
              {submitPaymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{typeLabels[type] ?? 'Withdrawal Request'}</CardTitle>
            <CardDescription>Complete the form to submit your request</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900">Important Information</p>
              <p className="text-amber-700 mt-1">
                {type === 'HARDSHIP' &&
                  'Hardship withdrawals are subject to income taxes and may incur a 10% early withdrawal penalty if you are under age 59.5.'}
                {type === 'LOAN' &&
                  'Loans must be repaid within 5 years. Failure to repay will result in the loan being treated as a taxable distribution.'}
                {type === 'ROLLOVER' &&
                  'Direct rollovers to a qualified plan avoid taxes and penalties. Indirect rollovers must be completed within 60 days.'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Withdrawal Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-8"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Available vested balance: {formatCurrency(vestedValue)}
          </p>
        </div>

        {type === 'HARDSHIP' && (
          <div className="space-y-2">
            <Label htmlFor="reason">Hardship Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select reason for hardship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medical">Medical expenses</SelectItem>
                <SelectItem value="tuition">Tuition and education expenses</SelectItem>
                <SelectItem value="eviction">Prevention of eviction</SelectItem>
                <SelectItem value="funeral">Funeral expenses</SelectItem>
                <SelectItem value="home-repair">Certain home repairs</SelectItem>
                <SelectItem value="home-purchase">Purchase of primary residence</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {type === 'ROLLOVER' && (
          <div className="space-y-2">
            <Label htmlFor="destination">Rollover Destination</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="destination">
                <SelectValue placeholder="Select destination account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ira">Traditional IRA</SelectItem>
                <SelectItem value="roth-ira">Roth IRA</SelectItem>
                <SelectItem value="401k">Another 401(k)</SelectItem>
                <SelectItem value="403b">403(b) Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {type === 'LOAN' && (
          <div className="space-y-2">
            <Label htmlFor="term">Repayment Term</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="term">
                <SelectValue placeholder="Select repayment period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Year</SelectItem>
                <SelectItem value="2">2 Years</SelectItem>
                <SelectItem value="3">3 Years</SelectItem>
                <SelectItem value="4">4 Years</SelectItem>
                <SelectItem value="5">5 Years (Maximum)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {amount && parseFloat(amount) > 0 && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="font-medium text-sm">Estimated Tax Impact</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Federal Tax (22%)</span>
              <span className="text-right font-medium">
                -{formatCurrency(parseFloat(amount) * 0.22)}
              </span>
              {type === 'HARDSHIP' && (
                <>
                  <span className="text-muted-foreground">Early Withdrawal Penalty (10%)</span>
                  <span className="text-right font-medium">
                    -{formatCurrency(parseFloat(amount) * 0.1)}
                  </span>
                </>
              )}
              <span className="text-muted-foreground border-t pt-2">Estimated Net Amount</span>
              <span className="text-right font-medium border-t pt-2">
                {formatCurrency(parseFloat(amount) * (type === 'HARDSHIP' ? 0.68 : 0.78))}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              * Estimates only. Actual taxes depend on your tax bracket and state taxes.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={createWithdrawalMutation.isPending}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleWithdrawalSubmit}
          disabled={createWithdrawalMutation.isPending}
        >
          {createWithdrawalMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Continue
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function PendingRequestsCard() {
  const { data: requests, isLoading } = useGetParticipantWithdrawalRequests();

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Pending Requests</CardTitle>
              <CardDescription>Your withdrawal requests under review</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Handle API response - may be single object, array, or null/undefined
  let pendingRequests: any[] = [];
  if (requests) {
    if (Array.isArray(requests)) {
      pendingRequests = requests;
    } else if (typeof requests === 'object' && requests.id) {
      pendingRequests = [requests];
    }
  }

  // Filter out any invalid requests (missing required fields)
  pendingRequests = pendingRequests.filter(
    (r) => r && r.id && r.withdrawalType && r.requestedAmount != null
  );

  if (pendingRequests.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Pending Requests</CardTitle>
              <CardDescription>Your withdrawal requests under review</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No pending withdrawal requests</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Pending Requests</CardTitle>
            <CardDescription>Your withdrawal requests under review</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingRequests.map((request: any) => {
            const createdDate = request.createdAt ? new Date(request.createdAt) : null;
            const isValidDate = createdDate && !isNaN(createdDate.getTime());
            const amount =
              typeof request.requestedAmount === 'number' ? request.requestedAmount : 0;

            return (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {request.withdrawalType || 'Withdrawal'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isValidDate
                      ? `Submitted ${createdDate.toLocaleDateString()}`
                      : 'Submission pending'}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-medium">{formatCurrency(amount)}</p>
                  <Badge variant="secondary" className="mt-1">
                    {request.status || 'Pending'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function WithdrawalsPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  return (
    <DashboardContent>
      <PageHeader />

      {/* Top Row - Account Summary */}
      <div className="mb-6">
        <AccountSummaryCard />
      </div>

      {/* Bottom Row - Pending Requests & Withdrawal Options */}
      <div className="grid gap-6 lg:grid-cols-3 items-stretch">
        {/* Left Column - Pending Requests */}
        <div className="lg:col-span-1 flex">
          <div className="w-full">
            <PendingRequestsCard />
          </div>
        </div>

        {/* Right Column - Withdrawal Options or Form */}
        <div className="lg:col-span-2">
          {selectedType ? (
            <WithdrawalRequestForm type={selectedType} onCancel={() => setSelectedType(null)} />
          ) : (
            <WithdrawalTypesCard onSelectType={setSelectedType} />
          )}
        </div>
      </div>
    </DashboardContent>
  );
}
