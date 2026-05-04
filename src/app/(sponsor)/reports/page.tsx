'use client';

import { useRouter } from 'next/navigation';
import {
  IconFileText,
  IconFileAnalytics,
  IconUsers,
  IconCash,
  IconChartBar,
  IconClipboardList,
  IconPercentage,
  IconShieldCheck,
} from '@tabler/icons-react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardContent } from '@/components/layout/dashboard-layout';

/**
 * Page Header Component
 */
function PageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate and download plan reports for compliance and analysis
        </p>
      </div>
    </div>
  );
}

/**
 * Report Type Card
 */
function ReportTypeCard({
  title,
  description,
  icon: Icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: typeof IconFileText;
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Reports Page - Navigation Hub
 */
export default function ReportsPage() {
  const router = useRouter();

  return (
    <DashboardContent>
      <PageHeader />

      {/* Report Type Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ReportTypeCard
          title="Annual Reports"
          description="Form 5500, Summary Plan Description, and yearly compliance documents"
          icon={IconFileAnalytics}
          onClick={() => router.push('/reports/annual')}
        />
        <ReportTypeCard
          title="Participant Roster"
          description="Complete list of participants with enrollment status and deferral rates"
          icon={IconUsers}
          onClick={() => router.push('/reports/roster')}
        />
        <ReportTypeCard
          title="Balance Report"
          description="Detailed account balances by source with vesting information"
          icon={IconCash}
          onClick={() => router.push('/reports/balances')}
        />
        <ReportTypeCard
          title="Contributions Report"
          description="Track employee and employer contributions with IRS limit compliance"
          icon={IconChartBar}
          onClick={() => router.push('/reports/contributions')}
        />
        <ReportTypeCard
          title="Payroll Reports"
          description="Payroll processing history and DOL timely deposit tracking"
          icon={IconClipboardList}
          onClick={() => router.push('/reports/payroll')}
        />
        <ReportTypeCard
          title="Deferral Rates"
          description="Participant deferral rates for ADP/ACP compliance testing"
          icon={IconPercentage}
          onClick={() => router.push('/reports/deferral-rates')}
        />
        <ReportTypeCard
          title="Compliance Testing"
          description="IRS compliance test results for ADP, ACP, Top Heavy, and 410(b)"
          icon={IconShieldCheck}
          onClick={() => router.push('/reports/compliance')}
        />
        <ReportTypeCard
          title="Form 5500 Filing"
          description="Track annual Form 5500 filing status, deadlines, and requirements"
          icon={IconFileText}
          onClick={() => router.push('/reports/form-5500')}
        />
      </div>
    </DashboardContent>
  );
}
