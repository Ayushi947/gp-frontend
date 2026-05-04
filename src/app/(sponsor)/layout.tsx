'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { sponsorNavItems } from '@/components/layout/sidebar';
import { useGetDashboard } from '@/api/generated/endpoints/plan-sponsor-dashboard/plan-sponsor-dashboard';

interface SponsorLayoutProps {
  children: React.ReactNode;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  companyName?: string;
  tenantId?: string;
}

export default function SponsorLayout({ children }: SponsorLayoutProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  
  // Get user info from storage (set during login)
  useEffect(() => {
    const getUserInfo = () => {
      try {
        const userInfoStr = sessionStorage.getItem('userInfo') || localStorage.getItem('userInfo');
        if (userInfoStr) {
          const user = JSON.parse(userInfoStr) as UserInfo;
          setUserInfo(user);
        }
      } catch (error) {
        console.error('Failed to parse userInfo:', error);
      }
    };
    
    getUserInfo();
  }, []);

  // Get dashboard data to extract sponsor info
  const { data: dashboardData } = useGetDashboard();

  // User info - prioritize logged-in user's name from storage
  // Fallback to dashboard sponsorName if userInfo not available
  const user = userInfo ? {
    name: userInfo.name || `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 'User',
    email: userInfo.email || '',
    role: userInfo.role,
  } : dashboardData ? {
    name: dashboardData.sponsorName ?? 'Plan Sponsor',
    email: '',
  } : undefined;

  return (
    <DashboardLayout
      navItems={sponsorNavItems}
      user={user}
    >
      {children}
    </DashboardLayout>
  );
}
