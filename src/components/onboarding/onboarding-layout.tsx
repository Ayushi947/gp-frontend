'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressStepper } from './progress-stepper';
import { cn } from '@/lib/utils';

interface OnboardingLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  currentStep?: number;
  totalSteps?: number;
  /** Optional milestone step (e.g. Plan Design) for phase-based progress display */
  milestoneStep?: number;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl' | '10xl';
  showLogo?: boolean;
  className?: string;
  /** Optional extra classes for the title text (e.g. to change color on specific pages) */
  titleClassName?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  '8xl': 'max-w-8xl',
  '9xl': 'max-w-9xl',
  '10xl': 'max-w-10xl',
};

export function OnboardingLayout({
  children,
  title,
  description,
  currentStep,
  totalSteps,
  milestoneStep,
  maxWidth = 'md',
  showLogo = true,
  className,
  titleClassName,
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center onboarding-bg p-4">
      <div className={cn('w-full', maxWidthClasses[maxWidth], className)}>
        {/* Logo */}
        {showLogo && (
          <div className="flex items-center justify-center gap-3 mb-6">
            <Image
              src="/assets/images/Final Logo.svg"
              alt="GlidingPath Logo"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className="text-2xl font-bold">GlidingPath</span>
          </div>
        )}

        {/* Progress Stepper */}
        {currentStep !== undefined && totalSteps !== undefined && (
          <ProgressStepper
            currentStep={currentStep}
            totalSteps={totalSteps}
            milestoneStep={milestoneStep}
            className="mb-6"
          />
        )}

        {/* Main Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className={cn('text-2xl text-[#2563EB]', titleClassName)}>{title}</CardTitle>
            {description && (
              <CardDescription className="text-base">{description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
