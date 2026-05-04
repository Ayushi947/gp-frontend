'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IconMail } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { useSponsorOnboarding } from '@/hooks';
import { useSendOTPForEmployer } from '@/api/generated/endpoints/authentication/authentication';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type EmailFormData = z.infer<typeof emailSchema>;

export default function SponsorEmailPage() {
  const { data: onboardingData, completeStep, goBack, isHydrated } = useSponsorOnboarding();
  const sendOtpMutation = useSendOTPForEmployer();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  // Restore email from saved progress
  useEffect(() => {
    if (isHydrated && onboardingData.email) {
      setValue('email', onboardingData.email);
    }
  }, [isHydrated, onboardingData.email, setValue]);

  const onSubmit = async (data: EmailFormData) => {
    const email = data.email.trim();

    sendOtpMutation.mutate(
      { data: { email } },
      {
        onSuccess: () => {
          // Store email in session storage (for backward compat)
          sessionStorage.setItem('sponsorEmail', email);

          toast.success('Verification code sent!', 'Please check your email inbox.');

          // Mark email step complete and save the email in onboarding progress
          completeStep('email', { email });
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } } };
          toast.error(
            'Failed to send verification code',
            err?.response?.data?.message || 'Please try again.'
          );
        },
      }
    );
  };

  const handleBack = () => {
    goBack();
  };

  return (
    <OnboardingLayout
      title="Let's get started"
      description="Enter your work email to begin setting up your company's 401(k) plan"
      titleClassName="text-[#2563EB]"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
          <IconMail className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            We'll send you a verification code to confirm your email address.
          </p>
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Work Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            autoComplete="email"
            disabled={sendOtpMutation.isPending}
            {...register('email')}
            className={errors.email ? 'border-error' : ''}
          />
          {errors.email && (
            <p className="text-xs text-error">{errors.email.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={sendOtpMutation.isPending}
            size="default"
            className="min-w-[140px] text-sm"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={sendOtpMutation.isPending}
            loading={sendOtpMutation.isPending}
            loadingText="Sending..."
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
