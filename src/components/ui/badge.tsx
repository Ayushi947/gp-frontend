'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  // Base badge styled as pill chips similar to Figma
  'inline-flex items-center rounded-full border px-3 py-1 text-sm font-normal transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // Solid (filled) variants - used for filled chips
        default: 'border-transparent bg-[#32e512] text-white', // Complete/filled
        destructive: 'border-transparent bg-[#ef2f2f] text-white', // Failed/filled
        secondary: 'border-transparent bg-[#e8ae00] text-white', // Pending/filled

        // Outlined variants - white background with colored border/text
        outline: 'bg-white text-foreground',
        success: 'bg-white border-[#32e512] text-[#32e512]', // Complete/outlined
        warning: 'bg-white border-[#e8ae00] text-[#e8ae00]', // Pending/outlined
        error: 'bg-white border-[#ef2f2f] text-[#ef2f2f]', // Failed/outlined

        // Generic info style kept but harmonized
        info: 'bg-white border-info/20 text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

/**
 * Status badge for common statuses
 */
type StatusType = 'active' | 'pending' | 'inactive' | 'error' | 'completed' | 'processing';

const statusVariantMap: Record<StatusType, BadgeProps['variant']> = {
  active: 'success',
  completed: 'success',
  pending: 'warning',
  processing: 'warning',
  inactive: 'secondary',
  error: 'error',
};

const statusLabelMap: Record<StatusType, string> = {
  active: 'Active',
  completed: 'Completed',
  pending: 'Pending',
  processing: 'Processing',
  inactive: 'Inactive',
  error: 'Error',
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  label?: string;
}

function StatusBadge({ status, className, label }: StatusBadgeProps) {
  return (
    <Badge variant={statusVariantMap[status]} className={className}>
      {label ?? statusLabelMap[status]}
    </Badge>
  );
}

export { Badge, badgeVariants, StatusBadge, type StatusType };
