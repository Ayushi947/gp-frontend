'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconShieldCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';

export default function AuthorizeProviderPage() {
  const router = useRouter();
  const [checks, setChecks] = useState([false, false, false]);
  const [companyName, setCompanyName] = useState('');

  // Check authorization texts
  const checkboxTexts = [
    `I agree to provide GlidingPath with valid email addresses for all ${companyName || 'Company'} employees and owners if they are not available in my payroll to ensure participants receive electronic enrollment notices and communications regarding their plan.`,
    'I hereby authorize and appoint GlidingPath, LLC as the investment manager of the Plan within the meaning of section 3(38) of ERISA.',
    'I hereby authorize and appoint GlidingPath, Inc. as the Plan Administrator within the meaning of section 3(16) of ERISA.',
  ];

  useEffect(() => {
    // Check if previous step was completed
    const trusteeData = sessionStorage.getItem('trusteeData');
    if (!trusteeData) {
      toast.warning('Missing information', 'Please complete trustee confirmation first.');
      router.push(ROUTES.GET_STARTED.CONFIRM_TRUSTEE);
      return;
    }

    const companyName = sessionStorage.getItem('companyName');
    if (companyName) {
      try {
        const parsed = JSON.parse(companyName);
        setCompanyName(parsed.companyName || '');
      } catch (e) {
        console.error('Error parsing onboarding data', e);
      }
    }

    // Load saved authorization state if exists
    const savedData = sessionStorage.getItem('authorizationData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed.checks)) {
          setChecks(parsed.checks);
        }
      } catch (error) {
        console.error('Failed to parse saved authorization data', error);
      }
    }
  }, [router]);

  const handleCheckboxChange = (index: number) => {
    setChecks((prev) => prev.map((check, i) => (i === index ? !check : check)));
  };

  const handleBack = () => {
    router.push(ROUTES.GET_STARTED.CONFIRM_TRUSTEE);
  };

  const handleSaveAndContinue = () => {
    if (checks.some((check) => !check)) {
      toast.error('Authorization required', 'Please accept all authorizations to continue');
      return;
    }

    // Save authorization data
    const authorizationData = {
      checks,
      timestamp: new Date().toISOString(),
    };

    sessionStorage.setItem('authorizationData', JSON.stringify(authorizationData));

    toast.success('Authorization complete', 'All authorizations have been accepted');

    // Navigate to next step
    router.push(ROUTES.GET_STARTED.REVIEW_AND_SIGN_DOCUMENT);
  };

  return (
    <OnboardingLayout
      title="Authorize Service Provider"
      description="Review and accept required authorizations"
      currentStep={6}
      totalSteps={10}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Authorization Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShieldCheck className="h-5 w-5" />
              Required Authorizations
            </CardTitle>
            <CardDescription>
              Please review and accept the following authorizations to proceed with your plan setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checkboxTexts.map((text, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    id={`checkbox-${index}`}
                    checked={checks[index]}
                    onChange={() => handleCheckboxChange(index)}
                    className="h-4 w-4 rounded border-gray-300 mt-0.5"
                  />
                  <Label
                    htmlFor={`checkbox-${index}`}
                    className="text-sm text-gray-700 leading-relaxed cursor-pointer flex-1"
                  >
                    {text}
                  </Label>
                </div>
              ))}
            </div>

            {/* Progress Indicator */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Progress: {checks.filter(Boolean).length} of {checks.length} authorizations
                </span>
                <span
                  className={`font-medium ${
                    checks.every(Boolean) ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {checks.every(Boolean) ? '✓ All Complete' : 'Incomplete'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-6">
          <Button
            variant="outline"
            onClick={handleBack}
            size="default"
            className="min-w-[140px] text-sm"
          >
            Back
          </Button>
          <Button
            onClick={handleSaveAndContinue}
            disabled={checks.some((check) => !check)}
            size="default"
            className="min-w-[140px] text-sm"
          >
            Save and Continue
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
