'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck, IconInfoCircle, IconSparkles } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { useGetPricingInfo } from '@/api/generated/endpoints/pricing-integration/pricing-integration';
import { useGetDetails } from '@/api/generated/endpoints/plan-sponsor-details/plan-sponsor-details';

export default function ReviewPricingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState<string>('');

  const { data: pricingData, isLoading: isLoadingPricing, error } = useGetPricingInfo();

  // Fetch company details from database instead of sessionStorage
  const { data: companyDetails, isLoading: isLoadingDetails } = useGetDetails();

  useEffect(() => {
    // Check if business details exist in database (not sessionStorage)
    if (!isLoadingDetails && !companyDetails?.companyDetails) {
      toast.error('Missing information', 'Please complete business details first.');
      router.push(ROUTES.GET_STARTED.BUSINESS_DETAILS);
      return;
    }

    // Load selected plan type from sessionStorage (or could be from DB if we add it there)
    const planType = sessionStorage.getItem('selectedPlanType');
    if (planType) {
      setSelectedPlanType(planType);
    }
  }, [router, isLoadingDetails, companyDetails]);

  const handleContinue = () => {
    setIsLoading(true);
    router.push(ROUTES.GET_STARTED.CHECKOUT);
  };

  const handleBack = () => {
    router.push(ROUTES.GET_STARTED.BUSINESS_DETAILS);
  };

  if (isLoadingPricing || isLoadingDetails) {
    return (
      <OnboardingLayout
        title="Review Pricing"
        description="Confirm your plan pricing"
        currentStep={14}
        totalSteps={22}
        milestoneStep={12}
        maxWidth="3xl"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {isLoadingDetails ? 'Loading your details...' : 'Loading pricing information...'}
            </p>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  if (error) {
    return (
      <OnboardingLayout
        title="Review Pricing"
        description="Confirm your plan pricing"
        currentStep={14}
        totalSteps={22}
        milestoneStep={12}
        maxWidth="3xl"
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <IconInfoCircle className="h-16 w-16 text-destructive" />
            <p className="text-lg font-semibold">Error loading pricing information</p>
            <p className="text-sm text-muted-foreground mb-2">
              {String((error as Error)?.message || 'Unable to load pricing')}
            </p>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={handleBack}>
                Go Back
              </Button>
              <Button onClick={handleContinue} disabled={isLoading} loading={isLoading} loadingText="Loading...">
                Continue to Checkout
              </Button>
            </div>
          </CardContent>
        </Card>
      </OnboardingLayout>
    );
  }

  // Find matching product from pricing data
  const selectedProduct = pricingData?.products?.find((productWithPrices) => {
    const productName = productWithPrices.product?.name?.toLowerCase().replace(/[()]/g, '') || '';
    const planType = selectedPlanType.toLowerCase().replace('-', ' ').replace(/[()]/g, '');
    return productName.includes(planType);
  });

  // Extract pricing from matched product
  const basePriceObj = selectedProduct?.prices?.find(
    (price) => price.recurring?.usageType === 'licensed'
  );
  const meteredPriceObj = selectedProduct?.prices?.find(
    (price) => price.recurring?.usageType === 'metered'
  );

  const baseFee = basePriceObj?.unitAmount ? basePriceObj.unitAmount / 100 : 0;
  const participantFee = meteredPriceObj?.unitAmount ? meteredPriceObj.unitAmount / 100 : 0;

  // Note: employerAccountFee and employeeAccountFee are not in Stripe pricing
  // They are investment management fees that may come from a different source
  const employerAccountFee = 0;
  const employeeAccountFee = 0;

  return (
    <OnboardingLayout
      title="Review Pricing"
      description="Confirm your plan pricing"
      currentStep={11}
      totalSteps={19}
      milestoneStep={9}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Tax Credit Banner */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <IconSparkles className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Tax Credit Available
                </h3>
                <p className="text-sm text-blue-700">
                  Small businesses may qualify for up to $16,500 in tax credits over 3 years when starting a new 401(k) plan.
                  This can significantly offset your startup and administrative costs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Plan Administration Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Plan Administration</span>
              </CardTitle>
              <CardDescription>
                Fees paid by employer for plan management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Base Fee */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Base Monthly Fee
                  </span>
                  <IconInfoCircle size={16} className="text-muted-foreground" />
                </div>
                <span className="text-lg font-bold">
                  ${baseFee.toFixed(2)}/mo
                </span>
              </div>

              {/* Per Participant Fee */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Per Participant Fee
                  </span>
                  <IconInfoCircle size={16} className="text-muted-foreground" />
                </div>
                <span className="text-lg font-bold">
                  ${participantFee.toFixed(2)}/participant/mo
                </span>
              </div>

              {/* Employee Account Fee */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Employee Account Fee
                  </span>
                  <IconInfoCircle size={16} className="text-muted-foreground" />
                </div>
                <span className="text-lg font-bold">
                  ${employeeAccountFee.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Investment Management Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Investment Management</span>
              </CardTitle>
              <CardDescription>
                Fees for investment services and account management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Employer Account Fee */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Employer Account Fee
                  </span>
                  <IconInfoCircle size={16} className="text-muted-foreground" />
                </div>
                <span className="text-lg font-bold">
                  ${employerAccountFee.toFixed(2)}
                </span>
              </div>

              {/* Additional Info */}
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-sm text-blue-700">
                  Investment management fees are competitive and transparent,
                  ensuring your employees get the best value for their retirement savings.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Summary */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-900 mb-1">
                  Estimated Monthly Cost
                </h3>
                <p className="text-sm text-green-700">
                  Based on your plan configuration
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-900">
                  ${baseFee.toFixed(2)}
                </div>
                <div className="text-sm text-green-700">
                  + ${participantFee.toFixed(2)}/participant
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
            disabled={isLoading}
            loading={isLoading}
            loadingText="Loading..."
            size="default"
            className="min-w-[140px] text-sm"
          >
            Continue to Checkout
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
