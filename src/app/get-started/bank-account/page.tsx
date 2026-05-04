'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  IconBuildingBank,
  IconInfoCircle,
  IconShieldCheck,
  IconCheck,
  IconEdit,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { useCreateBankAccountFromDetails } from '@/api/generated/endpoints/pricing-integration/pricing-integration';
import { useGetOnBoardingState } from '@/api/generated/endpoints/plan-sponsor-details/plan-sponsor-details';
import { FormSelect } from '@/components/ui/FormSelect';

const bankAccountSchema = z.object({
  accountHolderName: z.string().min(2, 'Account holder name is required'),
  accountHolderType: z.enum(['individual', 'company']),
  accountType: z.enum(['checking', 'savings']),
  routingNumber: z.string().regex(/^\d{9}$/, 'Routing number must be 9 digits'),
  accountNumber: z.string().min(4, 'Account number is required'),
});

type BankAccountFormData = z.infer<typeof bankAccountSchema>;

// Helper function to mask account number (UI level only)
const maskAccountNumber = (accountNumber: string): string => {
  if (!accountNumber || accountNumber.length < 4) {
    return '****';
  }
  return '****' + accountNumber.slice(-4);
};

export default function BankAccountPage() {
  const router = useRouter();
  const createBankAccountMutation = useCreateBankAccountFromDetails();
  const isLoading = createBankAccountMutation.isPending;
  const { data: onboardingState, isLoading: isLoadingOnboardingState } = useGetOnBoardingState();
  
  // State for confirmation step
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formDataToConfirm, setFormDataToConfirm] = useState<BankAccountFormData | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      accountHolderName: '',
      accountHolderType: 'company',
      accountType: 'checking',
      routingNumber: '',
      accountNumber: '',
    },
  });

  useEffect(() => {
    // Don't redirect while loading onboarding state
    if (isLoadingOnboardingState) {
      return;
    }

    // Check onboarding state first - if it's BANK_VERIFICATION or SIGN, allow access.
    // This handles the case when user comes from the review-and-sign document page.
    const isBankVerificationFlow =
      onboardingState?.currentState === 'BANK_VERIFICATION' ||
      onboardingState?.currentState === 'SIGN';
    
    // Check if previous step was completed (only if not in BANK_VERIFICATION/SIGN state)
    const pricingTier = sessionStorage.getItem('selectedPricingTier');
    if (!isBankVerificationFlow && !pricingTier) {
      toast.error('Missing information', 'Please complete previous steps first.');
      router.push(ROUTES.GET_STARTED.REVIEW_PRICING);
      return;
    }

    // Pre-fill company name as account holder
    const companyName = sessionStorage.getItem('companyName');
    if (companyName) {
      setValue('accountHolderName', companyName);
    }
  }, [router, setValue, onboardingState?.currentState, isLoadingOnboardingState]);

  const handleRoutingNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
    setValue('routingNumber', value);
  };

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setValue('accountNumber', value);
  };

  // Modified onSubmit to show confirmation instead of submitting immediately
  const onSubmit = (data: BankAccountFormData) => {
    // Store form data and show confirmation
    setFormDataToConfirm(data);
    setShowConfirmation(true);
  };

  // Handler for confirming and submitting
  const handleConfirmAndSubmit = () => {
    if (!formDataToConfirm) return;

    createBankAccountMutation.mutate(
      {
        data: {
          ...formDataToConfirm,
          country: 'US',
          currency: 'usd',
        },
      },
      {
        onSuccess: () => {
          toast.success('Bank account verified!', 'Continuing to payroll integration.');
          router.push(ROUTES.GET_STARTED.FINCH_CONNECT);
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } } };
          toast.error(
            'Verification failed',
            err?.response?.data?.message || 'Please check your bank details and try again.'
          );
        },
      }
    );
  };

  // Handler to go back to form from confirmation
  const handleEdit = () => {
    setShowConfirmation(false);
    setFormDataToConfirm(null);
  };

  const handleSkip = () => {
    toast.info('Skipped', 'You can add your bank account later from settings.');
    router.push(ROUTES.GET_STARTED.FINCH_CONNECT);
  };

  const handleBack = () => {
    // If in confirmation, go back to form
    if (showConfirmation) {
      handleEdit();
      return;
    }
    
    // If coming from sign document flow (SIGN or BANK_VERIFICATION state), go back to sign document page
    // Otherwise, go back to review pricing
    if (
      onboardingState?.currentState === 'BANK_VERIFICATION' ||
      onboardingState?.currentState === 'SIGN'
    ) {
      router.push(ROUTES.GET_STARTED.REVIEW_AND_SIGN_DOCUMENT);
    } else {
      router.push(ROUTES.GET_STARTED.REVIEW_PRICING);
    }
  };

  // Confirmation view
  if (showConfirmation && formDataToConfirm) {
    const maskedAccountNumber = maskAccountNumber(formDataToConfirm.accountNumber);
    const accountHolderTypeLabel = formDataToConfirm.accountHolderType === 'company' ? 'Company' : 'Individual';
    const accountTypeLabel = formDataToConfirm.accountType === 'checking' ? 'Checking' : 'Savings';

    return (
      <OnboardingLayout
        title="Confirm Your Bank Account"
        description="Please verify that your bank account information is correct"
        currentStep={17}
        totalSteps={19}
        milestoneStep={9}
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Security Banner */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
            <IconShieldCheck className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Your bank information is securely encrypted and processed by Stripe.
            </p>
          </div>

          {/* Bank Account Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCheck className="h-5 w-5 text-success" />
                Bank Account Details
              </CardTitle>
              <CardDescription>
                Review your bank account information before confirming
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">Account Holder Name</span>
                  <span className="text-sm font-semibold">{formDataToConfirm.accountHolderName}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">Account Holder Type</span>
                  <span className="text-sm font-semibold">{accountHolderTypeLabel}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">Account Type</span>
                  <span className="text-sm font-semibold">{accountTypeLabel}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">Routing Number</span>
                  <span className="text-sm font-semibold font-mono">{formDataToConfirm.routingNumber}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-muted-foreground">Account Number</span>
                  <span className="text-sm font-semibold font-mono">{maskedAccountNumber}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center gap-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleEdit}
              disabled={isLoading}
              size="default"
              className="min-w-[140px] text-sm"
            >
              <IconEdit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAndSubmit}
              disabled={isLoading}
              loading={isLoading}
              loadingText="Verifying..."
              size="default"
              className="min-w-[140px] text-sm"
            >
              <IconCheck className="h-4 w-4 mr-2" />
              Confirm & Continue
            </Button>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  // Original form view
  return (
    <OnboardingLayout
      title="Payroll Bank Account"
      description="Connect your bank account used for payroll contributions"
      currentStep={20}
      totalSteps={22}
      milestoneStep={12}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Security Banner */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
          <IconShieldCheck className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Your bank information is securely encrypted and processed by Stripe.
          </p>
        </div>

        {/* Account Holder Name */}
        <div className="space-y-2">
          <Label htmlFor="accountHolderName">Account Holder Name</Label>
          <div className="relative">
            <IconBuildingBank className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="accountHolderName"
              type="text"
              placeholder="Company or individual name"
              disabled={isLoading}
              {...register('accountHolderName')}
              className={`pl-10 ${errors.accountHolderName ? 'border-error' : ''}`}
            />
          </div>
          {errors.accountHolderName && (
            <p className="text-xs text-error">{errors.accountHolderName.message}</p>
          )}
        </div>

        {/* Account Type Selects */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <FormSelect
              label="Account Holder Type"
              options={[
                { value: 'company', label: 'Company' },
                { value: 'individual', label: 'Individual' },
              ]}
              value={watch('accountHolderType')}
              onValueChange={(value) =>
                setValue('accountHolderType', value as 'individual' | 'company')
              }
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <FormSelect
              label="Account Type"
              options={[
                { value: 'checking', label: 'Checking' },
                { value: 'savings', label: 'Savings' },
              ]}
              value={watch('accountType')}
              onValueChange={(value) =>
                setValue('accountType', value as 'checking' | 'savings')
              }
              disabled={isLoading}
              required
            />
          </div>
        </div>

        {/* Routing Number */}
        <div className="space-y-2">
          <Label htmlFor="routingNumber">Routing Number</Label>
          <Input
            id="routingNumber"
            type="text"
            inputMode="numeric"
            placeholder="110000000"
            maxLength={9}
            disabled={isLoading}
            {...register('routingNumber')}
            onChange={handleRoutingNumberChange}
            className={errors.routingNumber ? 'border-error' : ''}
          />
          <p className="text-xs text-muted-foreground">
            9-digit routing number found on your check
          </p>
          {errors.routingNumber && (
            <p className="text-xs text-error">{errors.routingNumber.message}</p>
          )}
        </div>

        {/* Account Number */}
        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input
            id="accountNumber"
            type="text"
            inputMode="numeric"
            placeholder="000123456789"
            disabled={isLoading}
            {...register('accountNumber')}
            onChange={handleAccountNumberChange}
            className={errors.accountNumber ? 'border-error' : ''}
          />
          {errors.accountNumber && (
            <p className="text-xs text-error">{errors.accountNumber.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isLoading}
            size="default"
            className="min-w-[140px] text-sm"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            loading={isLoading}
            loadingText="Verifying..."
            size="default"
            className="min-w-[140px] text-sm"
          >
            Verify & Continue
          </Button>
        </div>

        {/* Skip Option */}
        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={isLoading}
            className="text-sm"
          >
            Skip for now
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
}
