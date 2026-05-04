'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { adminNavItems } from '@/components/layout/sidebar';
import { ROUTES } from '@/config/routes';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface UserInfo {
  id?: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get user info from storage and verify super admin role
  useEffect(() => {
    const checkAuth = () => {
      try {
        const isAuthenticated = sessionStorage.getItem('isAuthenticated') || localStorage.getItem('isAuthenticated');
        const userInfoStr = sessionStorage.getItem('userInfo') || localStorage.getItem('userInfo');

        if (!isAuthenticated || isAuthenticated !== 'true') {
          // Not authenticated, redirect to login
          router.push(ROUTES.AUTH.LOGIN);
          return;
        }

        if (userInfoStr) {
          const user = JSON.parse(userInfoStr) as UserInfo;
          const role = user.role?.toUpperCase();

          // Verify user has super admin role
          if (role !== 'SUPER_ADMIN' && role !== 'SUPERADMIN') {
            // Not a super admin, redirect to appropriate dashboard
            router.push(ROUTES.SPONSOR.DASHBOARD);
            return;
          }

          setUserInfo(user);
        }
      } catch (error) {
        console.error('Failed to parse userInfo:', error);
        router.push(ROUTES.AUTH.LOGIN);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Build user object for layout
  const user = userInfo ? {
    name: userInfo.name || `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 'Super Admin',
    email: userInfo.email || 'admin@glidingpath.com',
    role: 'Super Admin',
  } : {
    name: 'Super Admin',
    email: 'admin@glidingpath.com',
    role: 'Super Admin',
  };

  return (
    <DashboardLayout
      navItems={adminNavItems}
      user={user}
    >
      {children}
    </DashboardLayout>
  );
}
