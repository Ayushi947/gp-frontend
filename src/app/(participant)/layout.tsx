'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { participantNavItems } from '@/components/layout/sidebar';
import { useGetParticipantPersonalDetails } from '@/api/generated/endpoints/participants/participants';

interface ParticipantLayoutProps {
  children: React.ReactNode;
}

export default function ParticipantLayout({ children }: ParticipantLayoutProps) {
  // Get participant personal details for user info
  const { data: personalDetails } = useGetParticipantPersonalDetails();

  // User info from personal details
  // Include role so the header can display "Participant" like Sponsor/Super Admin
  const user = personalDetails
    ? {
        name: personalDetails.fullName ?? 'Participant',
        email: personalDetails.emailAddress ?? '',
        role: 'Participant',
      }
    : undefined;

  return (
    <DashboardLayout
      navItems={participantNavItems}
      user={user}
    >
      {children}
    </DashboardLayout>
  );
}
