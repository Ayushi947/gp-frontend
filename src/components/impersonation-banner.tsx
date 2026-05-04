'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconShield, IconLogout } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { useGetStatus, useEndImpersonation } from '@/api/generated/endpoints/impersonation/impersonation';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';

// Type for impersonation status response
interface ImpersonationStatus {
  isImpersonating: boolean;
  session?: {
    id?: string;
    impersonatedUserEmail?: string;
    tenantId?: string;
    superAdminEmail?: string;
    superAdminRole?: string;
    reason?: string;
    startedAt?: string;
    expiresAt?: string;
    isActive?: boolean;
    remainingSeconds?: number;
  };
}

/**
 * Banner component that displays when superadmin is impersonating a user
 * Shows at the top of all pages with an "End Impersonation" button
 */
export function ImpersonationBanner() {
  const router = useRouter();
  const [isEnding, setIsEnding] = useState(false);

  // Fetch current impersonation status
  const { data: status, refetch: refetchStatus } = useGetStatus({
    query: {
      retry: false,
      staleTime: 10000, // Refresh every 10 seconds
      refetchInterval: 10000, // Auto-refresh to check if session ended
    },
  });

  const endMutation = useEndImpersonation();

  // Safely cast status to ImpersonationStatus
  const impersonationStatus = status as unknown as ImpersonationStatus | undefined;
  const isImpersonating = impersonationStatus?.isImpersonating ?? false;
  const session = impersonationStatus?.session;

  const handleEndImpersonation = async () => {
    if (!session?.id) {
      toast.error('Error', 'No active session found');
      return;
    }

    setIsEnding(true);
    try {
      await endMutation.mutateAsync({
        data: {
          sessionId: String(session.id),
          reason: 'Ended by super admin from dashboard',
        },
      });

      toast.success('Session ended', 'Impersonation session ended successfully');
      refetchStatus();

      // Redirect to admin dashboard
      router.push(ROUTES.ADMIN.DASHBOARD || '/admin');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to end impersonation';
      toast.error('End session failed', errorMessage);
    } finally {
      setIsEnding(false);
    }
  };

  // Don't render if not impersonating
  if (!isImpersonating) {
    return null;
  }

  return (
    <div className="sticky top-16 z-20 border-b border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 px-4 py-3">
      <div className="flex items-center justify-between gap-4 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <IconShield className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
          <div className="flex items-center gap-2 flex-1 min-w-0 text-sm">
            <span className="font-medium text-yellow-900 dark:text-yellow-100">Impersonating:</span>
            <span className="text-yellow-800 dark:text-yellow-200 truncate">
              {session?.impersonatedUserEmail || 'Unknown user'}
            </span>
            {session?.tenantId && (
              <>
                <span className="text-yellow-700 dark:text-yellow-300">•</span>
                <span className="text-yellow-700 dark:text-yellow-300 text-xs font-mono truncate">
                  Tenant: {session.tenantId}
                </span>
              </>
            )}
          </div>
        </div>
        <Button
          onClick={handleEndImpersonation}
          disabled={isEnding}
          loading={isEnding}
          variant="destructive"
          size="sm"
          className="shrink-0"
        >
          <IconLogout className="mr-2 h-4 w-4" />
          End Impersonation
        </Button>
      </div>
    </div>
  );
}
