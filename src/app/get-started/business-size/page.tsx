'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';

type BusinessSize = '0-5' | '6-50' | '51-99' | '100-500' | '500+';

interface SizeOption {
  id: BusinessSize;
  label: string;
}

const sizeOptions: SizeOption[] = [
  { id: '0-5', label: '0-5 Employees' },
  { id: '6-50', label: '6-50 Employees' },
  { id: '51-99', label: '51-99 Employees' },
  { id: '100-500', label: '100-500 Employees' },
  { id: '500+', label: '500+ Employees' },
];

export default function BusinessSizePage() {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<BusinessSize | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSolo, setIsSolo] = useState(false);

  useEffect(() => {
    // Check if previous step was completed
    const employmentStatus = sessionStorage.getItem('employmentStatus');
    if (!employmentStatus) {
      toast.error('Missing information', 'Please complete previous steps first.');
      router.push(ROUTES.GET_STARTED.EMPLOYMENT_STATUS);
      return;
    }

    // Check if solo - if so, only show 0-5 option
    const isSoloStatus = employmentStatus === 'solo';
    setIsSolo(isSoloStatus);

    if (isSoloStatus) {
      setSelectedSize('0-5');
    } else {
      // Load saved data if exists
      const savedSize = sessionStorage.getItem('businessSize') as BusinessSize | null;
      if (savedSize) {
        setSelectedSize(savedSize);
      }
    }
  }, [router]);

  const availableOptions = isSolo
    ? sizeOptions.filter((opt) => opt.id === '0-5')
    : sizeOptions;

  const handleContinue = () => {
    if (!selectedSize) {
      toast.error('Selection required', 'Please select your business size.');
      return;
    }

    setIsLoading(true);
    sessionStorage.setItem('businessSize', selectedSize);
    router.push(ROUTES.GET_STARTED.PLAN_PRIORITY);
  };

  const handleBack = () => {
    router.push(ROUTES.GET_STARTED.EMPLOYMENT_STATUS);
  };

  return (
    <OnboardingLayout
      title="Company Size"
      description="How many employees does your company have?"
      currentStep={4}
      totalSteps={19}
      milestoneStep={9}
    >
      <div className="space-y-6">
        {/* Size Options */}
        <div className="space-y-3">
          {availableOptions.map((option) => {
            const isSelected = selectedSize === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedSize(option.id)}
                className={cn(
                  'w-full text-left p-4 rounded-lg border-2 transition-all flex items-center justify-between',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                <span className="font-medium">{option.label}</span>
                {isSelected && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <IconCheck className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {isSolo && (
          <p className="text-sm text-muted-foreground text-center">
            Based on your employment status, only 0-5 employees option is available.
          </p>
        )}

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
            disabled={!selectedSize || isLoading}
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
