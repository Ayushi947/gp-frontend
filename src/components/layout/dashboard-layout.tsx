'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Sidebar, type NavigationItem } from './sidebar';
import { Header } from './header';
import { ImpersonationBanner } from '@/components/impersonation-banner';
import { cn } from '@/lib/utils';
import { useHydrated } from '@/hooks/useHydrated';
import { ROUTES } from '@/config/routes';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavigationItem[];
  pageTitle?: string;
  pageSubtitle?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onMarkAllRead?: () => void;
}

/**
 * Main dashboard layout with sidebar and header
 */
export function DashboardLayout({
  children,
  navItems,
  pageTitle,
  pageSubtitle,
  user,
  notifications = [],
  onNotificationClick,
  onMarkAllRead,
}: DashboardLayoutProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isHydrated = useHydrated();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = useCallback(() => {
    // Clear all auth tokens and session data from both storages
    const authKeys = ['accessToken', 'tokenType', 'isAuthenticated', 'userInfo', 'auth_token'];
    authKeys.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    // Redirect to login
    router.push(ROUTES.AUTH.LOGIN);
  }, [router]);

  const handleToggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const handleSidebarCollapseChange = useCallback((isCollapsed: boolean) => {
    setIsSidebarCollapsed(isCollapsed);
  }, []);

  // Don't render theme-dependent content until hydrated
  const isDarkMode = isHydrated ? theme === 'dark' : false;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        navItems={navItems}
        user={user}
        onLogout={handleLogout}
        onToggleTheme={handleToggleTheme}
        isDarkMode={isDarkMode}
        onCollapseChange={handleSidebarCollapseChange}
      />

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300 pt-0 lg:pt-7',
          isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'
        )}
      >
        {/* Header */}
        <Header
          title={pageTitle}
          subtitle={pageSubtitle}
          user={user}
          notifications={notifications}
          onNotificationClick={onNotificationClick}
          onMarkAllRead={onMarkAllRead}
          onLogout={handleLogout}
        />

        {/* Impersonation Banner */}
        <ImpersonationBanner />

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

/**
 * Minimal layout for auth pages
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

/**
 * Onboarding layout with progress indicator
 */
export function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  stepTitle,
  onBack,
  canGoBack = true,
}: {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  stepTitle?: string;
  onBack?: () => void;
  canGoBack?: boolean;
}) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Header */}
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              {canGoBack && onBack && (
                <button
                  onClick={onBack}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back
                </button>
              )}
              {stepTitle && (
                <span className="text-sm font-medium">{stepTitle}</span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">{children}</main>
    </div>
  );
}

/**
 * Container for dashboard page content
 */
export function DashboardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {children}
    </div>
  );
}

/**
 * Grid layout for dashboard cards
 */
export function DashboardGrid({
  children,
  columns = 3,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}
