'use client';

import { IconCheck } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface ProgressStepperProps {
  currentStep: number;
  totalSteps: number;
  /**
   * Optional milestone step (e.g. "Plan Design").
   * When provided, the progress bar is split into:
   * - Steps "to" the milestone
   * - Steps "after" the milestone, with the counter restarting from 1
   */
  milestoneStep?: number;
  /**
   * Optional labels rendered under each step dot.
   * Length must equal the visible phase total; ignored otherwise.
   */
  stepLabels?: string[];
  className?: string;
}

export function ProgressStepper({
  currentStep,
  totalSteps,
  milestoneStep,
  stepLabels,
  className,
}: ProgressStepperProps) {
  // Normalise into a single "phase" so we can render one stepper,
  // whether or not a milestone is configured.
  let phaseTotal = totalSteps;
  let phaseCurrent = Math.min(Math.max(currentStep, 1), totalSteps);
  let phaseLabel: string | null = null;

  const hasMilestone =
    typeof milestoneStep === 'number' &&
    milestoneStep > 0 &&
    milestoneStep < totalSteps;

  if (hasMilestone) {
    const isBeforeOrAtMilestone = currentStep <= (milestoneStep as number);

    phaseTotal = isBeforeOrAtMilestone
      ? (milestoneStep as number)
      : Math.max(totalSteps - (milestoneStep as number), 1);

    phaseCurrent = isBeforeOrAtMilestone
      ? Math.min(Math.max(currentStep, 1), phaseTotal)
      : Math.min(
          Math.max(currentStep - (milestoneStep as number), 1),
          phaseTotal,
        );

    phaseLabel = isBeforeOrAtMilestone ? 'Plan Setup' : 'Plan Launch';
  }

  // Avoid divide-by-zero for a single-step flow
  const progressFraction =
    phaseTotal > 1 ? (phaseCurrent - 1) / (phaseTotal - 1) : 0;

  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)}>
      <div className="text-xs text-muted-foreground">
        Step {phaseCurrent} of {phaseTotal}
        {phaseLabel ? ` · ${phaseLabel}` : ''}
      </div>

      <div className="relative w-full max-w-[604px] h-[30px]">
        {/* Background track */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[6px] rounded-full bg-[rgba(148,163,184,0.35)]" />

        {/* Active gradient track, matching Figma's GP primary gradient */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[6px] rounded-full bg-gradient-to-r from-[#2563eb] to-[#9333ea] transition-all duration-300"
          style={{ width: `${progressFraction * 100}%` }}
        />

        {/* Step dots */}
        <div className="relative flex h-full items-center justify-between px-1">
          {Array.from({ length: phaseTotal }, (_, index) => {
            const step = index + 1;
            const isCompleted = step < phaseCurrent;
            const isCurrent = step === phaseCurrent;
            const isActive = step <= phaseCurrent;

            return (
              <div
                key={step}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] bg-white shadow-sm transition-all duration-200',
                  isActive
                    ? 'border-[#7c3aed]'
                    : 'border-[rgba(148,163,184,0.7)]',
                )}
              >
                <div
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full transition-colors duration-200',
                    isActive ? 'bg-[#a855f7]' : 'bg-[rgba(148,163,184,0.25)]',
                  )}
                >
                  {(isCurrent || isCompleted) && (
                    <IconCheck
                      className={cn(
                        'h-3 w-3',
                        isActive ? 'text-white' : 'text-slate-500',
                      )}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {stepLabels && stepLabels.length === phaseTotal && (
        <div className="relative w-full max-w-[604px]">
          <div className="flex items-center justify-between px-1">
            {stepLabels.map((label, index) => {
              const step = index + 1;
              const isActive = step <= phaseCurrent;
              return (
                <div key={step} className="flex w-6 justify-center">
                  <span
                    className={cn(
                      'text-xs whitespace-nowrap',
                      isActive
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
