'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconShieldCheck,
  IconLoader2,
} from '@tabler/icons-react';
import { toast } from '@/lib/toast';
import { useHandleCallback } from '@/api/generated/endpoints/finch-oauth-authentication/finch-oauth-authentication';

function FinchCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handleCallbackMutation = useHandleCallback();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const hasSentCallback = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        console.error('Finch OAuth error:', { error, errorDescription });
        setError(errorDescription || 'An error occurred during connection');
        setStatus('error');
        return;
      }

      if (code && !hasSentCallback.current) {
        hasSentCallback.current = true;
        try {
          console.log('=== Finch Callback ===');
          console.log('Processing OAuth code');

          // Backend automatically handles:
          // 1. Exchange code for token
          // 2. Update onboarding state to DASHBOARD
          // 3. Trigger FINCH_SYNC event (employee sync)
          // 4. Trigger BTC_ACCOUNT_SETUP event
          // 5. Trigger PRE_PAYROLL_BATCH event
          // 6. Trigger TRADE_INSTRUCTIONS event
          const response = await handleCallbackMutation.mutateAsync({
            data: { code },
          });

          console.log('Finch connection successful');
          console.log('Background tasks initiated: employee sync, BTC setup, pre-payroll batch');

          // Cast response to access properties
          const result = response as unknown as { message?: string; success?: boolean };

          setSuccessMessage(
            result?.message || 'Payroll provider connected successfully!'
          );
          setStatus('success');
        } catch (err) {
          console.error('Error processing Finch callback:', err);

          const apiError = err as {
            response?: { data?: { message?: string; error?: string } };
          };
          const errorMessage =
            apiError?.response?.data?.message ||
            apiError?.response?.data?.error ||
            'Failed to connect your payroll provider';

          setError(errorMessage);
          setStatus('error');
        }
      } else if (!code) {
        setError('No authorization code received from Finch');
        setStatus('error');
      }
    };

    processCallback();
  }, [searchParams, handleCallbackMutation]);

  const handleContinue = () => {
    // Navigate to success page
    router.push('/finch/success');
  };

  const handleTryAgain = () => {
    // Go back to finch-connect page
    router.push('/get-started/finch-connect');
  };

  // Loading state
  if (status === 'loading' || handleCallbackMutation.isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-2xl flex flex-col gap-8 p-8 md:p-12">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
                <IconLoader2 className="w-10 h-10 text-white animate-spin" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Connecting Your Payroll Provider
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Please wait while we establish a secure connection...
            </p>
          </div>

          <div className="flex justify-center">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <IconShieldCheck className="w-4 h-4" />
              <span>Securing your connection...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-2xl flex flex-col gap-8 p-8 md:p-12">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-md">
                <IconX className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Connection Failed
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto mb-6">{error}</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <IconAlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">
              Don&apos;t worry, you can try connecting again.
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleTryAgain}
              className="px-8 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-2xl flex flex-col gap-8 p-8 md:p-12">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-md">
                <IconCheck className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Connection Successful!
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto mb-6">
              {successMessage}
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <IconCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">
                Your payroll system is now connected
              </p>
            </div>
            <div className="text-xs text-green-600 ml-8">
              We&apos;re syncing employee data and setting up your custodian account in the background
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleContinue}
              className="px-8 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90"
            >
              Continue
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              You can now access your payroll data and manage your 401(k) plan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-2xl flex flex-col gap-8 p-8 md:p-12">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
              <IconLoader2 className="w-10 h-10 text-white animate-spin" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Loading...</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Please wait while we prepare your connection.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FinchCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FinchCallbackContent />
    </Suspense>
  );
}
