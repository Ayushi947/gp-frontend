'use client';

import { IconCheck } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import type { FundRowDto } from '@/api/generated/models';
import {
  colorForFund,
  resolveSourceRowDollars,
  type TransferRowState,
} from './transfer-utils';

interface FundSelectCardProps {
  fund: FundRowDto;
  selected: boolean;
  row: TransferRowState | undefined;
  onToggle: () => void;
  onPatch: (patch: Partial<TransferRowState>) => void;
  rowError?: string;
}

export function FundSelectCard({
  fund,
  selected,
  row,
  onToggle,
  onPatch,
  rowError,
}: FundSelectCardProps) {
  const balance = fund.marketValue ?? 0;
  const mode = row?.mode ?? 'amount';
  const value = row?.value ?? '';

  const resolvedAmt = row ? resolveSourceRowDollars(row, fund) : 0;
  const pct = balance > 0 ? Math.min(100, (resolvedAmt / balance) * 100) : 0;

  const handleQuick = (percent: number) => {
    const dollars = Math.round((balance * percent) / 100);
    onPatch({ mode: 'amount', value: dollars.toString() });
  };

  const handleMax = () => {
    onPatch({ mode: 'amount', value: balance.toFixed(2) });
  };

  const handleClear = () => {
    onPatch({ value: '' });
  };

  return (
    <div
      className={cn(
        'rounded-xl border bg-card transition-all',
        selected
          ? 'border-primary shadow-sm'
          : 'border-border hover:border-primary/40',
        rowError && 'border-destructive',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div
          className={cn(
            'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors',
            selected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/30',
          )}
        >
          {selected && <IconCheck className="h-3.5 w-3.5" />}
        </div>
        <div
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{ background: colorForFund(fund.fundId) }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate text-foreground">{fund.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {fund.fundId}
            {fund.ticker ? ` · ${fund.ticker}` : ''}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-semibold tabular-nums">{formatCurrency(balance)}</div>
          <div className="text-2xs uppercase tracking-wide text-muted-foreground">
            balance
          </div>
        </div>
      </button>

      {selected && (
        <div className="border-t px-4 py-3 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              {mode === 'amount' && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
              )}
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step={mode === 'percent' ? '1' : '0.01'}
                value={value}
                onChange={(e) => onPatch({ value: e.target.value })}
                placeholder={mode === 'amount' ? '0.00' : '0'}
                className={cn(
                  'h-10',
                  mode === 'amount' && 'pl-7',
                  mode === 'percent' && 'pr-8',
                )}
              />
              {mode === 'percent' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  %
                </span>
              )}
            </div>
            <div className="inline-flex h-10 rounded-full border overflow-hidden">
              <button
                type="button"
                onClick={() => onPatch({ mode: 'amount' })}
                className={cn(
                  'px-4 text-sm font-medium border-r transition-colors',
                  mode === 'amount'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted',
                )}
              >
                $
              </button>
              <button
                type="button"
                onClick={() => onPatch({ mode: 'percent' })}
                className={cn(
                  'px-4 text-sm font-medium transition-colors',
                  mode === 'percent'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted',
                )}
              >
                %
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleMax}>
              Use max
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleQuick(25)}>
              25%
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleQuick(50)}>
              50%
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
            >
              Clear
            </Button>
          </div>

          {resolvedAmt > 0 && (
            <div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Transferring {formatCurrency(resolvedAmt)}
                </span>
                <span className="font-mono text-muted-foreground">
                  {pct.toFixed(1)}% of holding
                </span>
              </div>
            </div>
          )}

          {rowError && <p className="text-xs text-destructive">{rowError}</p>}
        </div>
      )}
    </div>
  );
}
