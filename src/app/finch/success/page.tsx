'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconCheck, IconArrowRight, IconLoader2 } from '@tabler/icons-react';
import { ROUTES } from '@/config/routes';

export default function FinchSuccessPage() {
  const router = useRouter();

  const handleGoToDashboard = () => {
    router.push(ROUTES.SPONSOR.DASHBOARD);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Success Card */}
        <Card className="border-green-200 bg-white shadow-lg">
          <CardContent className="pt-12 pb-12">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <IconCheck className="w-12 h-12 text-white" strokeWidth={3} />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Payroll Provider Connected Successfully!
              </h1>
              <p className="text-lg text-gray-600">
                Your 401(k) plan setup is complete
              </p>
            </div>

            {/* Info Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                <strong>Great news!</strong> Your payroll provider is now connected.
                We&apos;ve synced your employee data and are finalizing your plan setup
                with our custodian.
              </p>
            </div>

            {/* Processing Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex items-center gap-3">
                <IconLoader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Background Processing in Progress
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    We&apos;re completing employee sync and setting up your custodian
                    account. This process typically completes within 1-2 business days.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleGoToDashboard}
                className="px-8 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
              >
                Go to Dashboard
                <IconArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Next Steps */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Employee data is synced from your payroll system</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    Custodian account setup is in progress (1-2 business days)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Pre-payroll batch processing initiated</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-4 h-4 mt-0.5 flex-shrink-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                  <span>You&apos;ll receive a notification when setup is complete</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>
            Need help? Contact our support team at{' '}
            <a
              href="mailto:support@glidingpath.com"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              support@glidingpath.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
