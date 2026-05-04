'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import {
  IconCheck,
  IconLink,
  IconUsers,
  IconCalendarEvent,
  IconCreditCard,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { getFinchRedirectUrl } from '@/api/generated/endpoints/finch-oauth-authentication/finch-oauth-authentication';
import { useUpdateOnBoardingState } from '@/api/generated/endpoints/plan-sponsor-details/plan-sponsor-details';

const benefits = [
  {
    icon: <IconUsers className="h-5 w-5" />,
    title: 'Automatic employee sync',
    description: 'Employee data is automatically imported from your payroll system',
  },
  {
    icon: <IconCalendarEvent className="h-5 w-5" />,
    title: 'Eligibility calculation',
    description: 'Participants are automatically marked as eligible based on plan rules',
  },
  {
    icon: <IconCreditCard className="h-5 w-5" />,
    title: 'Contribution processing',
    description: '401(k) contributions are calculated from each payroll run',
  },
];

export default function FinchConnectPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isConnecting, setIsConnecting] = useState(false);

  const updateStateMutation = useUpdateOnBoardingState();

  useEffect(() => {
    // Check if we have the necessary session data
    const companyName = sessionStorage.getItem('companyName');
    if (!companyName) {
      toast.error('Session expired', 'Please start the onboarding process again.');
      router.push(ROUTES.GET_STARTED.ROOT);
    }
  }, [router]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Get Finch connect URL from backend using Orval-generated function
      const response = await getFinchRedirectUrl();

      if (response.url) {
        // Redirect to Finch OAuth flow
        window.location.href = response.url;
      } else {
        throw new Error('No connect URL received');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        'Connection failed',
        err?.response?.data?.message || 'Failed to connect to Finch. Please try again.'
      );
      setIsConnecting(false);
    }
  };

  const handleSkip = () => {
    updateStateMutation.mutate(
      { data: { state: 'DASHBOARD' } },
      {
        onSuccess: () => {
          toast.success('Setup complete!', 'You can connect your payroll later from Settings.');
          router.push(ROUTES.SPONSOR.DASHBOARD);
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } } };
          toast.error(
            'Failed to complete setup',
            err?.response?.data?.message || 'Please try again.'
          );
        },
      }
    );
  };

  return (
    <OnboardingLayout
      title="Connect Your Payroll"
      description="Connect your payroll provider to automatically sync employee data"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Finch Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative h-12 w-32">
            <Image
              src={theme === 'dark' ? '/assets/images/finch-logo-white.svg' : '/assets/images/finch-logo-black.svg'}
              alt="Finch"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Benefits Card */}
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <IconLink className="h-5 w-5 text-primary" />
              What happens when you connect?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {benefit.icon}
                </div>
                <div>
                  <h4 className="font-medium">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payroll Provider */}
        {(() => {
          const provider = typeof window !== 'undefined'
            ? sessionStorage.getItem('payrollProvider')
            : null;
          if (provider) {
            return (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                <IconCheck className="h-5 w-5 text-success flex-shrink-0" />
                <span className="text-sm">
                  Connecting to: <span className="font-medium">{provider}</span>
                </span>
              </div>
            );
          }
          return null;
        })()}

        {/* Action Buttons */}
        <div className="flex justify-center gap-6">
          <Button
            onClick={handleConnect}
            disabled={isConnecting || updateStateMutation.isPending}
            loading={isConnecting}
            loadingText="Connecting..."
            size="default"
            className="min-w-[140px] text-sm"
          >
            <IconLink className="h-4 w-4 mr-2" />
            Connect to Finch
          </Button>

          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isConnecting || updateStateMutation.isPending}
            loading={updateStateMutation.isPending}
            loadingText="Completing..."
            size="default"
            className="min-w-[140px] text-sm"
          >
            Skip for Now (Connect Later)
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-muted-foreground text-center">
          You can always connect your payroll provider later from{' '}
          <span className="font-medium">Settings &rarr; Integrations</span>
        </p>
      </div>
    </OnboardingLayout>
  );
}
