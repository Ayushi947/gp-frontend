'use client';

import { IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';

interface StepSuccessProps {
  amount: number;
  sourceCount: number;
  destinationCount: number;
  confirmationNumber: string;
  effectiveDate: Date;
  onViewActivity: () => void;
  onDone: () => void;
}

export function StepSuccess({
  amount,
  sourceCount,
  destinationCount,
  confirmationNumber,
  effectiveDate,
  onViewActivity,
  onDone,
}: StepSuccessProps) {
  return (
    <div className="flex flex-col items-center text-center pt-6 pb-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
        <IconCheck className="h-9 w-9" strokeWidth={2.5} />
      </div>

      <h2 className="mt-5 text-2xl font-bold tracking-tight">Transfer submitted</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
        We&apos;ve received your request to move {formatCurrency(amount)}. You&apos;ll get a
        confirmation email once it executes.
      </p>

      <div className="mt-6 w-full max-w-sm rounded-xl border bg-card divide-y">
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground">Confirmation</span>
          <span className="font-mono font-medium">{confirmationNumber}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-mono font-medium">{formatCurrency(amount)}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground">From / To</span>
          <span className="font-mono font-medium">
            {sourceCount} → {destinationCount} fund{destinationCount === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground">Effective</span>
          <span className="font-mono font-medium">
            {formatDate(effectiveDate, 'MMM d, yyyy')}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground">Cutoff</span>
          <span className="font-mono font-medium">4:00 PM ET</span>
        </div>
      </div>

      <div className="mt-6 flex w-full max-w-sm gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={onViewActivity}
        >
          View in activity
        </Button>
        <Button type="button" size="lg" className="flex-1" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}
