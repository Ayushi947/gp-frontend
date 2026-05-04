'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { useSponsorOnboarding } from '@/hooks';
import {
  useVerifyOtpOnly,
  useSendOTPForEmployer,
} from '@/api/generated/endpoints/authentication/authentication';

export default function SponsorVerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [email, setEmail] = useState<string>('');

  const { data: onboardingData, completeStep, goBack, isHydrated } = useSponsorOnboarding();
  const verifyOtpMutation = useVerifyOtpOnly();
  const resendOtpMutation = useSendOTPForEmployer();

  useEffect(() => {
    // Get email from onboarding data or session storage
    const storedEmail = onboardingData.email || sessionStorage.getItem('sponsorEmail');
    if (!storedEmail) {
      toast.error('Session expired', 'Please enter your email again.');
      router.push(ROUTES.GET_STARTED.EMAIL);
      return;
    }
    setEmail(storedEmail);

    // Focus first input
    inputRefs.current[0]?.focus();
  }, [router, isHydrated, onboardingData.email]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === 'Enter' && otp.every((digit) => digit !== '')) {
      handleVerify();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    // Check if pasted data is 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      toast.error('Invalid code', 'Please enter all 6 digits.');
      return;
    }

    verifyOtpMutation.mutate(
      { data: { email, otp: otpCode, userType: 'SPONSOR' } },
      {
        onSuccess: (response) => {
          console.log('=== OTP Verification Successful ===');
          console.log('Response:', response);
          console.log('participantToken received:', !!response.participantToken);
          console.log('tenantId received:', !!response.tenantId);

          // Store verification data
          // IMPORTANT: Backend returns 'participantToken' for BOTH sponsors and participants
          // For SPONSOR, it may also return 'verificationToken' - use participantToken if available, otherwise verificationToken
          const token = (response.participantToken || response.verificationToken) as string;
          if (token) {
            sessionStorage.setItem('participantToken', token);
            console.log('✓ participantToken/verificationToken stored in sessionStorage');
          } else {
            console.warn('⚠️ participantToken/verificationToken NOT received from backend!');
          }
          if (response.tenantId) {
            sessionStorage.setItem('tenantId', response.tenantId as string);
            console.log('✓ tenantId stored in sessionStorage');
          }
          sessionStorage.setItem('verifiedOTP', otpCode);
          sessionStorage.setItem('emailVerified', 'true');
          console.log('✓ emailVerified flag set to true');

          // Mark step as complete
          completeStep('verify-otp', { emailVerified: true });

          // Check if user already has an account
          if (response.tenantId) {
            // Existing user - redirect to login (login page will fetch onboarding state from backend)
            toast.success('Account found!', 'Please log in to continue your setup.');
            router.push('/login');
          } else {
            // New user - redirect to account creation
            toast.success('Email verified!', 'Continuing to account creation.');
            router.push(ROUTES.GET_STARTED.CREATE_ACCOUNT);
          }
        },
        onError: (error: unknown) => {
          console.error('OTP verification failed:', error);

          // Extract error message from response
          const err = error as { response?: { data?: { message?: string; error?: string } } };
          const errorMessage = err?.response?.data?.message || err?.response?.data?.error || 'Invalid code. Please try again.';

          toast.error('Verification failed', errorMessage);
          setOtp(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        },
      }
    );
  };

  const handleResend = async () => {
    resendOtpMutation.mutate(
      { data: { email } },
      {
        onSuccess: () => {
          toast.success('Code resent!', 'Check your email for the new code.');
          setOtp(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        },
        onError: (error: unknown) => {
          console.error('Failed to resend OTP:', error);

          // Extract error message from response
          const err = error as { response?: { data?: { message?: string; error?: string } } };
          const errorMessage = err?.response?.data?.message || err?.response?.data?.error || 'Please try again.';

          toast.error('Failed to resend code', errorMessage);
        },
      }
    );
  };

  const handleBack = () => {
    goBack();
  };

  return (
    <OnboardingLayout
      title="Verify your email"
      description={`Enter the 6-digit code sent to ${email}`}
    >
      <div className="space-y-6">
        {/* OTP Input */}
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-lg font-semibold"
              disabled={verifyOtpMutation.isPending}
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>

        {/* Resend Button */}
        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={handleResend}
            disabled={resendOtpMutation.isPending || verifyOtpMutation.isPending}
            loading={resendOtpMutation.isPending}
            loadingText="Sending..."
            className="text-sm"
          >
            Didn&apos;t receive the code? Resend
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={verifyOtpMutation.isPending}
            size="default"
            className="min-w-[140px] text-sm"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleVerify}
            disabled={verifyOtpMutation.isPending || otp.some((d) => !d)}
            loading={verifyOtpMutation.isPending}
            loadingText="Verifying..."
            size="default"
            className="min-w-[140px] text-sm"
          >
            Verify
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
