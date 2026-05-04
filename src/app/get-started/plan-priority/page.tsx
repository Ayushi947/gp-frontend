'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';

type PlanPriority =
  | 'owner_savings'
  | 'employee_savings'
  | 'retain_talent'
  | 'state_mandate'
  | 'unsure';

interface PriorityOption {
  id: PlanPriority;
  label: string;
}

const priorityOptions: PriorityOption[] = [
  {
    id: 'owner_savings',
    label: 'Maximizing savings for business owner & spouse',
  },
  {
    id: 'employee_savings',
    label: 'Enabling employees to save for retirement',
  },
  {
    id: 'retain_talent',
    label: 'Retaining top talent',
  },
  {
    id: 'state_mandate',
    label: 'Complying with the state mandate of offering a retirement plan',
  },
  {
    id: 'unsure',
    label: 'Unsure',
  },
];

export default function PlanPriorityPage() {
  const router = useRouter();
  const [selectedPriority, setSelectedPriority] = useState<PlanPriority | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if previous step was completed
    const businessSize = sessionStorage.getItem('businessSize');
    if (!businessSize) {
      toast.error('Missing information', 'Please complete previous steps first.');
      router.push(ROUTES.GET_STARTED.BUSINESS_SIZE);
      return;
    }

    // Load saved data if exists
    const savedPriority = sessionStorage.getItem('planPriority') as PlanPriority | null;
    if (savedPriority) {
      setSelectedPriority(savedPriority);
    }
  }, [router]);

  const handleContinue = () => {
    if (!selectedPriority) {
      toast.error('Selection required', 'Please select your top priority.');
      return;
    }

    setIsLoading(true);
    sessionStorage.setItem('planPriority', selectedPriority);
    router.push(ROUTES.GET_STARTED.EXISTING_PLAN);
  };

  const handleBack = () => {
    router.push(ROUTES.GET_STARTED.BUSINESS_SIZE);
  };

  return (
    <OnboardingLayout
      title="Plan Priority"
      description="What is your top priority in looking for a 401(k) retirement plan?"
      currentStep={5}
      totalSteps={19}
      milestoneStep={9}
    >
      <div className="space-y-6">
        {/* Priority Options */}
        <div className="space-y-3">
          {priorityOptions.map((option) => {
            const isSelected = selectedPriority === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedPriority(option.id)}
                className={cn(
                  'w-full text-left p-4 rounded-lg border-2 transition-all flex items-center justify-between',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                <span className="font-medium">{option.label}</span>
                {isSelected && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <IconCheck className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
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
            disabled={!selectedPriority || isLoading}
            loading={isLoading}
            loadingText="Loading..."
            size="default"
            className="min-w-[140px] text-sm"
          >
            Next
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
