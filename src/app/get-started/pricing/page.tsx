'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconCheck,
  IconInfoCircle,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  priceUnit: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 79,
    priceUnit: '/month',
    description: 'Perfect for small businesses just getting started',
    features: [
      'Up to 10 participants',
      'Basic compliance support',
      'Email support',
      'Standard reporting',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 149,
    priceUnit: '/month',
    description: 'For growing businesses with more employees',
    features: [
      'Up to 50 participants',
      'Full compliance testing',
      'Priority support',
      'Advanced reporting',
      'Dedicated account manager',
    ],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    priceUnit: '/month',
    description: 'For large organizations with complex needs',
    features: [
      'Unlimited participants',
      'Custom plan design',
      '24/7 phone support',
      'Custom integrations',
      'On-site training',
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if previous step was completed
    const planType = sessionStorage.getItem('selectedPlanType');
    if (!planType) {
      toast.error('Missing information', 'Please select a plan type first.');
      router.push(ROUTES.GET_STARTED.PLAN_RECOMMENDATION);
      return;
    }

    // Load saved selection if exists
    const savedTier = sessionStorage.getItem('selectedPricingTier');
    if (savedTier) {
      setSelectedTier(savedTier);
    } else {
      // Pre-select recommended tier
      const recommended = pricingTiers.find((t) => t.recommended);
      if (recommended) {
        setSelectedTier(recommended.id);
      }
    }
  }, [router]);

  const handleContinue = () => {
    if (!selectedTier) {
      toast.error('Selection required', 'Please select a pricing tier.');
      return;
    }

    setIsLoading(true);
    sessionStorage.setItem('selectedPricingTier', selectedTier);
    router.push(ROUTES.GET_STARTED.BANK_ACCOUNT);
  };

  const handleBack = () => {
    router.push(ROUTES.GET_STARTED.PLAN_RECOMMENDATION);
  };

  return (
    <OnboardingLayout
      title="Choose Your Plan"
      description="Select the pricing tier that best fits your needs"
      currentStep={6}
      totalSteps={7}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pricingTiers.map((tier) => {
            const isSelected = selectedTier === tier.id;
            return (
              <Card
                key={tier.id}
                className={cn(
                  'cursor-pointer transition-all duration-200 hover:shadow-md relative',
                  isSelected
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-primary/50'
                )}
                onClick={() => setSelectedTier(tier.id)}
              >
                {tier.recommended && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                    Recommended
                  </Badge>
                )}
                <CardHeader className="text-center pb-3">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${tier.price}</span>
                    <span className="text-muted-foreground">{tier.priceUnit}</span>
                  </div>
                  <CardDescription className="mt-2">{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <IconCheck className="h-4 w-4 text-success flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {isSelected && (
                    <div className="mt-4 flex justify-center">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <IconCheck className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
          <IconInfoCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            All plans include a 30-day free trial. You can upgrade or downgrade at any time.
            No long-term contracts required.
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
            type="button"
            onClick={handleContinue}
            disabled={!selectedTier || isLoading}
            loading={isLoading}
            loadingText="Loading..."
            size="default"
            className="min-w-[140px] text-sm"
          >
            Continue
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
