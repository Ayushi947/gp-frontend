'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  IconArrowRight,
  IconMail,
  IconLoader2,
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { api } from '@/lib/api-client';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type EmailFormData = z.infer<typeof emailSchema>;

type EligibilityStatus = 'eligible' | 'already_enrolled' | 'not_found' | 'not_eligible';

interface VerifyEmailResponse {
  status: EligibilityStatus;
  message?: string;
  tenantId?: string;
  participantName?: string;
  companyName?: string;
}

interface ValidateTokenResponse {
  valid: boolean;
  email?: string;
  participantId?: string;
  tenantId?: string;
  message?: string;
}

function ParticipantEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const inviteToken = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  // Handle invite token validation on page load
  useEffect(() => {
    if (inviteToken) {
      validateInviteToken(inviteToken);
    }
  }, [inviteToken]);

  const validateInviteToken = async (token: string) => {
    setIsValidatingToken(true);
    setTokenError(null);

    try {
      const response = await api.post<ValidateTokenResponse>(
        '/auth/validate-participant-invite',
        { token }
      );

      if (response.valid && response.email) {
        // Token is valid - save data and skip OTP verification
        sessionStorage.setItem('participantEmail', response.email);
        sessionStorage.setItem('participantInviteToken', token);
        if (response.participantId) {
          sessionStorage.setItem('participantId', response.participantId);
        }
        if (response.tenantId) {
          sessionStorage.setItem('participantTenantId', response.tenantId);
        }

        toast.success('Invite verified!', 'Proceeding to complete your enrollment.');

        // Skip OTP and go directly to identity verification
        router.push(ROUTES.PARTICIPANT_ENROLLMENT.IDENTITY_VERIFICATION);
      } else {
        setTokenError(response.message || 'This invite link is invalid or has expired.');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setTokenError(
        err?.response?.data?.message ||
        'Unable to validate invite. The link may be invalid or expired.'
      );
    } finally {
      setIsValidatingToken(false);
    }
  };

  const onSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    try {
      // Step 1: Check participant eligibility
      const rawResponse = await api.post<any>(
        '/auth/verify-participant-email',
        { email: data.email.trim() }
      );

      // Normalize backend response into legacy VerifyEmailResponse shape
      const verifyResponse: VerifyEmailResponse = (() => {
        if (!rawResponse?.exists) {
          return {
            status: 'not_found',
            message: rawResponse?.message,
          };
        }

        if (rawResponse?.alreadyRegistered) {
          return {
            status: 'already_enrolled',
            message: rawResponse?.message,
            tenantId: rawResponse?.tenantId,
          };
        }

        if (!rawResponse?.eligible) {
          return {
            status: 'not_eligible',
            message: rawResponse?.message,
            tenantId: rawResponse?.tenantId,
          };
        }

        // Eligible participant
        const firstName = rawResponse?.firstName ?? '';
        const lastName = rawResponse?.lastName ?? '';

        return {
          status: 'eligible',
          message: rawResponse?.message,
          tenantId: rawResponse?.tenantId,
          participantName: `${firstName} ${lastName}`.trim() || undefined,
        };
      })();

      // Handle different eligibility statuses
      switch (verifyResponse.status) {
        case 'already_enrolled':
          toast.info(
            'Account exists',
            'You already have an account. Please sign in instead.'
          );
          router.push(ROUTES.AUTH.LOGIN);
          return;

        case 'not_found':
          toast.error(
            'Email not found',
            verifyResponse.message ||
            "We couldn't find this email in our records. Please ensure you're using the email registered with your employer's 401(k) plan."
          );
          setIsLoading(false);
          return;

        case 'not_eligible':
          toast.error(
            'Not eligible',
            verifyResponse.message ||
            "You're not currently eligible to enroll. Please contact your HR department for assistance."
          );
          setIsLoading(false);
          return;

        case 'eligible':
          // Continue with OTP verification
          break;

        default:
          toast.error('Error', 'An unexpected error occurred. Please try again.');
          setIsLoading(false);
          return;
      }

      // Step 2: Send OTP to the verified email
      await api.post('/auth/send-otp/employee', {
        email: data.email.trim(),
        tenantId: verifyResponse.tenantId,
      });

      // Save participant info to session storage
      sessionStorage.setItem('participantEmail', data.email.trim());
      if (verifyResponse.tenantId) {
        sessionStorage.setItem('participantTenantId', verifyResponse.tenantId);
      }
      if (verifyResponse.participantName) {
        sessionStorage.setItem('participantName', verifyResponse.participantName);
      }
      if (verifyResponse.companyName) {
        sessionStorage.setItem('participantCompanyName', verifyResponse.companyName);
      }

      toast.success('Verification code sent!', 'Check your email inbox.');
      router.push(ROUTES.PARTICIPANT_ENROLLMENT.VERIFY_OTP);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        'Verification failed',
        err?.response?.data?.message || 'Unable to verify email. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while validating invite token
  if (isValidatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <IconLoader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Validating your invite...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if token validation failed
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/assets/images/Final Logo.svg"
                  alt="GlidingPath Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
                <span className="text-2xl font-bold">GlidingPath</span>
              </div>
            </div>
            <CardTitle className="text-2xl">Invite Link Issue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <IconAlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Invalid or Expired Link</p>
                <p className="text-sm text-destructive/80 mt-1">{tokenError}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              You can still enroll by entering your email address below, or contact your HR department for a new invite link.
            </p>

            <Button
              onClick={() => {
                setTokenError(null);
                router.replace(ROUTES.PARTICIPANT_ENROLLMENT.EMAIL);
              }}
              className="w-full"
            >
              Continue with Email
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link
                href={ROUTES.AUTH.LOGIN}
                className="font-medium text-primary hover:underline"
              >
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Normal email entry form (self-enrollment)
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-3">
              <Image
                  src="/assets/images/Final Logo.svg"
                alt="GlidingPath Logo"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <span className="text-2xl font-bold">GlidingPath</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Access Your 401(k) Plan</CardTitle>
          <CardDescription>
            Enter the email address registered with your employer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Work Email <span className="text-error">*</span>
              </Label>
              <div className="relative">
                <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your work email"
                  autoComplete="email"
                  disabled={isLoading}
                  {...register('email')}
                  className={`pl-10 ${errors.email ? 'border-error' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-error">{errors.email.message}</p>
              )}
            </div>

            {/* Info Banner */}
            <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p>
                Please use the email address your employer has on file for your 401(k) plan.
                If you received an invite email, please use the link in that email instead.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isLoading}
                loading={isLoading}
                loadingText="Verifying..."
                size="default"
                className="min-w-[140px] text-sm"
              >
                Continue
                <IconArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Sign In Link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link
                href={ROUTES.AUTH.LOGIN}
                className="font-medium text-primary hover:underline"
              >
                Sign In
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ParticipantEmailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ParticipantEmailPageContent />
    </Suspense>
  );
}
