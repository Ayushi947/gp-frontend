'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { storage, sessionStore } from '@/lib/storage';
import { ROUTES } from '@/config/routes';

/**
 * Auth layout - redirects to dashboard if already authenticated
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only check once to prevent infinite loops
    if (hasChecked.current) return;
    hasChecked.current = true;

    // Check if user is already authenticated
    const isAuthenticated =
      storage.getString('isAuthenticated') ||
      sessionStore.getString('isAuthenticated') ||
      storage.getString('accessToken') ||
      sessionStore.getString('accessToken');

    if (isAuthenticated) {
      // Redirect to dashboard if already logged in
      router.replace(ROUTES.SPONSOR.DASHBOARD);
    }
  }, [router]);

  return <>{children}</>;
}
