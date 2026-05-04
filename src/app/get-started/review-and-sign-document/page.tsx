'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IconFileText, IconPencil, IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { SignaturePad, SignatureData } from '@/components/ui/signature-pad';
import { useCreatePlanSignature } from '@/api/generated/endpoints/trustee-signature-management/trustee-signature-management';
import { useGetDocuments } from '@/api/generated/endpoints/document-management/document-management';
import { useQuery } from '@tanstack/react-query';
import { customInstance } from '@/api/client';
import type { PlanSignatureResponseDTO } from '@/api/generated/models';

export default function ReviewAndSignDocumentPage() {
  const router = useRouter();
  const hasNavigatedRef = useRef(false);

  const [checked, setChecked] = useState([false, false]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const [hasNotifiedAdmin, setHasNotifiedAdmin] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isAlreadySigned, setIsAlreadySigned] = useState(false);
  const [existingSignature, setExistingSignature] = useState<PlanSignatureResponseDTO | null>(null);

  // Use API hooks
  const { mutateAsync: signPlan, isPending } = useCreatePlanSignature();
  const {
    data: documentsResponse,
    isLoading: isLoadingDocuments,
    error: documentsError,
  } = useGetDocuments();

  // Check if signature already exists
  const {
    data: existingSignatureData,
    isLoading: isLoadingSignature,
  } = useQuery({
    queryKey: ['planSignature'],
    queryFn: async () => {
      try {
        const response = await customInstance<PlanSignatureResponseDTO>({
          url: '/trustee/signature',
          method: 'GET',
        });
        return response;
      } catch (error: any) {
        // 404 means no signature exists yet, which is fine
        if (error?.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
  });

  // Check if signature already exists
  useEffect(() => {
    if (existingSignatureData) {
      setIsAlreadySigned(true);
      setExistingSignature(existingSignatureData);
      // Pre-fill form with existing signature data
      setFirstName(existingSignatureData.firstName || '');
      setLastName(existingSignatureData.lastName || '');
      setChecked([
        existingSignatureData.isDocumentsRead || false,
        existingSignatureData.isChangesUnderstood || false,
      ]);
    } else if (!isLoadingSignature && existingSignatureData === null) {
      setIsAlreadySigned(false);
    }
  }, [existingSignatureData, isLoadingSignature]);

  // Check if previous step was completed
  // Note: For deep links from email, we allow access if documents are available
  // even if authorizationData is missing (user may have cleared sessionStorage)
  useEffect(() => {
    // Wait for documents to load before checking authorization
    // If documents are available, user has completed onboarding and can proceed
    if (isLoadingDocuments) {
      return; // Wait for documents to load
    }

    const hasDocuments = documentsResponse?.documents && documentsResponse.documents.length > 0;
    const authorizationData = sessionStorage.getItem('authorizationData');
    
    // If documents are available, user has completed all steps including checkout and authorization
    // Allow them to proceed even if sessionStorage was cleared (deep link scenario)
    if (hasDocuments && !authorizationData) {
      // Create a minimal authorizationData to satisfy the flow
      sessionStorage.setItem('authorizationData', JSON.stringify({
        checks: [true, true, true],
        timestamp: new Date().toISOString(),
        fromDeepLink: true
      }));
    } else if (!hasDocuments && !authorizationData) {
      // No documents and no authorization - redirect to authorization step
      toast.warning('Missing information', 'Please complete authorization first.');
      router.push(ROUTES.GET_STARTED.AUTHORIZE_PROVIDER);
      return;
    }

    // Load saved data if exists
    const savedData = sessionStorage.getItem('signatureData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFirstName(parsed.firstName || '');
        setLastName(parsed.lastName || '');
        setChecked(parsed.checked || [false, false]);
      } catch (error) {
        console.error('Failed to parse saved signature data', error);
      }
    }
  }, [router, isLoadingDocuments, documentsResponse]);

  // Document verification check - redirect to dashboard if documents not ready
  useEffect(() => {
    // Prevent multiple redirects
    if (isRedirecting) return;

    // Handle both error case and empty documents case
    const hasDocuments = documentsResponse?.documents && documentsResponse.documents.length > 0;
    const shouldRedirect =
      !isLoadingDocuments &&
      (documentsError || !hasDocuments);

    if (shouldRedirect) {
      if (!hasNotifiedAdmin) {
        // Mark as redirecting immediately to prevent re-entry
        setIsRedirecting(true);

        // Set a flag to show documents pending message in modal
        sessionStorage.setItem('documentsStatus', 'pending');
        const message = documentsError
          ? 'Unable to load documents at this time. Please try again later.'
          : 'Your plan documents are being generated. You will be notified when they are ready for review and signature.';
        sessionStorage.setItem('documentsStatusMessage', message);

        toast.info(
          'Documents Being Prepared',
          'Redirecting to dashboard. We will notify you when documents are ready.'
        );

        setHasNotifiedAdmin(true);

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push(ROUTES.SPONSOR.DASHBOARD);
        }, 2000);
      }
    } else if (hasDocuments) {
      // Documents are available, clear the pending flag
      sessionStorage.removeItem('documentsStatus');
      sessionStorage.removeItem('documentsStatusMessage');
      setIsRedirecting(false);
    }
  }, [isLoadingDocuments, documentsResponse, documentsError, hasNotifiedAdmin, router, isRedirecting]);

  const handleViewDocument = (url: string) => {
    window.open(url, '_blank');
  };

  const handleSignPlan = async () => {
    // Prevent multiple submissions
    if (isPending || hasNavigatedRef.current) {
      return;
    }

    // Validation
    if (!checked[0] || !checked[1]) {
      toast.error('Confirmation required', 'Please accept both confirmations to continue');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Name required', 'Please enter your first name and last name');
      return;
    }

    if (!signatureData || signatureData.isEmpty) {
      toast.error('Signature required', 'Please provide your signature');
      return;
    }

    if (!documentsResponse?.documents || documentsResponse.documents.length === 0) {
      toast.error('Documents unavailable', 'Please wait for documents to be prepared');
      return;
    }

    try {
      await signPlan({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          signatureText: `${firstName.trim()} ${lastName.trim()}`,
          signatureImage: signatureData.dataUrl,
          isDocumentsRead: checked[0],
          isChangesUnderstood: checked[1],
        },
      });

      // Save signature data
      const saveData = {
        firstName,
        lastName,
        checked,
        timestamp: new Date().toISOString(),
      };
      sessionStorage.setItem('signatureData', JSON.stringify(saveData));

      toast.success('Success', 'Plan signed successfully');

      // Prevent multiple navigations
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        router.push(ROUTES.GET_STARTED.BANK_ACCOUNT);
      }
    } catch (error: any) {
      console.error('Error signing plan:', error);
      
      // Handle already signed error with professional message
      const errorMessage = error?.response?.data?.message || error?.message || '';
      if (errorMessage.includes('already been signed') || error?.response?.status === 400) {
        toast.info(
          'Documents Already Signed',
          'Your plan documents have already been signed. You cannot sign the documents again. If you need to make changes, please contact our support team for assistance.'
        );
        setIsAlreadySigned(true);
        // Refresh signature data
        if (existingSignatureData) {
          setExistingSignature(existingSignatureData);
        }
      } else {
        toast.error('Sign failed', 'Failed to sign plan. Please try again.');
      }
      hasNavigatedRef.current = false;
    }
  };

  const handleBack = () => {
    router.push(ROUTES.GET_STARTED.AUTHORIZE_PROVIDER);
  };

  const documents = documentsResponse?.documents || [];
  const canSign =
    checked[0] &&
    checked[1] &&
    firstName.trim() &&
    lastName.trim() &&
    signatureData &&
    !signatureData.isEmpty &&
    documents.length > 0;

  return (
    <OnboardingLayout
      title="Review and Sign Documents"
      description="Review your plan documents and provide your electronic signature"
      currentStep={16}
      totalSteps={19}
      milestoneStep={9}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Documents Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconFileText className="h-5 w-5" />
              Plan Documents
            </CardTitle>
            <CardDescription>
              Your Basic Plan Document contains details for your 401(k) plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDocuments ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-100">
                <span className="text-sm text-gray-600">Loading documents...</span>
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((document, index) => {
                  // Use fileName from API, fallback to extracting from fileKey if not available
                  const fileName = document.fileName || 
                    (document.fileKey ? document.fileKey.split('/').pop() : null) || 
                    'Document';

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900 flex-1">{fileName}</span>
                      <Button
                        onClick={() => handleViewDocument(document.downloadUrl || '')}
                        size="sm"
                        variant="outline"
                      >
                        View
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
                <IconFileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm text-blue-700">
                  You will receive a notification when documents are ready for signature.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Already Signed Message */}
        {isAlreadySigned && existingSignature && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <IconCheck className="h-5 w-5" />
                Documents Already Signed
              </CardTitle>
              <CardDescription className="text-green-600">
                Your plan documents have been successfully signed and are on file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-white border border-green-200">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">
                    Signed by: <span className="font-semibold">{existingSignature.firstName} {existingSignature.lastName}</span>
                  </p>
                  {existingSignature.signatureTimestamp && (
                    <p className="text-sm text-gray-600">
                      Signed on: {new Date(existingSignature.signatureTimestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your plan documents have already been signed and cannot be signed again. 
                  If you need to make changes to your plan or have any questions, please contact our support team at{' '}
                  <a href="mailto:support@glidingpath.co" className="underline font-medium">support@glidingpath.co</a>.
                </p>
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={() => router.push(ROUTES.SPONSOR.DASHBOARD)}
                  className="min-w-[200px]"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signature Card - Only show if not already signed */}
        {!isAlreadySigned && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconPencil className="h-5 w-5" />
                Sign Your Plan
              </CardTitle>
            <CardDescription>
              By signing below, you are adopting the Plan as set forth in the Adoption Agreement
              and executing the GlidingPath Service Agreement.
              <br />
              <br />
              Once signed, the plan will be legally established. You will need to sign an amendment
              to the plan if you choose to change or terminate your plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Confirmations */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 transition-colors">
                <input
                  type="checkbox"
                  id="checkbox-0"
                  checked={checked[0] ?? false}
                  onChange={() => setChecked((c) => [!(c[0] ?? false), c[1] ?? false])}
                  className="h-4 w-4 rounded border-gray-300 mt-0.5"
                />
                <Label
                  htmlFor="checkbox-0"
                  className="text-sm text-gray-700 leading-relaxed cursor-pointer flex-1"
                >
                  I confirm that I have read all the documents above
                </Label>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 transition-colors">
                <input
                  type="checkbox"
                  id="checkbox-1"
                  checked={checked[1] ?? false}
                  onChange={() => setChecked((c) => [c[0] ?? false, !(c[1] ?? false)])}
                  className="h-4 w-4 rounded border-gray-300 mt-0.5"
                />
                <Label
                  htmlFor="checkbox-1"
                  className="text-sm text-gray-700 leading-relaxed cursor-pointer flex-1"
                >
                  I understand that any changes to my plan after signing could delay the start of
                  my plan and first employee contributions.
                </Label>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  type="text"
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  type="text"
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Signature Canvas */}
            <SignaturePad
              onSignatureChange={setSignatureData}
              height={180}
              label="Your Signature"
              showTypedSignature={true}
              typedName={firstName && lastName ? `${firstName} ${lastName}` : ''}
              disabled={isPending}
            />

            {/* Progress Indicator */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Completion:{' '}
                  {
                    [
                      checked[0],
                      checked[1],
                      !!firstName.trim(),
                      !!lastName.trim(),
                      signatureData && !signatureData.isEmpty,
                    ].filter(Boolean).length
                  }{' '}
                  of 5 requirements
                </span>
                <span
                  className={`font-medium flex items-center gap-1 ${
                    canSign ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {canSign && <IconCheck className="h-4 w-4" />}
                  {canSign ? 'Ready to Sign' : 'Incomplete'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Agreement Text */}
        <div className="text-xs text-gray-500 text-center px-4">
          By using GlidingPath, you agree to the{' '}
          <a href="/privacy" className="underline text-blue-600 hover:text-blue-700">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="/disclosure" className="underline text-blue-600 hover:text-blue-700">
            408(b)(2) Disclosure Brochure
          </a>
          .
        </div>

        {/* Navigation Buttons - Only show if not already signed */}
        {!isAlreadySigned && (
          <div className="flex justify-center gap-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isPending}
              size="default"
              className="min-w-[140px] text-sm"
            >
              Back
            </Button>
            <Button
              onClick={handleSignPlan}
              disabled={!canSign || isPending || isLoadingSignature}
              size="default"
              className="min-w-[140px] text-sm"
            >
              {isPending ? 'Signing...' : 'Sign Plan'}
            </Button>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
}
