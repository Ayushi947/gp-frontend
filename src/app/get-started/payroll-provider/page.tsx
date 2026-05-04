'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck, IconSearch } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FormSelect } from '@/components/ui/FormSelect';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { useSponsorOnboarding } from '@/hooks/useSponsorOnboarding';

// Common Finch-supported payroll providers
const PAYROLL_PROVIDERS = [
  'ADP',
  'ADP Workforce Now',
  'ADP Run',
  'Bamboo HR',
  'Gusto',
  'Justworks',
  'Paychex',
  'Paychex Flex',
  'Paylocity',
  'Rippling',
  'TriNet',
  'UKG Pro',
  'Workday',
  'Zenefits',
  'No payroll',
  'Other',
];

export default function PayrollProviderPage() {
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data } = useSponsorOnboarding();
  const planType = data.selectedPlanType;
  const filteredProviders =
      planType?.toLowerCase().includes('solo')
          ? PAYROLL_PROVIDERS
          : PAYROLL_PROVIDERS.filter(p => p !== 'No payroll');

  useEffect(() => {
    // Check if previous step was completed
    const multipleBusinesses = sessionStorage.getItem('hasMultipleBusinesses');
    if (!multipleBusinesses) {
      toast.error('Missing information', 'Please complete previous steps first.');
      router.push(ROUTES.GET_STARTED.MULTIPLE_BUSINESSES);
      return;
    }

    // Load saved data if exists
    const savedProvider = sessionStorage.getItem('payrollProvider');
    if (savedProvider) {
      if (PAYROLL_PROVIDERS.includes(savedProvider)) {
        setSelectedProvider(savedProvider);
      } else {
        setSelectedProvider('Other');
        setShowCustomInput(true);
      }
    }
  }, [router]);

  const handleProviderChange = (value: string) => {
    setSelectedProvider(value);
    if (value === 'Other') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
    }
  };

  const handleContinue = () => {
    const provider = selectedProvider;

    if (!provider) {
      toast.error('Selection required', 'Please select or enter a payroll provider.');
      return;
    }

    if (provider === 'Other') {
      toast.info('GP team will contact you');
      return;
    }

    setIsLoading(true);
    sessionStorage.setItem('payrollProvider', provider);
    router.push(ROUTES.GET_STARTED.PLAN_RECOMMENDATION);
  };

  const handleBack = () => {
    router.push(ROUTES.GET_STARTED.MULTIPLE_BUSINESSES);
  };

  return (
    <OnboardingLayout
      title="Payroll Provider"
      description="Which payroll provider do you use?"
      currentStep={8}
      totalSteps={19}
      milestoneStep={9}
    >
      <div className="space-y-6">
        {/* Provider Select */}
        <div className="space-y-2">
          <Label>Select your payroll provider</Label>
          <FormSelect
            label=""
            options={filteredProviders.map((provider) => ({
              value: provider,
              label: provider,
            }))}
            value={selectedProvider}
            onValueChange={handleProviderChange}
            placeholder="Choose a provider..."
          />
        </div>

        {/* Info message for non-standard provider */}
        {showCustomInput && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted border border-border">
            <IconSearch className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Currently we do not have an automated connection for your payroll provider.
              </p>
              <p className="text-xs text-muted-foreground">
                A member of our sales team will contact you with details.
              </p>
            </div>
          </div>
        )}

        {/* Selected Provider Confirmation */}
        {selectedProvider && selectedProvider !== 'Other' && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
            <IconCheck className="h-5 w-5 text-success flex-shrink-0" />
            <span className="text-sm font-medium">
              Selected: {selectedProvider}
            </span>
          </div>
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
            disabled={
                !selectedProvider || isLoading || selectedProvider === 'Other'
            }
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
