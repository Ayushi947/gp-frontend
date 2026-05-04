'use client';

import { IconChevronRight } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { FundRowDto } from '@/api/generated/models';
import { TransferHero } from './transfer-hero';
import { FundSelectCard } from './fund-select-card';
import {
  computeSourceTotal,
  createEmptyRow,
  validateSources,
  type TransferRowState,
} from './transfer-utils';

interface StepFromProps {
  fundsWithHoldings: FundRowDto[];
  totalBalance: number;
  sources: TransferRowState[];
  onChange: (next: TransferRowState[]) => void;
  onNext: () => void;
}

export function StepFrom({
  fundsWithHoldings,
  totalBalance,
  sources,
  onChange,
  onNext,
}: StepFromProps) {
  const validation = validateSources({ sources, allFunds: fundsWithHoldings });
  const total = computeSourceTotal(sources, fundsWithHoldings);
  const selectedCount = sources.filter((r) => r.fundId).length;

  const findRow = (fundId: string) => sources.find((r) => r.fundId === fundId);

  const toggleFund = (fundId: string) => {
    const existing = sources.find((r) => r.fundId === fundId);
    if (existing) {
      onChange(sources.filter((r) => r.fundId !== fundId));
    } else {
      const empty = sources.find((r) => !r.fundId);
      if (empty) {
        onChange(sources.map((r) => (r === empty ? { ...r, fundId } : r)));
      } else {
        onChange([...sources, { ...createEmptyRow(), fundId }]);
      }
    }
  };

  const patchRow = (fundId: string, patch: Partial<TransferRowState>) => {
    onChange(sources.map((r) => (r.fundId === fundId ? { ...r, ...patch } : r)));
  };

  const canAdvance = total > 0 && validation.ok;

  return (
    <div className="flex flex-col">
      <TransferHero
        label="From · total transferring"
        amount={total}
        meta={{
          left: `${selectedCount} of ${fundsWithHoldings.length} fund${fundsWithHoldings.length === 1 ? '' : 's'} selected`,
          right: `Available ${formatCurrency(totalBalance)}`,
        }}
      />

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold tracking-tight">Your holdings</h3>
        <span className="text-sm text-muted-foreground">
          {fundsWithHoldings.length} funds · {formatCurrency(totalBalance)}
        </span>
      </div>

      {fundsWithHoldings.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            You don&apos;t have any holdings to transfer from yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {fundsWithHoldings.map((fund) => {
            const row = findRow(fund.fundId ?? '');
            return (
              <FundSelectCard
                key={fund.fundId}
                fund={fund}
                selected={!!row}
                row={row}
                onToggle={() => toggleFund(fund.fundId ?? '')}
                onPatch={(patch) => patchRow(fund.fundId ?? '', patch)}
                rowError={row ? validation.rowErrors[row.rowId] : undefined}
              />
            );
          })}
        </div>
      )}

      <div className="sticky bottom-0 mt-6 -mx-4 sm:mx-0 border-t bg-background/95 px-4 py-4 backdrop-blur sm:rounded-xl sm:border sm:px-5">
        {total > 0 && (
          <p className="mb-3 text-sm text-muted-foreground">
            Ready to move{' '}
            <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
          </p>
        )}
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={onNext}
          disabled={!canAdvance}
        >
          Next · Choose destinations
          <IconChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
