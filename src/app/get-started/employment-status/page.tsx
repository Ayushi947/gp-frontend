'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';

type EmploymentStatus = 'independent-contractor' | 'solo-owner' | 'owner-with-employees' | 'company-representative';

interface StatusOption {
  id: EmploymentStatus;
  title: string;
  description: string;
}

const statusOptions: StatusOption[] = [
  {
    id: 'independent-contractor',
    title: 'Independent Contractor / Freelancer',
    description: "I'm an independent contractor/freelancer/self-employed with 1099 income",
  },
  {
    id: 'solo-owner',
    title: 'Solo Business Owner',
    description: "I'm a business owner with no W-2 employees (other than spouse)",
  },
  {
    id: 'owner-with-employees',
    title: 'Business Owner with Employees',
    description: "I'm a business owner with active W-2 employees other than myself/spouse",
  },
  {
    id: 'company-representative',
    title: 'Company Representative',
    description: "I'm representing a company that has active W-2 employees",
  },
];

export default function EmploymentStatusPage() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<EmploymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if company info exists
    const companyName = sessionStorage.getItem('companyName');
    if (!companyName) {
      toast.error('Missing information', 'Please complete company information first.');
      router.push(ROUTES.GET_STARTED.COMPANY_INFO);
      return;
    }

    // Load saved data if exists
    const savedStatus = sessionStorage.getItem('employmentStatus') as EmploymentStatus | null;
    if (savedStatus) {
      setSelectedStatus(savedStatus);
    }
  }, [router]);

  const handleContinue = () => {
    if (!selectedStatus) {
      toast.error('Selection required', 'Please select an employment status.');
      return;
    }

    setIsLoading(true);
    sessionStorage.setItem('employmentStatus', selectedStatus);
    router.push(ROUTES.GET_STARTED.BUSINESS_SIZE);
  };

  const handleBack = () => {
    router.push(ROUTES.GET_STARTED.COMPANY_INFO);
  };

  return (
    <OnboardingLayout
      title="Company Type"
      description="Which of the below best describes you?"
      currentStep={3}
      totalSteps={19}
      milestoneStep={9}
    >
      <div className="space-y-6">
        {/* Status Options */}
        <div className="space-y-3">
          {statusOptions.map((option) => {
            const isSelected = selectedStatus === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedStatus(option.id)}
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
            disabled={!selectedStatus || isLoading}
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
