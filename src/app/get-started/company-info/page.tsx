'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IconBuilding, IconInfoCircle } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { useSponsorOnboarding } from '@/hooks';

const companyInfoSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  ein: z
    .string()
    .min(1, 'EIN is required')
    .regex(/^\d{2}-\d{7}$/, 'EIN must be in format XX-XXXXXXX'),
});

type CompanyInfoFormData = z.infer<typeof companyInfoSchema>;

export default function CompanyInfoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { data: onboardingData, completeStep, goBack, isHydrated } = useSponsorOnboarding();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CompanyInfoFormData>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      companyName: '',
      ein: '',
    },
  });

  useEffect(() => {
    if (!isHydrated) return;

    // Check if user is authenticated (HttpOnly cookies + isAuthenticated flag)
    const isAuthenticatedSession = sessionStorage.getItem('isAuthenticated') === 'true';
    const isAuthenticatedLocal = localStorage.getItem('isAuthenticated') === 'true';
    const isAuthenticated = typeof window !== 'undefined' && (isAuthenticatedSession || isAuthenticatedLocal);

    // For new users going through registration, ensure account was created
    // For existing users logging in, skip this check (they're already authenticated via HttpOnly cookies)
    if (!isAuthenticated && !onboardingData.accountCreated) {
      toast.error('Account not created', 'Please create your account first.');
      router.push(ROUTES.GET_STARTED.CREATE_ACCOUNT);
      return;
    }

    // Load company name from registration OR from user info (for existing users)
    if (onboardingData.companyName) {
      // New user flow - company name from onboarding data
      setValue('companyName', onboardingData.companyName);
    } else if (isAuthenticated) {
      // Existing user flow - get company name from stored user info
      const userInfoSession = sessionStorage.getItem('userInfo');
      const userInfoLocal = localStorage.getItem('userInfo');
      const userInfo = userInfoSession || userInfoLocal;

      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          if (user.companyName) {
            setValue('companyName', user.companyName);
          }
        } catch (error) {
          console.error('Failed to parse user info:', error);
        }
      }
    }

    // Load saved EIN if user previously filled this step
    const savedEin = sessionStorage.getItem('ein');
    if (savedEin) {
      setValue('ein', savedEin);
    }
  }, [isHydrated, onboardingData, router, setValue]);

  const formatEIN = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as XX-XXXXXXX
    if (digits.length <= 2) {
      return digits;
    }
    return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
  };

  const handleEINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatEIN(e.target.value);
    setValue('ein', formatted);
  };

  const onSubmit = async (data: CompanyInfoFormData) => {
    setIsLoading(true);
    try {
      // Save company name and EIN to session storage for next step validation
      sessionStorage.setItem('companyName', data.companyName);
      if (data.ein) {
        sessionStorage.setItem('ein', data.ein);
      }

      // Mark this step as complete
      completeStep('company-info', {
        ein: data.ein || '',
      });

      toast.success('Company information saved', 'Continuing to next step.');

      // Navigate to next step
      router.push(ROUTES.GET_STARTED.EMPLOYMENT_STATUS);
    } catch (error) {
      toast.error('Error', 'Failed to save company information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    goBack();
  };

  return (
    <OnboardingLayout
      title="Company Information"
      description="Provide your company details for setting up your plan"
      currentStep={2}
      totalSteps={19}
      milestoneStep={9}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Name - Read-only from registration */}
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <div className="relative">
            <IconBuilding className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="companyName"
              type="text"
              placeholder="Acme Corporation"
              autoComplete="organization"
              readOnly
              disabled
              {...register('companyName')}
              className="pl-10 bg-muted cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            This was set during account creation and cannot be changed here
          </p>
        </div>

        {/* EIN */}
        <div className="space-y-2">
          <Label htmlFor="ein">
            Employer Identification Number (EIN)
            <span className="text-error ml-1">*</span>
          </Label>
          <Input
            id="ein"
            type="text"
            placeholder="XX-XXXXXXX"
            disabled={isLoading}
            {...register('ein')}
            onChange={handleEINChange}
            maxLength={10}
            className={errors.ein ? 'border-error' : ''}
          />
          {errors.ein && (
            <p className="text-xs text-error">{errors.ein.message}</p>
          )}
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
          <IconInfoCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Your EIN (Employer Identification Number) is a 9-digit number assigned by the IRS.
            You can find it on your tax documents or by contacting the IRS.
          </p>
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
            loadingText="Saving..."
            size="default"
            className="min-w-[140px] text-sm"
          >
            Continue
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
}
