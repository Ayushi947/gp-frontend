'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconCheck,
  IconSparkles,
  IconShield,
  IconUsers,
  IconBriefcase,
  IconLoader2,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';
import { useGetRecommendations } from '@/api/generated/endpoints/plan-recommendations/plan-recommendations';
import type { RecommendedPlan } from '@/api/generated/models';

// Normalize plan ID from backend to route-compatible format
const normalizePlanId = (planId: string | undefined): string => {
  if (!planId) return '';

  // Convert to lowercase and replace underscores/spaces with hyphens
  const normalized = planId.toLowerCase().replace(/[_\s]+/g, '-');

  // Ensure it has the expected format
  if (normalized.includes('traditional')) return 'traditional-401k';
  if (normalized.includes('safe-harbor') || normalized.includes('safeharbor')) return 'safe-harbor-401k';
  if (normalized.includes('starter')) return 'starter-401k';
  if (normalized.includes('solo')) return 'solo-401k';

  return normalized;
};

// Icon mapping for different plan types
const getPlanIcon = (planId: string) => {
  const normalizedId = normalizePlanId(planId);
  const iconMap: Record<string, React.ReactNode> = {
    'traditional-401k': <IconBriefcase className="h-6 w-6" />,
    'safe-harbor-401k': <IconShield className="h-6 w-6" />,
    'starter-401k': <IconUsers className="h-6 w-6" />,
    'solo-401k': <IconSparkles className="h-6 w-6" />,
  };
  return iconMap[normalizedId] || <IconBriefcase className="h-6 w-6" />;
};

// Copy-only description overrides so we don't repeat the plan type name
const getPlanDescription = (plan: RecommendedPlan): string | undefined => {
  const normalizedId = normalizePlanId(plan.id);

  const descriptionMap: Record<string, string> = {
    'traditional-401k': 'Most flexible option for employers and employees.',
    'safe-harbor-401k': 'Helps you avoid most annual IRS testing requirements.',
    'starter-401k': 'Simplest and most affordable.',
    'solo-401k': 'Designed for self-employed business owners with no employees.',
  };

  return descriptionMap[normalizedId] || plan.description;
};

export default function PlanRecommendationPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<RecommendedPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getRecommendationsMutation = useGetRecommendations();

  useEffect(() => {
    // Check if previous step was completed
    const payrollProvider = sessionStorage.getItem('payrollProvider');
    if (!payrollProvider) {
      toast.error('Missing information', 'Please complete previous steps first.');
      router.push(ROUTES.GET_STARTED.PAYROLL_PROVIDER);
      return;
    }

    // Get questionnaire answers from session storage
    const employmentStatus = sessionStorage.getItem('employmentStatus') || '';
    const businessSize = sessionStorage.getItem('businessSize') || '';
    const hasExistingPlan = sessionStorage.getItem('hasExistingPlan') || 'no';
    const hasMultipleBusinesses = sessionStorage.getItem('hasMultipleBusinesses') || 'no';

    // Fetch plan recommendations from backend
    getRecommendationsMutation.mutate(
      {
        data: {
          employmentStatus,
          businessSize,
          existingRetirementPlan: hasExistingPlan,
          hasMultipleBusinesses,
          payrollProvider,
        },
      },
      {
        onSuccess: (response) => {
          if (response.plans && response.plans.length > 0) {
            // Sort plans by displayOrder
            const sortedPlans = [...response.plans].sort(
              (a, b) => (a.displayOrder || 999) - (b.displayOrder || 999)
            );
            setPlans(sortedPlans);

            // Auto-select the recommended plan
            const recommended = sortedPlans.find((p) => p.isRecommended);
            if (recommended?.id) {
              setSelectedPlan(recommended.id);
            } else if (sortedPlans[0]?.id) {
              setSelectedPlan(sortedPlans[0].id);
            }

            // Load saved selection if exists
            const savedPlan = sessionStorage.getItem('selectedPlanType');
            if (savedPlan && sortedPlans.find((p) => p.id === savedPlan)) {
              setSelectedPlan(savedPlan);
            }
          }
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } } };
          toast.error(
            'Failed to load recommendations',
            err?.response?.data?.message || 'Please try again.'
          );
        },
      }
    );
  }, [router]);

  const handleContinue = () => {
    if (!selectedPlan) {
      toast.error('Selection required', 'Please select a plan type.');
      return;
    }

    setIsLoading(true);

    // Normalize plan ID before saving and routing
    const normalizedPlanId = normalizePlanId(selectedPlan);
    sessionStorage.setItem('selectedPlanType', normalizedPlanId);

    // Route to plan-specific configuration page
    const planRoutes: Record<string, string> = {
      'traditional-401k': '/get-started/traditional',
      'safe-harbor-401k': '/get-started/safe-harbor',
      'starter-401k': '/get-started/starter',
      'solo-401k': '/get-started/solo',
    };

    const targetRoute = planRoutes[normalizedPlanId] || ROUTES.GET_STARTED.BUSINESS_DETAILS;

    console.log('Selected plan:', selectedPlan);
    console.log('Normalized plan ID:', normalizedPlanId);
    console.log('Target route:', targetRoute);

    router.push(targetRoute);
  };

  const handleBack = () => {
    router.push(ROUTES.GET_STARTED.PAYROLL_PROVIDER);
  };

  // Show loading state while fetching recommendations
  if (getRecommendationsMutation.isPending) {
    return (
      <OnboardingLayout
        title="Choose Your Plan"
        description="Based on your responses we recommend the following plan option"
        currentStep={9}
        totalSteps={19}
        milestoneStep={9}
        maxWidth="2xl"
      >
        <div className="flex flex-col items-center justify-center py-12">
          <IconLoader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Analyzing your business needs...</p>
        </div>
      </OnboardingLayout>
    );
  }

  // Show error state if no plans available
  if (!getRecommendationsMutation.isPending && plans.length === 0) {
    return (
      <OnboardingLayout
        title="Choose Your Plan"
        description="Based on your responses we recommend the following plan option"
        currentStep={9}
        totalSteps={19}
        milestoneStep={9}
        maxWidth="2xl"
      >
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Unable to load plan recommendations.
          </p>
          <Button variant="outline" onClick={handleBack}>
            Go Back
          </Button>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      title="Choose Your Plan"
      description="Based on your responses we recommend the following plan option"
      currentStep={9}
      totalSteps={19}
      milestoneStep={9}
      maxWidth="5xl"
    >
      <div className="space-y-6">
        {/* Plan Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const features = plan.features
              ? plan.features.split(',').map((f) => f.trim())
              : [];

            return (
              <Card
                key={plan.id}
                className={cn(
                  'cursor-pointer transition-all duration-200 relative h-full flex flex-col border rounded-xl shadow-[0_4px_6px_-2px_rgba(16,24,40,0.12)]',
                  isSelected
                    ? 'bg-[#eff0fc] border-[#2563eb]'
                    : 'bg-white hover:bg-[#eff0fc] hover:border-[#2563eb]'
                )}
                onClick={() => setSelectedPlan(plan.id || null)}
              >
                {plan.isRecommended && (
                  <Badge className="absolute -top-2 -right-2 bg-primary">
                    Recommended
                  </Badge>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {getPlanIcon(plan.id || '')}
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <IconCheck className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-3">{plan.name}</CardTitle>
                  <CardDescription>{getPlanDescription(plan)}</CardDescription>

                  {/* Pricing Display */}
                  {plan.monthlyCost && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-2xl font-bold text-primary">
                        {plan.monthlyCost}
                      </div>
                      {plan.baseMonthlyCost !== undefined && plan.perEmployeeCost !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          ${plan.baseMonthlyCost} base + ${plan.perEmployeeCost} per employee/month
                        </p>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  {/* Features */}
                  {features.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Features:</h4>
                      <ul className="space-y-1.5">
                        {features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <IconCheck className="h-4 w-4 text-success flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendation Reasons */}
                  {plan.recommendationReasons && plan.recommendationReasons.length > 0 && (
                    <div className="pt-4 mt-2 border-t">
                      <h4 className="text-sm font-semibold mb-3 text-primary">
                        Why we recommend this:
                      </h4>
                      <ul className="space-y-2">
                        {plan.recommendationReasons.map((reason, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2.5 text-sm text-muted-foreground"
                          >
                            <IconSparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
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
            disabled={!selectedPlan || isLoading}
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
