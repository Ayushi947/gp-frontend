'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  IconArrowRight,
  IconShieldCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { useVerifyIdentity } from '@/api/generated/endpoints/authentication/authentication';

const identitySchema = z.object({
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be in MM/DD/YYYY format'),
  securityAcknowledged: z.boolean().refine((val) => val === true, 'Please acknowledge the security statement'),
});

type IdentityFormData = z.infer<typeof identitySchema>;

export default function IdentityVerificationPage() {
  const router = useRouter();
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [email, setEmail] = useState<string>('');

  const verifyIdentityMutation = useVerifyIdentity();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IdentityFormData>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      lastName: '',
      dateOfBirth: '',
      securityAcknowledged: false,
    },
  });

  const securityAcknowledged = watch('securityAcknowledged');

  useEffect(() => {
    // Check if we have required data from previous steps
    const storedEmail = sessionStorage.getItem('participantEmail');
    const participantToken = sessionStorage.getItem('participantToken');
    const inviteToken = sessionStorage.getItem('participantInviteToken');

    // User can come from OTP verification (participantToken) or invite link (inviteToken)
    if (!storedEmail || (!participantToken && !inviteToken)) {
      toast.error('Session expired', 'Please start over.');
      router.push(ROUTES.PARTICIPANT_ENROLLMENT.EMAIL);
      return;
    }

    setEmail(storedEmail);
  }, [router]);

  const formatDate = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as MM/DD/YYYY
    if (digits.length <= 2) {
      return digits;
    }
    if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDate(e.target.value);
    setValue('dateOfBirth', formatted);
  };

  const onSubmit = async (data: IdentityFormData) => {
    setVerificationFailed(false);

    // Convert date from MM/DD/YYYY to YYYY-MM-DD
    const [month, day, year] = data.dateOfBirth.split('/');
    const formattedDate = `${year}-${month}-${day}`;

    // Use invite token if available, otherwise use OTP-derived participant token
    const inviteToken = sessionStorage.getItem('participantInviteToken');
    const participantToken = sessionStorage.getItem('participantToken');

    verifyIdentityMutation.mutate(
      {
        data: {
          lastName: data.lastName.trim(),
          last4Ssn: '', // TODO: Add SSN field to form if required for verification
          dateOfBirth: formattedDate,
          tenantId: sessionStorage.getItem('participantTenantId') || undefined,
        },
      },
      {
        onSuccess: (response) => {
          if (!response.verified) {
            setVerificationFailed(true);
            toast.error(
              'Verification failed',
              response.message || "The information you provided doesn't match our records."
            );
            return;
          }

          // Store name for set-password page
          if (response.firstName) {
            sessionStorage.setItem('participantFirstName', response.firstName);
          }
          sessionStorage.setItem('participantLastName', response.lastName || data.lastName.trim());

          toast.success('Identity verified!', 'Continuing to set your password.');
          router.push(ROUTES.PARTICIPANT_ENROLLMENT.SET_PASSWORD);
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } } };
          setVerificationFailed(true);
          toast.error(
            'Verification failed',
            err?.response?.data?.message || 'Please try again.'
          );
        },
      }
    );
  };

  return (
    <OnboardingLayout
      title="Verify Your Identity"
      description="To protect your account, please confirm your identity with the information on file."
      currentStep={3}
      totalSteps={5}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Last Name */}
        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name <span className="text-error">*</span>
          </Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Enter your last name"
            disabled={verifyIdentityMutation.isPending}
            {...register('lastName')}
            className={errors.lastName ? 'border-error' : ''}
          />
          {errors.lastName && (
            <p className="text-xs text-error">{errors.lastName.message}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">
            Date of Birth <span className="text-error">*</span>
          </Label>
          <Input
            id="dateOfBirth"
            type="text"
            placeholder="MM/DD/YYYY"
            maxLength={10}
            disabled={verifyIdentityMutation.isPending}
            {...register('dateOfBirth')}
            onChange={handleDateChange}
            className={errors.dateOfBirth ? 'border-error' : ''}
          />
          {errors.dateOfBirth && (
            <p className="text-xs text-error">{errors.dateOfBirth.message}</p>
          )}
        </div>

        {/* Security Acknowledgment */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="securityAcknowledged"
            checked={securityAcknowledged}
            onCheckedChange={(checked) => setValue('securityAcknowledged', checked as boolean)}
            disabled={verifyIdentityMutation.isPending}
          />
          <Label htmlFor="securityAcknowledged" className="text-sm cursor-pointer">
            I understand that my information is used only for verification and is kept secure.
          </Label>
        </div>
        {errors.securityAcknowledged && (
          <p className="text-xs text-error">{errors.securityAcknowledged.message}</p>
        )}

        {/* Security Banner */}
        {!verificationFailed && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
            <IconShieldCheck className="h-5 w-5 text-success flex-shrink-0" />
            <span className="text-sm font-medium">
              Your information is encrypted and securely stored
            </span>
          </div>
        )}

        {/* Verification Failed Banner */}
        {verificationFailed && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-error/10 border border-error/20">
            <IconAlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-error">Verification Failed</p>
              <p className="text-sm text-muted-foreground mt-1">
                The information you provided doesn&apos;t match our records. Please double-check and try again.
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={verifyIdentityMutation.isPending}
            loading={verifyIdentityMutation.isPending}
            loadingText="Verifying..."
            size="default"
            className="min-w-[140px] text-sm"
          >
            {verificationFailed ? 'Try Again' : 'Verify & Continue'}
            <IconArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
}
