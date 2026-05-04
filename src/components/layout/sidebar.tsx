'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  IconLayoutDashboard,
  IconUsers,
  IconCash,
  IconChartBar,
  IconFileAnalytics,
  IconSettings,
  IconShieldCheck,
  IconBuildingBank,
  IconWallet,
  IconChevronLeft,
  IconChevronRight,
  IconMenu2,
  IconX,
  IconLogout,
  IconUser,
  IconMoon,
  IconSun,
  IconChecklist,
  IconLifebuoy,
  IconBook,
  IconReceipt,
  IconArrowsExchange,
  IconCreditCardPay,
  IconFileText,
  IconBriefcase,
  IconShield,
  IconChartPie,
  IconCode,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/routes';

export interface NavItem {
  label: string;
  href: string;
  icon: typeof IconLayoutDashboard;
  badge?: string | number;
  children?: NavItem[];
  separator?: boolean; // Add separator after this item
}

export interface NavSeparator {
  type: 'separator';
}

export type NavigationItem = NavItem | NavSeparator;

interface SidebarProps {
  navItems: NavigationItem[];
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  logo?: React.ReactNode;
  onLogout?: () => void;
  onToggleTheme?: () => void;
  isDarkMode?: boolean;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

/**
 * Collapsible sidebar navigation
 */
export function Sidebar({
  navItems,
  user,
  logo,
  onLogout,
  onToggleTheme,
  isDarkMode,
  onCollapseChange,
}: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapseChange?.(newCollapsedState);
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <IconX className="h-5 w-5" />
        ) : (
          <IconMenu2 className="h-5 w-5" />
        )}
      </Button>

      <aside
        className={cn(
          // Mobile: full-height drawer from very top/left
          // Desktop (lg+): offset from viewport edges using Tailwind spacing
           'fixed top-0 left-0 z-40 h-full border-r bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] transition-all duration-300 lg:top-6 lg:left-5 lg:bottom-6 lg:h-auto lg:rounded-2xl shadow-[0_16px_44px_rgba(0,0,0,0.07)]',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div
            className={cn(
              'flex h-16 items-center px-4',
              isCollapsed && 'justify-center px-2'
            )}
          >
            {logo || (
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src={
                    isCollapsed
                      ? '/assets/images/sidebar_collapse_logo.svg'
                      : '/assets/images/Final Logo.svg'
                  }
                  alt="GlidingPath Logo"
                  width={40}
                  height={40}
                  className={cn(
                    'shrink-0',
                    isCollapsed ? 'w-8 h-8' : 'w-10 h-10'
                  )}
                />
                {!isCollapsed && (
                  <span className="text-lg font-semibold text-foreground">
                    GlidingPath
                  </span>
                )}
              </Link>
            )}
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            <ul className="sidebar-nav-list">
              {navItems.map((item, index) => {
                // Handle separator
                if ('type' in item && item.type === 'separator') {
                  return (
                    <li key={`separator-${index}`} className="py-2">
                      <div className="border-t sidebar-divider" />
                    </li>
                  );
                }

                // Handle nav item
                const navItem = item as NavItem;

                if (isCollapsed) {
                  return (
                    <li key={navItem.href} className="flex justify-center">
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={navItem.href}
                              className={cn(
                              'flex items-center justify-center h-11 w-11 rounded-full text-sm font-medium transition-colors',
                                isActive(navItem.href)
                                  ? 'bg-[color:var(--sidebar-active-bg)] text-[color:var(--sidebar-active-text)]'
                                  : 'text-[color:var(--sidebar-muted-text)] hover:bg-muted hover:text-foreground'
                              )}
                              onClick={() => setIsMobileOpen(false)}
                            >
                              <navItem.icon className="h-5 w-5 shrink-0" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="flex items-center gap-2">
                            {navItem.label}
                            {navItem.badge !== undefined && (
                              <Badge variant="secondary">{navItem.badge}</Badge>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </li>
                  );
                }

                return (
                  <li key={navItem.href}>
                    <Link
                      href={navItem.href}
                      className={cn(
                        'sidebar-nav-item gap-3',
                        isActive(navItem.href) && 'sidebar-nav-item-active'
                      )}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <navItem.icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{navItem.label}</span>
                      {navItem.badge !== undefined && (
                        <Badge
                          variant={isActive(navItem.href) ? 'secondary' : 'default'}
                          className="h-5 min-w-5 px-1.5"
                        >
                          {navItem.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t">
            {/* Theme toggle temporarily disabled per UI requirements.
                To re-enable, restore the previous onToggleTheme block. */}
            {/* {onToggleTheme && (
              <div className="p-2">
                {isCollapsed ? (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-full"
                          onClick={onToggleTheme}
                        >
                          {isDarkMode ? (
                            <IconSun className="h-5 w-5" />
                          ) : (
                            <IconMoon className="h-5 w-5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={onToggleTheme}
                  >
                    {isDarkMode ? (
                      <IconSun className="h-5 w-5" />
                    ) : (
                      <IconMoon className="h-5 w-5" />
                    )}
                    <span className="ml-3">
                      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </Button>
                )}
              </div>
            )} */}

            {/* User Info, Dropdown & Logout */}
            {user && (
              <div className="border-t p-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'flex w-full items-center rounded-lg bg-muted/50 p-2.5 mb-2',
                        isCollapsed ? 'justify-center p-2' : 'justify-between'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        {!isCollapsed && (
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-semibold truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        )}
                      </div>
                      {!isCollapsed && onLogout && (
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <IconLogout className="h-4 w-4 text-muted-foreground" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="left">Sign Out</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <IconUser className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <IconSettings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {onLogout && (
                      <DropdownMenuItem
                        onClick={onLogout}
                        className="text-error focus:text-error"
                      >
                        <IconLogout className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm hidden lg:flex"
            onClick={handleToggleCollapse}
          >
            {isCollapsed ? (
              <Image
                src="/assets/images/chevron-left.svg"
                alt="Collapse sidebar"
                width={16}
                height={16}
                className="h-4 w-4"
              />
            ) : (
              <Image
                src="/assets/images/chevron-left.svg"
                alt="Expand sidebar"
                width={16}
                height={16}
                className="h-4 w-4 rotate-180"
              />
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}

/**
 * Sponsor navigation items
 */
export const sponsorNavItems: NavigationItem[] = [
  // Main sections
  { label: 'Dashboard', href: '/dashboard', icon: IconLayoutDashboard },
  { label: 'Participants', href: '/participants', icon: IconUsers },
  { label: 'Contributions', href: '/contributions', icon: IconCash },
  { label: 'Payrolls', href: '/payrolls', icon: IconReceipt },
  { label: 'Reports', href: '/reports', icon: IconFileAnalytics },

  // Separator
  { type: 'separator' },

  // Secondary sections
  { label: 'Task & Activity', href: '/tasks', icon: IconChecklist },
  { label: 'Settings', href: '/settings', icon: IconSettings },
  { label: 'Support', href: '/support', icon: IconLifebuoy },
  { label: 'Resources', href: '/resources', icon: IconBook },
];

/**
 * Participant navigation items
 */
export const participantNavItems: NavigationItem[] = [
  // Main sections
  { label: 'Dashboard', href: '/participant/dashboard', icon: IconLayoutDashboard },
  { label: 'Portfolio', href: '/participant/portfolio', icon: IconWallet },
  { label: 'Contributions', href: '/participant/contributions', icon: IconCash },
  { label: 'Transfers', href: '/participant/transfers', icon: IconArrowsExchange },
  { label: 'Withdrawals', href: '/participant/withdrawals', icon: IconCreditCardPay },
  { label: 'Statements & Docs', href: '/participant/statements', icon: IconFileText },

  // Separator
  { type: 'separator' },

  // Secondary sections
  { label: 'Task & Activity', href: '/participant/tasks', icon: IconChecklist },
  { label: 'Settings', href: '/participant/settings', icon: IconSettings },
  { label: 'Support', href: '/participant/support', icon: IconLifebuoy },
  { label: 'Resources', href: '/participant/resources', icon: IconBook },
];

/**
 * Admin navigation items
 */
export const adminNavItems: NavigationItem[] = [
  // Main sections
  { label: 'Dashboard', href: '/admin/dashboard', icon: IconLayoutDashboard },
  { label: 'Tenants', href: '/admin/tenants', icon: IconBuildingBank },
  { label: 'Users', href: '/admin/users', icon: IconUsers },
  { label: 'Impersonation', href: '/admin/impersonation', icon: IconUser },

  // Separator
  { type: 'separator' },

  // Operations
  { label: 'Documents', href: '/admin/documents', icon: IconFileText },
  { label: 'Portfolios', href: '/admin/portfolios', icon: IconChartPie },
  { label: 'Funds', href: '/admin/funds', icon: IconWallet },
  { label: 'Service Providers', href: '/admin/service-providers', icon: IconBriefcase },
  { label: 'Expenses', href: '/admin/expenses', icon: IconReceipt },

  // Separator
  { type: 'separator' },

  // System & Configuration
  { label: 'Rules Engine', href: '/admin/rules', icon: IconCode },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: IconShield },
  { label: 'System Health', href: '/admin/health', icon: IconFileAnalytics },
  { label: 'Settings', href: '/admin/settings', icon: IconSettings },

  // Separator
  { type: 'separator' },

  // Support
  { label: 'Support Tickets', href: '/admin/support', icon: IconLifebuoy },
];
