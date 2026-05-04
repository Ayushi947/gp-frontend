'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  IconArrowRight,
  IconEye,
  IconEyeOff,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { useVerifyOTPAndRegisterEmployee } from '@/api/generated/endpoints/authentication/authentication';
import { cn } from '@/lib/utils';

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

interface PasswordRequirement {
  met: boolean;
  text: string;
}

function PasswordRequirementItem({ met, text }: PasswordRequirement) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <IconCheck className="h-4 w-4 text-success" />
      ) : (
        <IconX className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={met ? 'text-success' : 'text-muted-foreground'}>{text}</span>
    </div>
  );
}

export default function SetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');

  const verifyOtpAndRegisterMutation = useVerifyOTPAndRegisterEmployee();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  useEffect(() => {
    // Check if we have required data from previous steps
    const storedEmail = sessionStorage.getItem('participantEmail');
    const participantToken = sessionStorage.getItem('participantToken');
    const storedFirstName = sessionStorage.getItem('participantFirstName');
    const storedLastName = sessionStorage.getItem('participantLastName');

    if (!storedEmail || !participantToken) {
      toast.error('Session expired', 'Please start over.');
      router.push(ROUTES.PARTICIPANT_ENROLLMENT.EMAIL);
      return;
    }

    setEmail(storedEmail);
    setFirstName(storedFirstName || '');
    setLastName(storedLastName || '');
  }, [router]);

  const onSubmit = async (data: PasswordFormData) => {
    const participantTenantId = sessionStorage.getItem('participantTenantId') || '';

    verifyOtpAndRegisterMutation.mutate(
      {
        data: {
          email,
          // OTP was already verified in the previous step; backend will skip re-verification
          // We still send a non-empty placeholder to satisfy validation constraints
          otp: '000000',
          password: data.password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          username: email,
          tenantId: participantTenantId || undefined,
          skipOtpVerification: true,
        },
      },
      {
        onSuccess: (response) => {
          // Backend sets HttpOnly authentication cookie automatically
          // No need to store tokens - auth cookie is sent with all requests via withCredentials: true

          // Clear registration data
          sessionStorage.removeItem('participantEmail');
          sessionStorage.removeItem('participantToken');
          sessionStorage.removeItem('participantTenantId');

          toast.success('Account created!', 'Welcome to GlidingPath.');
          router.push(ROUTES.PARTICIPANT_ENROLLMENT.CHOOSE_INVESTMENT_PATH);
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } } };
          toast.error(
            'Failed to create account',
            err?.response?.data?.message || 'Please try again.'
          );
        },
      }
    );
  };

  return (
    <OnboardingLayout
      title="Set Your Password"
      description="Create a secure password for your account"
      currentStep={4}
      totalSteps={5}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Read-only User Info */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">First Name</Label>
              <Input value={firstName} disabled className="bg-muted" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Last Name</Label>
              <Input value={lastName} disabled className="bg-muted" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input value={email} disabled className="bg-muted" />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">
            Password <span className="text-error">*</span>
          </Label>
          <div className="relative">
              <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              disabled={verifyOtpAndRegisterMutation.isPending}
              {...register('password')}
              className={cn('pr-10', errors.password && 'border-error')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-error">{errors.password.message}</p>
          )}
        </div>

        {/* Password Requirements */}
        {password && (
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="text-sm font-medium mb-2">Password requirements:</p>
            <PasswordRequirementItem met={passwordRequirements.minLength} text="At least 8 characters" />
            <PasswordRequirementItem met={passwordRequirements.hasUppercase} text="One uppercase letter" />
            <PasswordRequirementItem met={passwordRequirements.hasLowercase} text="One lowercase letter" />
            <PasswordRequirementItem met={passwordRequirements.hasNumber} text="One number" />
            <PasswordRequirementItem met={passwordRequirements.hasSpecial} text="One special character" />
          </div>
        )}

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            Confirm Password <span className="text-error">*</span>
          </Label>
          <div className="relative">
              <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              disabled={verifyOtpAndRegisterMutation.isPending}
              {...register('confirmPassword')}
              className={cn('pr-10', errors.confirmPassword && 'border-error')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirmPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-error">{errors.confirmPassword.message}</p>
          )}
          {passwordsMatch && (
            <p className="text-xs text-success flex items-center gap-1">
              <IconCheck className="h-3 w-3" /> Passwords match
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={verifyOtpAndRegisterMutation.isPending || !allRequirementsMet || !passwordsMatch}
            loading={verifyOtpAndRegisterMutation.isPending}
            loadingText="Creating account..."
            size="default"
            className="min-w-[140px] text-sm"
          >
            Create Account
            <IconArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
}
