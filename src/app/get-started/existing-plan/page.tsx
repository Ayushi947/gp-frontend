'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';

type ExistingPlan = 'yes' | 'no';

interface PlanOption {
  id: ExistingPlan;
  title: string;
  description: string;
}

const planOptions: PlanOption[] = [
  {
    id: 'no',
    title: 'No, this is a new plan',
    description: "We're starting fresh with a new 401(k) plan",
  },
  {
    id: 'yes',
    title: 'Yes, we have an existing plan',
    description: "We're looking to transfer or add to our current retirement plan",
  },
];

export default function ExistingPlanPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<ExistingPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if previous step was completed
    const planPriority = sessionStorage.getItem('planPriority');
    if (!planPriority) {
      toast.error('Missing information', 'Please complete previous steps first.');
      router.push(ROUTES.GET_STARTED.PLAN_PRIORITY);
      return;
    }

    // Load saved data if exists
    const savedPlan = sessionStorage.getItem('existingPlan') as ExistingPlan | null;
    if (savedPlan) {
      setSelectedPlan(savedPlan);
    }
  }, [router]);

  const handleContinue = () => {
    if (!selectedPlan) {
      toast.error('Selection required', 'Please select an option.');
      return;
    }

    setIsLoading(true);
    sessionStorage.setItem('existingPlan', selectedPlan);
    router.push(ROUTES.GET_STARTED.MULTIPLE_BUSINESSES);
  };

  const handleBack = () => {
    router.push(ROUTES.GET_STARTED.PLAN_PRIORITY);
  };

  return (
    <OnboardingLayout
      title="Existing 401(k) Plan"
      description="Does your company currently have a 401(k) plan?"
      currentStep={6}
      totalSteps={19}
      milestoneStep={9}
    >
      <div className="space-y-6">
        {/* Plan Options */}
        <div className="space-y-3">
          {planOptions.map((option) => {
            const isSelected = selectedPlan === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedPlan(option.id)}
                className={cn(
                  'w-full text-left p-4 rounded-lg border-2 transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{option.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <IconCheck className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </button>
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
