'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowRight, IconArrowLeft } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import {
  useVerifyOtpOnly,
  useSendOTPForEmployee,
} from '@/api/generated/endpoints/authentication/authentication';

export default function ParticipantVerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [email, setEmail] = useState<string>('');

  const verifyOtpMutation = useVerifyOtpOnly();
  const resendOtpMutation = useSendOTPForEmployee();

  useEffect(() => {
    // Get email from session storage
    const storedEmail = sessionStorage.getItem('participantEmail');
    if (!storedEmail) {
      toast.error('Session expired', 'Please enter your email again.');
      router.push(ROUTES.PARTICIPANT_ENROLLMENT.EMAIL);
      return;
    }
    setEmail(storedEmail);

    // Focus first input
    inputRefs.current[0]?.focus();
  }, [router]);

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

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
      { data: { email, otp: otpCode } },
      {
        onSuccess: (response) => {
          console.log('Participant OTP verification successful:', response);

          if (!response.verified) {
            toast.error('Verification failed', (response.message as string) || 'Invalid code. Please try again.');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            return;
          }

          // Store verification data in session storage
          if (response.participantToken) {
            sessionStorage.setItem('participantToken', response.participantToken as string);
          }
          if (response.tenantId) {
            sessionStorage.setItem('participantTenantId', response.tenantId as string);
          }
          sessionStorage.setItem('participantEmailVerified', 'true');

          toast.success('Email verified!', 'Continuing to identity verification.');
          router.push(ROUTES.PARTICIPANT_ENROLLMENT.IDENTITY_VERIFICATION);
        },
        onError: (error: unknown) => {
          console.error('Participant OTP verification failed:', error);

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
          console.error('Failed to resend participant OTP:', error);

          // Extract error message from response
          const err = error as { response?: { data?: { message?: string; error?: string } } };
          const errorMessage = err?.response?.data?.message || err?.response?.data?.error || 'Please try again.';

          toast.error('Failed to resend code', errorMessage);
        },
      }
    );
  };

  const handleBack = () => {
    router.push(ROUTES.PARTICIPANT_ENROLLMENT.EMAIL);
  };

  return (
    <OnboardingLayout
      title="Verify Your Email"
      description={`Enter the 6-digit code sent to ${email}`}
      currentStep={2}
      totalSteps={5}
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
            <IconArrowLeft className="h-4 w-4 mr-2" />
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
            Verify & Continue
            <IconArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
