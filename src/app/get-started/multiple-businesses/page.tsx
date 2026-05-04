'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck, IconInfoCircle } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';

type MultipleBusiness = 'yes' | 'no';

interface BusinessOption {
  id: MultipleBusiness;
  title: string;
  description: string;
}

const businessOptions: BusinessOption[] = [
  {
    id: 'no',
    title: 'No, just this one',
    description: 'This is my only business',
  },
  {
    id: 'yes',
    title: 'Yes, I have multiple businesses',
    description: 'I own or have ownership interest in other businesses',
  },
];

export default function MultipleBusinessesPage() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<MultipleBusiness | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if previous step was completed
    const existingPlan = sessionStorage.getItem('existingPlan');
    if (!existingPlan) {
      toast.error('Missing information', 'Please complete previous steps first.');
      router.push(ROUTES.GET_STARTED.EXISTING_PLAN);
      return;
    }

    // Load saved data if exists
    const savedOption = sessionStorage.getItem('hasMultipleBusinesses') as MultipleBusiness | null;
    if (savedOption) {
      setSelectedOption(savedOption);
    }
  }, [router]);

  const handleContinue = () => {
    if (!selectedOption) {
      toast.error('Selection required', 'Please select an option.');
      return;
    }

    setIsLoading(true);
    sessionStorage.setItem('hasMultipleBusinesses', selectedOption);
    router.push(ROUTES.GET_STARTED.PAYROLL_PROVIDER);
  };

  const handleBack = () => {
    router.push(ROUTES.GET_STARTED.EXISTING_PLAN);
  };

  return (
    <OnboardingLayout
      title="Multiple Businesses"
      description="Do you own or have ownership interest in other businesses?"
      currentStep={7}
      totalSteps={19}
      milestoneStep={9}
    >
      <div className="space-y-6">
        {/* Business Options */}
        <div className="space-y-3">
          {businessOptions.map((option) => {
            const isSelected = selectedOption === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedOption(option.id)}
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

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
          <IconInfoCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            This helps us determine controlled group testing requirements and ensure
            your plan meets IRS regulations.
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
            disabled={!selectedOption || isLoading}
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
