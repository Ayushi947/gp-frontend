'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  IconArrowLeft,
  IconMailCheck,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { useForgotPassword } from '@/api/generated/endpoints/authentication/authentication';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const forgotPasswordMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    const email = data.email.trim();

    forgotPasswordMutation.mutate(
      { data: { email } },
      {
        onSuccess: () => {
          setSubmittedEmail(email);
          setIsSubmitted(true);
          toast.success('Email sent!', 'Check your inbox for password reset instructions.');
        },
        onError: () => {
          // Still show success to prevent email enumeration attacks
          setSubmittedEmail(email);
          setIsSubmitted(true);
        },
      }
    );
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                  <IconMailCheck className="h-8 w-8 text-success" />
                </div>
              </div>
              <CardTitle className="text-2xl">Check your email</CardTitle>
              <CardDescription>
                We sent a password reset link to{' '}
                <span className="font-medium text-foreground">{submittedEmail}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                If you don&apos;t see the email, check your spam folder. The link will
                expire in 1 hour.
              </p>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsSubmitted(false);
                  setSubmittedEmail('');
                }}
              >
                Try a different email
              </Button>

              <div className="text-center">
                <Link
                  href={ROUTES.AUTH.LOGIN}
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <IconArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <Card>
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
            <CardTitle className="text-2xl">Forgot password?</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  disabled={forgotPasswordMutation.isPending}
                  {...register('email')}
                  className={errors.email ? 'border-error' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-error">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={forgotPasswordMutation.isPending}
                loading={forgotPasswordMutation.isPending}
                loadingText="Sending..."
              >
                Send reset link
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href={ROUTES.AUTH.LOGIN}
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                <IconArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
