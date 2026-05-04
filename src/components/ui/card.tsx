'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Base card
      'rounded-xl border bg-card text-card-foreground shadow-sm',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

type KpiCardProps = React.HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: React.ReactNode;
  description?: string;
};

const KpiCard = React.forwardRef<HTMLDivElement, KpiCardProps>(
  ({ label, value, description, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Shape & layout
          'flex flex-col items-start justify-center gap-3',
          'rounded-xl border px-5 py-6',
          // Border & background to match Figma KPI card
          'bg-white border-[#0e52e8] shadow-[0_0_8px_0_rgba(201,203,255,1)]',
          className
        )}
        {...props}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <p className="text-[14px] font-normal text-[#6c6d74]">
              {label}
            </p>
            <p className="text-[32px] font-medium leading-none text-[#4a4b50]">
              {value}
            </p>
          </div>
          {description ? (
            <p className="text-[14px] font-normal text-[#4a4b50]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    );
  }
);

KpiCard.displayName = 'KpiCard';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  KpiCard,
};
