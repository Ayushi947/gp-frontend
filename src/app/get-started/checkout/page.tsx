'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconCreditCard,
  IconShieldCheck,
  IconLock,
  IconCheck,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import {
  useCreateCheckoutSession,
  useGetPricingInfo,
} from '@/api/generated/endpoints/pricing-integration/pricing-integration';
import { useGetDetails } from '@/api/generated/endpoints/plan-sponsor-details/plan-sponsor-details';
import { formatCurrency } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const { data: pricingData, isLoading: isLoadingPricing } = useGetPricingInfo();
  const { data: detailsData, isLoading: isLoadingDetails } = useGetDetails();
  const createCheckoutMutation = useCreateCheckoutSession();

  const [estimatedEmployeeCount, setEstimatedEmployeeCount] = useState<number>(0);
  const [selectedPlanType, setSelectedPlanType] = useState<string>('');

  // Guard: If payment was already completed, redirect forward to prevent double-charging
  useEffect(() => {
    const existingSessionId = sessionStorage.getItem('stripeSessionId');
    if (existingSessionId) {
      toast.info('Payment already completed', 'Redirecting to the next step.');
      router.replace(ROUTES.GET_STARTED.CONFIRM_PLAN_START_DATE);
    }
  }, [router]);

  useEffect(() => {
    // Fetch data from database instead of sessionStorage
    if (!isLoadingDetails && detailsData) {
      const employeeCount = detailsData.companyDetails?.estimatedEmployeeCount;
      const planType = detailsData.planDesign?.planType;

      if (!employeeCount || !planType) {
        toast.error('Missing information', 'Please complete pricing review first.');
        router.push(ROUTES.GET_STARTED.REVIEW_PRICING);
        return;
      }

      setEstimatedEmployeeCount(employeeCount);
      setSelectedPlanType(planType);
    }
  }, [router, isLoadingDetails, detailsData]);

  const handleBack = () => {
    router.push(ROUTES.GET_STARTED.REVIEW_PRICING);
  };

  const handleProceedToPayment = async () => {
    setIsCreatingSession(true);

    try {
      // Create checkout session
      // The backend will use the current plan details to determine pricing
      const response = await createCheckoutMutation.mutateAsync({
        data: {
          successUrl: `${window.location.origin}${ROUTES.GET_STARTED.CONFIRM_PLAN_START_DATE}?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}${ROUTES.GET_STARTED.CHECKOUT}`,
        },
      });

      const checkoutUrl = response.checkoutSessionUrl || response.sessionUrl;
      if (checkoutUrl) {
        // Do NOT save stripeSessionId here — it must only be saved when
        // Stripe redirects back with session_id after successful payment.
        // Saving it before redirect causes a false "already paid" state
        // if the user presses browser back from the Stripe page.

        // Redirect to Stripe checkout
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        'Failed to create checkout session',
        err?.response?.data?.message || 'Please try again.'
      );
      setIsCreatingSession(false);
    }
  };

  // Get pricing summary
  const selectedProduct = pricingData?.products?.find((productWithPrices) => {
    const productName = productWithPrices?.product?.name?.toLowerCase().replace(/[()]/g, '') || '';
    const planType = selectedPlanType.toLowerCase().replace('-', ' ').replace(/[()]/g, '');
    return productName.includes(planType);
  });

  const basePriceObj = selectedProduct?.prices?.find(
    (price) => price.recurring?.usageType === 'licensed'
  );
  const meteredPriceObj = selectedProduct?.prices?.find(
    (price) => price.recurring?.usageType === 'metered'
  );

  const baseMonthlyPrice = basePriceObj?.unitAmount ? basePriceObj.unitAmount / 100 : 0;
  const perEmployeePrice = meteredPriceObj?.unitAmount ? meteredPriceObj.unitAmount / 100 : 0;
  const totalMonthly = baseMonthlyPrice + perEmployeePrice * estimatedEmployeeCount;

  if (isLoadingPricing || isLoadingDetails) {
    return (
      <OnboardingLayout
        title="Checkout"
        description="Complete your subscription"
        currentStep={12}
        totalSteps={19}
        milestoneStep={9}
        maxWidth="3xl"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {isLoadingDetails ? 'Loading your details...' : 'Loading checkout...'}
            </p>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      title="Checkout"
      description="Complete your subscription"
      currentStep={12}
      totalSteps={19}
      milestoneStep={9}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Security Badge */}

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Review your subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Plan Name */}
            <div className="flex justify-between items-start pb-3 border-b">
              <div>
                <div className="font-semibold">{selectedProduct?.product?.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {selectedProduct?.product?.description}
                </div>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Base Monthly Fee</span>
                <span className="font-medium">{formatCurrency(baseMonthlyPrice)}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Per Participant Fee</span>
                <span className="font-medium">{formatCurrency(perEmployeePrice)}/participant</span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <span className="font-bold">Base Monthly Cost</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(baseMonthlyPrice)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                + {formatCurrency(perEmployeePrice)} per participant per month
              </div>
            </div>

          </CardContent>
        </Card>

        {/* What You'll Get */}
        <Card>
          <CardHeader>
            <CardTitle>What You'll Get</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <IconCheck className="h-5 w-5 text-green-600" />
                <span className="text-sm">Complete 401(k) plan administration</span>
              </div>
              <div className="flex items-center gap-3">
                <IconCheck className="h-5 w-5 text-green-600" />
                <span className="text-sm">Recordkeeping and compliance testing</span>
              </div>
              <div className="flex items-center gap-3">
                <IconCheck className="h-5 w-5 text-green-600" />
                <span className="text-sm">Participant portal and mobile app</span>
              </div>
              <div className="flex items-center gap-3">
                <IconCheck className="h-5 w-5 text-green-600" />
                <span className="text-sm">Investment management and fiduciary support</span>
              </div>
              <div className="flex items-center gap-3">
                <IconCheck className="h-5 w-5 text-green-600" />
                <span className="text-sm">Dedicated customer support team</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="border-muted">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <IconLock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium mb-1">Secure Payment Processing</div>
                <div className="text-xs text-muted-foreground">
                  All payment information is processed securely through Stripe. We never see or
                  store your credit card details. Your data is encrypted using bank-level security
                  (256-bit SSL).
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
            disabled={isCreatingSession}
            size="default"
            className="min-w-[140px] text-sm"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleProceedToPayment}
            disabled={isCreatingSession}
            loading={isCreatingSession}
            loadingText="Redirecting to Stripe..."
            size="default"
            className="min-w-[140px] text-sm"
          >
            <IconCreditCard className="h-4 w-4 mr-2" />
            Proceed to Payment
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          By proceeding, you agree to our Terms of Service and Privacy Policy. You can cancel your
          subscription at any time.
        </p>
      </div>
    </OnboardingLayout>
  );
}
