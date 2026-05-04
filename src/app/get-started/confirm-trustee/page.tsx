'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IconUserCheck, IconInfoCircle } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormSelect } from '@/components/ui/FormSelect';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { useCreateTrusteeConfirmation } from '@/api/generated/endpoints/trustee-signature-management/trustee-signature-management';

function ConfirmTrusteePage() {
  const router = useRouter();
  const hasNavigatedRef = useRef(false);

  const [isTrustee, setIsTrustee] = useState('');
  const [trusteeDetails, setTrusteeDetails] = useState({
    title: '',
    legalName: '',
    emailId: '',
  });
  const [companyName, setCompanyName] = useState('');

  // Use the mutation hook for creating trustee confirmation
  const createTrusteeConfirmationMutation = useCreateTrusteeConfirmation();

  // Check if previous step was completed
  useEffect(() => {
    setCompanyName(sessionStorage.getItem('companyName') || '');
    const planStartDate = sessionStorage.getItem('planStartDate');
    if (!planStartDate) {
      toast.warning('Missing information', 'Please complete plan start date first.');
      router.push(ROUTES.GET_STARTED.CONFIRM_PLAN_START_DATE);
      return;
    }

    // Load saved data if exists
    const savedData = sessionStorage.getItem('trusteeData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setIsTrustee(parsed.isTrustee || '');
        if (parsed.trusteeDetails) {
          setTrusteeDetails(parsed.trusteeDetails);
        }
      } catch (error) {
        console.error('Failed to parse saved trustee data', error);
      }
    }
  }, [router]);

  const handleSaveAndContinue = async () => {
    // Prevent multiple submissions
    if (createTrusteeConfirmationMutation.isPending || hasNavigatedRef.current) {
      return;
    }

    // Validation
    if (!isTrustee) {
      toast.error('Selection required', 'Please select whether your company will serve as trustee');
      return;
    }

    if (isTrustee === 'Yes') {
      if (!trusteeDetails.title || !trusteeDetails.legalName || !trusteeDetails.emailId) {
        toast.error('Incomplete information', 'Please fill in all trustee details');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trusteeDetails.emailId)) {
        toast.error('Invalid email', 'Please enter a valid email address');
        return;
      }
    }

    try {
      const payload = {
        isTrustee: isTrustee === 'Yes',
        isAgree: true,
        isAuthorize: true,
        trusteeTitle: isTrustee === 'Yes' ? trusteeDetails.title : '',
        trusteeLegalName: isTrustee === 'Yes' ? trusteeDetails.legalName : '',
        trusteeEmail: isTrustee === 'Yes' ? trusteeDetails.emailId : '',
      };

      const response = await createTrusteeConfirmationMutation.mutateAsync({data: payload});

      // Save confirmation ID and data to storage
      if (response && response.id) {
        localStorage.setItem('trusteeConfirmationId', response.id);
      }
      sessionStorage.setItem(
          'trusteeData',
          JSON.stringify({
            isTrustee,
            trusteeDetails,
          })
      );


      toast.success('Success', 'Trustee confirmation saved successfully');

      // Prevent multiple navigations
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        router.push(ROUTES.GET_STARTED.AUTHORIZE_PROVIDER);
      }
    } catch (error) {
      console.error('Error confirming trustee:', error);
      toast.error('Save failed', 'Failed to save trustee confirmation. Please try again.');
      hasNavigatedRef.current = false;
    }
  };

  const handleBack = () => {
    router.push(ROUTES.GET_STARTED.CONFIRM_PLAN_START_DATE);
  };

  const formattedCompanyName = companyName
      ? companyName.endsWith('s')
          ? `${companyName}'`
          : `${companyName}'s`
      : '';
  return (
      <OnboardingLayout
          title="Confirm Trustee"
          description="Designate your plan trustee"
          currentStep={14}
          totalSteps={19}
          milestoneStep={9}
          maxWidth="4xl"
      >
        <div className="space-y-6">
          {/* Trustee Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Who is the Plan Trustee?
              </CardTitle>
              <CardDescription>
                A Plan Trustee is the individual responsible for overseeing the 401(k) plan’s assets. This is typically
                a company owner, CFO, or other fiduciary authorized to manage the plan’s financial responsibilities. The
                trustee is a U.S. person with either a SSN or ITIN.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Info Banner */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
                <IconInfoCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"/>
                <div className="text-sm text-blue-700">
                  If you choose not to serve as trustee, GlidingPath will arrange for a professional
                  trustee to be appointed for your plan.
                </div>
              </div>

              {/* Question */}
              <div>
                <FormSelect
                    label={`Would you like to appoint an individual other than the custodian as the Trustee for ${formattedCompanyName} Plan?`}
                    options={[
                      {value: 'Yes', label: 'Yes'},
                      {value: 'No', label: 'No'},
                    ]}
                    value={isTrustee}
                    onValueChange={setIsTrustee}
                    placeholder="Select an option"
                    required
                />
              </div>

              {/* Trustee Details Form - Conditional */}
              {isTrustee === 'Yes' && (
                  <div className="space-y-6 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700">
                      Please enter the details for the individual you wish to appoint as the Trustee.
                    </div>

                    {/* Title and Legal Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="trusteeTitle" className="text-sm font-medium text-gray-700">
                          Title
                        </Label>
                        <Input
                            id="trusteeTitle"
                            type="text"
                            placeholder="e.g., CEO, Owner, President"
                            value={trusteeDetails.title}
                            onChange={(e) =>
                                setTrusteeDetails((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                            }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="trusteeLegalName" className="text-sm font-medium text-gray-700">
                          Legal Name
                        </Label>
                        <Input
                            id="trusteeLegalName"
                            type="text"
                            placeholder="Full legal name"
                            value={trusteeDetails.legalName}
                            onChange={(e) =>
                                setTrusteeDetails((prev) => ({
                                  ...prev,
                                  legalName: e.target.value,
                                }))
                            }
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="trusteeEmail" className="text-sm font-medium text-gray-700">
                        Email Address
                      </Label>
                      <Input
                          id="trusteeEmail"
                          type="email"
                          placeholder="trustee@company.com"
                          value={trusteeDetails.emailId}
                          onChange={(e) =>
                              setTrusteeDetails((prev) => ({
                                ...prev,
                                emailId: e.target.value,
                              }))
                          }
                      />
                    </div>
                  </div>
              )}

              {/* Appointed Trustee Info */}
              {isTrustee === 'No' && (
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                    <p className="text-sm text-purple-700">
                      A professional trustee will be appointed for your plan. You will receive details
                      about the trustee assignment after completing your plan setup.
                    </p>
                  </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-6">
            <Button
                variant="outline"
                onClick={handleBack}
                disabled={createTrusteeConfirmationMutation.isPending}
                size="default"
                className="min-w-[140px] text-sm"
            >
              Back
            </Button>
            <Button
                onClick={handleSaveAndContinue}
                disabled={createTrusteeConfirmationMutation.isPending || !isTrustee}
                size="default"
                className="min-w-[140px] text-sm"
            >
              {createTrusteeConfirmationMutation.isPending ? 'Saving...' : 'Save and Continue'}
            </Button>
          </div>
        </div>
      </OnboardingLayout>
  );
}

export default ConfirmTrusteePage
