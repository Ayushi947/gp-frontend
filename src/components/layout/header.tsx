'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatDate, formatEnum } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onMarkAllRead?: () => void;
  onLogout?: () => void;
  className?: string;
}

/**
 * Application header with notifications and user menu
 */
export function Header({
  title,
  subtitle,
  user,
  notifications = [],
  onNotificationClick,
  onMarkAllRead,
  className,
}: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Prevent hydration mismatch by only rendering dropdowns after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const displayTitle = title || user?.name || '';
  const roleLabel = user?.role ? formatEnum(user.role) : subtitle;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between gap-4 bg-background px-4 py-4 lg:px-6',
        className
      )}
    >
      {/* Left: Title + role label */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        {displayTitle && (
          <h1 className="text-2xl font-bold tracking-tight truncate">{displayTitle}</h1>
        )}
        {roleLabel && (
          <p className="text-sm font-medium text-[color:var(--sidebar-active-text,#5257e5)] truncate">
            {roleLabel}
          </p>
        )}
      </div>

      {/* Right: Notification pill (Figma style) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notifications */}
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-12 w-12 rounded-xl bg-white shadow-[0_4px_16px_rgba(0,153,112,0.08)]"
              >
                <Image
                  src="/assets/images/notification.svg"
                  alt="Notifications"
                  width={24}
                  height={24}
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#F23985]" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && onMarkAllRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs"
                  onClick={onMarkAllRead}
                >
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 10).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      'flex flex-col items-start gap-1 p-3 cursor-pointer',
                      !notification.read && 'bg-muted/50'
                    )}
                    onClick={() => onNotificationClick?.(notification)}
                  >
                    <div className="flex items-start justify-between w-full gap-2">
                      <span className="font-medium text-sm">{notification.title}</span>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(notification.createdAt)}
                    </span>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
            {notifications.length > 10 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/notifications" className="justify-center text-sm">
                    View all notifications
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        ) : null}

      </div>
    </header>
  );
}

/**
 * Page header with breadcrumbs and actions
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
