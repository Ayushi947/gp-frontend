'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconLoader2 } from '@tabler/icons-react';
import { storage, sessionStore } from '@/lib/storage';
import { ROUTES } from '@/config/routes';

/**
 * Root page - redirects based on authentication status
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check for auth token
    const token = storage.getString('auth_token') || sessionStore.getString('auth_token');

    if (token) {
      // User is authenticated, redirect to dashboard
      // In a real app, you'd decode the token to determine the user's role
      router.replace(ROUTES.SPONSOR.DASHBOARD);
    } else {
      // Not authenticated, redirect to login
      router.replace(ROUTES.AUTH.LOGIN);
    }
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
