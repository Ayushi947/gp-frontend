'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IconEye, IconEyeOff, IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { useSponsorOnboarding } from '@/hooks';
import { useRegisterEmployer } from '@/api/generated/endpoints/authentication/authentication';
import { clearOnboardingData } from '@/lib/onboarding-storage';

const createAccountSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type CreateAccountFormData = z.infer<typeof createAccountSchema>;

export default function CreateAccountPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: onboardingData, completeStep, goBack, saveStepData, isHydrated } = useSponsorOnboarding();
  const registerEmployerMutation = useRegisterEmployer();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateAccountFormData>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      email: '',
      companyName: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  useEffect(() => {
    if (!isHydrated) return;

    // Don't run validation checks if form is being submitted
    if (isSubmitting) return;

    // If already authenticated (has accessToken or isAuthenticated), skip email verification check
    // This happens when user just created account and is being redirected
    const isAuthenticated =
      sessionStorage.getItem('accessToken') ||
      sessionStorage.getItem('auth_token') ||
      sessionStorage.getItem('isAuthenticated') === 'true';

    // Always pre-fill email from available sources, even if authenticated
    const email = onboardingData.email || sessionStorage.getItem('sponsorEmail') || sessionStorage.getItem('email');

    if (isAuthenticated) {
      // Still populate the form fields when navigating back while authenticated
      if (email) {
        setValue('email', email);
      }
      if (onboardingData.companyName) {
        setValue('companyName', onboardingData.companyName);
      } else {
        const savedCompanyName = sessionStorage.getItem('companyName');
        if (savedCompanyName) {
          setValue('companyName', savedCompanyName);
        }
      }
      if (onboardingData.adminFullName) {
        const nameParts = onboardingData.adminFullName.split(' ');
        setValue('firstName', nameParts[0] || '');
        setValue('lastName', nameParts.slice(1).join(' ') || '');
      }
      return; // Already authenticated, skip validation
    }

    // Check if OTP was verified - check both onboarding data AND sessionStorage
    const emailVerified = onboardingData.emailVerified || sessionStorage.getItem('emailVerified') === 'true';
    const participantToken = sessionStorage.getItem('participantToken');

    console.log('=== Create Account Page Load ===');
    console.log('emailVerified:', emailVerified);
    console.log('participantToken exists:', !!participantToken);
    console.log('email:', email);

    if (!emailVerified) {
      console.log('Redirecting: email not verified');
      toast.error('Email not verified', 'Please verify your email first.');
      router.push(ROUTES.GET_STARTED.VERIFY_OTP);
      return;
    }

    // Check for participantToken early - warn user if missing
    if (!participantToken) {
      console.warn('participantToken is missing - user will need to verify email again');
      toast.error('Session expired', 'Your verification session has expired. Please verify your email again.');
      router.push(ROUTES.GET_STARTED.VERIFY_OTP);
      return;
    }

    // Pre-fill email from onboarding data or session storage
    if (email) {
      setValue('email', email);
    }

    // Pre-fill saved data if exists
    if (onboardingData.companyName) {
      setValue('companyName', onboardingData.companyName);
    }
    if (onboardingData.adminFullName) {
      const nameParts = onboardingData.adminFullName.split(' ');
      setValue('firstName', nameParts[0] || '');
      setValue('lastName', nameParts.slice(1).join(' ') || '');
    }
  }, [isHydrated, onboardingData, router, setValue, isSubmitting]);

  const onSubmit = async (data: CreateAccountFormData) => {
    setIsSubmitting(true);

    try {
      // Verify that email was already verified in the previous step
      // OTP verification is done in verifyOtpOnly() - we don't need to send OTP again
      const emailVerified = onboardingData.emailVerified || sessionStorage.getItem('emailVerified') === 'true';

      console.log('=== Account Creation Debug ===');
      console.log('emailVerified flag:', sessionStorage.getItem('emailVerified'));
      console.log('onboardingData.emailVerified:', onboardingData.emailVerified);

      if (!emailVerified) {
        console.error('Email not verified - cannot create account');
        toast.error('Email not verified', 'Please verify your email first.');
        setIsSubmitting(false);
        router.push(ROUTES.GET_STARTED.VERIFY_OTP);
        return;
      }

      // Generate organization slug from company name
      const organizationSlug = data.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Note: OTP is NOT sent here - it was already verified in verifyOtpOnly() step
      // The backend no longer requires the otp field for employer registration
      // TypeScript type still includes otp (auto-generated), but we omit it in the actual request
      const requestBody = {
        organizationName: data.companyName,
        organizationSlug,
        email: data.email,
        username: data.email, // Use email as username
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        description: `401(k) Plan for ${data.companyName}`,
        // otp field is intentionally omitted - already verified in previous step
      } as any; // Type assertion needed because generated type still requires otp, but backend no longer needs it

      // Validate all required fields before sending
      console.log('Validating request body fields:');
      console.log('- organizationName:', requestBody.organizationName ? 'OK' : 'MISSING');
      console.log('- organizationSlug:', requestBody.organizationSlug ? 'OK' : 'MISSING');
      console.log('- email:', requestBody.email ? 'OK' : 'MISSING');
      console.log('- username:', requestBody.username ? 'OK' : 'MISSING');
      console.log('- password:', requestBody.password ? 'OK' : 'MISSING');
      console.log('- firstName:', requestBody.firstName ? 'OK' : 'MISSING');
      console.log('- lastName:', requestBody.lastName ? 'OK' : 'MISSING');

      console.log('Creating account with data:', { ...requestBody, password: '[REDACTED]' });

      // Call backend API to register employer
      const response = await registerEmployerMutation.mutateAsync({
        data: requestBody,
      });

      console.log('Account created successfully:', { ...response, accessToken: response.accessToken ? '[PRESENT]' : '[MISSING]' });

      // Backend sets HttpOnly authentication cookie automatically on successful registration
      // The auth cookie is sent with all subsequent API requests via withCredentials: true
      // We only store non-sensitive data needed for UI and onboarding flow

      sessionStorage.setItem('isAuthenticated', 'true');

      // Store email for plan creation APIs
      sessionStorage.setItem('email', data.email);
      sessionStorage.setItem('sponsorEmail', data.email);

      // Store company name for onboarding flow
      sessionStorage.setItem('companyName', data.companyName);

      console.log('User registration successful - authentication via HttpOnly cookie');

      // Store user info for UI purposes
      if (response.user) {
        sessionStorage.setItem('userInfo', JSON.stringify(response.user));
      }

      // Clear verification data from storage (OTP was already consumed during verification)
      sessionStorage.removeItem('participantToken');
      sessionStorage.removeItem('verifiedOTP');
      sessionStorage.removeItem('emailVerified');

      // Clear any old form data from previous incomplete attempts
      // Keep authentication and email data that we just set
      const oldFormKeys = [
        'employmentStatus',
        'businessSize',
        'existingPlan',
        'hasMultipleBusinesses',
        'payrollProvider',
        'selectedPlanType',
        'selectedPricingTier',
        'starterPlanData',
        'traditionalPlanConfig',
        'safeHarborPlanData',
        'soloPlanData',
        'estimatedEmployeeCount',
        'planStartDate',
        'trusteeData',
        'authorizationData',
      ];
      oldFormKeys.forEach((key) => sessionStorage.removeItem(key));

      const fullName = `${data.firstName} ${data.lastName}`;

      // Save account data and mark step as complete
      // completeStep will automatically redirect to the next step (company-info)
      completeStep('create-account', {
        companyName: data.companyName,
        adminFullName: fullName,
        accountCreated: true,
      });

      toast.success('Account created!', 'Welcome to GlidingPath. Redirecting...');
      
      // Note: completeStep() automatically navigates to the next step, so no manual redirect needed
      // Reset submitting state - the redirect will happen via completeStep()
      setIsSubmitting(false);
    } catch (error) {
      console.error('Account creation failed:', error);

      // Log full error details for debugging
      const err = error as { response?: { status?: number; data?: any; statusText?: string } };
      console.error('Error status:', err?.response?.status);
      console.error('Error status text:', err?.response?.statusText);
      console.error('Error response data:', JSON.stringify(err?.response?.data, null, 2));

      // Extract error message from response
      const errorMessage = err?.response?.data?.message || err?.response?.data?.error || 'Please try again or contact support.';

      toast.error('Account creation failed', errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    goBack();
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { label: 'Weak', color: 'text-error' };
    if (strength <= 4) return { label: 'Medium', color: 'text-warning' };
    return { label: 'Strong', color: 'text-success' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <OnboardingLayout
      title="Create Your Account"
      description="Set up your GlidingPath account to manage your 401(k) plan"
      currentStep={1}
      totalSteps={19}
      milestoneStep={9}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Basic information about your company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">
                Company Name <span className="text-error">*</span>
              </Label>
              <Input
                id="companyName"
                {...register('companyName')}
                placeholder="Acme Corporation"
                className={errors.companyName ? 'border-error' : ''}
              />
              {errors.companyName && (
                <p className="text-xs text-error">{errors.companyName.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Your personal information as the plan administrator</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-error">*</span>
                </Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  placeholder="John"
                  className={errors.firstName ? 'border-error' : ''}
                />
                {errors.firstName && (
                  <p className="text-xs text-error">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-error">*</span>
                </Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  placeholder="Smith"
                  className={errors.lastName ? 'border-error' : ''}
                />
                {errors.lastName && (
                  <p className="text-xs text-error">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-error">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                readOnly
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                This email has been verified and cannot be changed
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-error">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Enter a strong password"
                    className={errors.password ? 'border-error pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <IconEyeOff className="h-4 w-4" />
                    ) : (
                      <IconEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {password && (
                  <p className={`text-xs font-medium ${passwordStrength.color}`}>
                    Password strength: {passwordStrength.label}
                  </p>
                )}
                {errors.password && (
                  <p className="text-xs text-error">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-error">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    placeholder="Re-enter your password"
                    className={errors.confirmPassword ? 'border-error pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <IconEyeOff className="h-4 w-4" />
                    ) : (
                      <IconEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-error">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Requirements */}

        {/* Action Buttons */}
        <div className="flex justify-center gap-6"> 
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
            size="default"
            className="min-w-[140px] text-sm"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            loadingText="Creating Account..."
            size="default"
            className="min-w-[140px] text-sm"
          >
            Create Account
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
}
