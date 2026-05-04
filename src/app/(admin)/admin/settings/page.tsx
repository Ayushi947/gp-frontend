'use client';

import { useRouter } from 'next/navigation';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  IconSettings,
  IconShield,
  IconBuildingBank,
  IconUsers,
  IconBell,
  IconMail,
  IconKey,
  IconChevronRight,
  IconLock,
  IconDatabase,
  IconCurrencyDollar,
  IconShieldCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useGetMfaStatus } from '@/api/generated/endpoints/superadmin-mfa/superadmin-mfa';
import { useGetConfigurations } from '@/api/generated/endpoints/platform-configuration/platform-configuration';
import type { GetConfigurationsParams } from '@/api/generated/models';
import { useGetAllTenants } from '@/api/generated/endpoints/tenant-management/tenant-management';
import { useGetAllLimits } from '@/api/generated/endpoints/irs-contribution-limits/irs-contribution-limits';

interface SettingCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'destructive';
}

export default function SettingsPage() {
  const router = useRouter();

  // Fetch real data from APIs
  const { data: mfaStatus, isLoading: mfaLoading } = useGetMfaStatus();
  const { data: configsData, isLoading: configsLoading } = useGetConfigurations(
    { pageable: { page: 0, size: 100 } } as GetConfigurationsParams
  );
  const { data: tenantsData, isLoading: tenantsLoading } = useGetAllTenants(
    { pageable: { page: 0, size: 1 } }
  );
  const { data: irsLimitsData, isLoading: irsLoading } = useGetAllLimits(
    { planYear: new Date().getFullYear(), activeOnly: true }
  );

  const isLoading = mfaLoading || configsLoading || tenantsLoading || irsLoading;

  // Calculate stats from real data
  const totalConfigs = (configsData as any)?.totalElements || 0;
  const mfaEnabled = (mfaStatus as any)?.mfaEnabled || false;
  const totalTenants = (tenantsData as any)?.totalElements || 0;
  const currentYearLimits = Array.isArray(irsLimitsData)
    ? irsLimitsData.filter((l: any) => l.year === new Date().getFullYear())
    : [];
  const hasCurrentYearLimits = currentYearLimits.length > 0;

  const settingsCategories: SettingCategory[] = [
    {
      id: 'mfa',
      title: 'Multi-Factor Authentication',
      description: 'Secure your account with two-factor authentication',
      icon: <IconShield className="h-6 w-6" />,
      href: '/admin/settings/mfa',
      badge: mfaEnabled ? 'Enabled' : 'Required for Impersonation',
      badgeVariant: mfaEnabled ? 'success' : 'warning',
    },
    {
      id: 'security',
      title: 'Security Settings',
      description: 'Password policies, session timeouts, and security rules',
      icon: <IconLock className="h-6 w-6" />,
      href: '/admin/settings/security',
    },
    {
      id: 'platform',
      title: 'Platform Configuration',
      description: 'System-wide settings, API limits, and platform defaults',
      icon: <IconDatabase className="h-6 w-6" />,
      href: '/admin/settings/platform',
    },
    {
      id: 'sponsor',
      title: 'Sponsor Configuration',
      description: 'Default plan settings, compliance rules, and sponsor options',
      icon: <IconBuildingBank className="h-6 w-6" />,
      href: '/admin/settings/sponsor',
    },
    {
      id: 'participant',
      title: 'Participant Configuration',
      description: 'Enrollment options, contribution limits, and participant defaults',
      icon: <IconUsers className="h-6 w-6" />,
      href: '/admin/settings/participant',
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      description: 'Email templates, notification preferences, and alerts',
      icon: <IconBell className="h-6 w-6" />,
      href: '/admin/settings/notifications',
    },
    {
      id: 'email',
      title: 'Email Configuration',
      description: 'AWS SES settings, email domains, and SMTP configuration',
      icon: <IconMail className="h-6 w-6" />,
      href: '/admin/settings/email',
    },
    {
      id: 'integrations',
      title: 'Integration Settings',
      description: 'Finch API, custodian, and third-party integrations',
      icon: <IconKey className="h-6 w-6" />,
      href: '/admin/settings/integrations',
    },
    {
      id: 'compliance',
      title: 'Compliance & Testing',
      description: 'ADP/ACP test settings, compliance rules, and reporting',
      icon: <IconShieldCheck className="h-6 w-6" />,
      href: '/admin/settings/compliance',
    },
    {
      id: 'irs-limits',
      title: 'IRS Contribution Limits',
      description: 'Annual IRS limits for 401(k) contributions (402g, 415c, catch-up)',
      icon: <IconCurrencyDollar className="h-6 w-6" />,
      href: '/admin/settings/irs-limits',
      badge: hasCurrentYearLimits ? `${new Date().getFullYear()} Set` : 'Needs Update',
      badgeVariant: hasCurrentYearLimits ? 'success' : 'destructive',
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <DashboardContent>
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div>
            <Skeleton className="h-7 w-32 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-5" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Categories Grid Skeleton */}
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage platform configuration, security, and preferences
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Configurations
              </CardTitle>
              <IconSettings className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalConfigs}</div>
              <p className="text-xs text-muted-foreground mt-1">Platform settings</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                MFA Status
              </CardTitle>
              <IconShield className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${mfaEnabled ? 'text-success' : 'text-warning'}`}>
                {mfaEnabled ? 'Enabled' : 'Disabled'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {mfaEnabled ? 'Account secured' : 'Enable for impersonation'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Tenants
              </CardTitle>
              <IconBuildingBank className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTenants}</div>
              <p className="text-xs text-muted-foreground mt-1">Sponsor organizations</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                IRS Limits
              </CardTitle>
              <IconCurrencyDollar className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${hasCurrentYearLimits ? 'text-success' : 'text-destructive'}`}>
                {hasCurrentYearLimits ? 'Current' : 'Outdated'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date().getFullYear()} contribution limits
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Settings Categories */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Configuration Categories</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {settingsCategories.map((category) => (
              <Card
                key={category.id}
                className="cursor-pointer hover:shadow-md transition-all group border-border hover:border-primary/30"
                onClick={() => router.push(category.href)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors shrink-0">
                        <div className="text-primary">{category.icon}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {category.title}
                        </CardTitle>
                        <CardDescription className="mt-1 text-sm">
                          {category.description}
                        </CardDescription>
                        {category.badge && (
                          <Badge
                            variant={category.badgeVariant === 'success' ? 'default' : 'secondary'}
                            className={`mt-3 ${
                              category.badgeVariant === 'success'
                                ? 'bg-success/10 text-success border-success/20'
                                : category.badgeVariant === 'warning'
                                ? 'bg-warning/10 text-warning border-warning/20'
                                : category.badgeVariant === 'destructive'
                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                : ''
                            }`}
                          >
                            {category.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <IconChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Important Notice */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <IconAlertTriangle className="h-5 w-5 text-primary" />
              Configuration Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Always enable MFA before using sensitive operations like impersonation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Review security settings regularly to maintain platform integrity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Update IRS limits annually before the new tax year begins</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Test notification and email settings before going live</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardContent>
  );
}
