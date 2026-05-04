'use client';

import { IconCheck, IconChevronRight } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatCurrency } from '@/lib/utils';
import type { FundRowDto } from '@/api/generated/models';
import { TransferHero } from './transfer-hero';
import {
  colorForFund,
  computeDestinationPercentTotal,
  validateDestinations,
  type DestinationAllocation,
} from './transfer-utils';

interface StepToProps {
  allFunds: FundRowDto[];
  sourceTotal: number;
  sourceFundIds: Set<string>;
  destinations: DestinationAllocation[];
  onChange: (next: DestinationAllocation[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepTo({
  allFunds,
  sourceTotal,
  sourceFundIds,
  destinations,
  onChange,
  onBack,
  onNext,
}: StepToProps) {
  const eligibleFunds = allFunds.filter((f) => f.fundId && !sourceFundIds.has(f.fundId));
  const validation = validateDestinations({ destinations, sourceFundIds, allFunds });
  const totalPct = computeDestinationPercentTotal(destinations);
  const validated = Math.abs(totalPct - 100) < 0.01;
  const destCount = destinations.filter((d) => d.percent && parseFloat(d.percent) > 0).length;

  const findDest = (fundId: string) => destinations.find((d) => d.fundId === fundId);

  const toggleFund = (fundId: string) => {
    const existing = findDest(fundId);
    if (existing) {
      onChange(destinations.filter((d) => d.fundId !== fundId));
    } else {
      onChange([...destinations, { fundId, percent: '' }]);
    }
  };

  const patchPercent = (fundId: string, percent: string) => {
    onChange(destinations.map((d) => (d.fundId === fundId ? { ...d, percent } : d)));
  };

  const splitEqually = () => {
    const selected = destinations.filter((d) => d.fundId);
    if (selected.length === 0) return;
    const base = Math.floor(100 / selected.length);
    const remainder = 100 - base * selected.length;
    onChange(
      selected.map((d, idx) => ({
        ...d,
        percent: (base + (idx === 0 ? remainder : 0)).toString(),
      })),
    );
  };

  const matchCurrent = () => {
    const eligibleTotal = eligibleFunds.reduce((s, f) => s + (f.marketValue || 0), 0);
    if (eligibleTotal <= 0) {
      splitEqually();
      return;
    }
    const next: DestinationAllocation[] = [];
    let runningSum = 0;
    eligibleFunds.forEach((f, idx) => {
      const share = ((f.marketValue || 0) / eligibleTotal) * 100;
      const pct =
        idx === eligibleFunds.length - 1
          ? Number((100 - runningSum).toFixed(2))
          : Number(share.toFixed(2));
      runningSum += pct;
      if (pct > 0) {
        next.push({ fundId: f.fundId ?? '', percent: pct.toString() });
      }
    });
    onChange(next);
  };

  return (
    <div className="flex flex-col">
      <TransferHero
        label="Allocating"
        amount={sourceTotal}
        meta={{
          left: `${destCount} destination${destCount === 1 ? '' : 's'}`,
          right: `${totalPct.toFixed(0)} / 100%`,
        }}
        progress={{ value: totalPct, complete: validated }}
      />

      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={splitEqually}
          disabled={destinations.length === 0}
        >
          Split equally
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={matchCurrent}
        >
          Match current allocation
        </Button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold tracking-tight">Fund menu</h3>
        <span className="text-sm text-muted-foreground">
          {eligibleFunds.length} available
        </span>
      </div>

      <div className="space-y-2">
        {eligibleFunds.map((fund) => {
          const dest = findDest(fund.fundId ?? '');
          const selected = !!dest;
          const pct = parseFloat(dest?.percent ?? '');
          const dollars =
            selected && Number.isFinite(pct) && pct > 0
              ? (sourceTotal * pct) / 100
              : 0;
          const inPortfolio = (fund.marketValue ?? 0) > 0;
          const rowError = dest ? validation.rowErrors[dest.fundId] : undefined;

          return (
            <div
              key={fund.fundId}
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
                onClick={() => toggleFund(fund.fundId ?? '')}
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
                  <div className="text-sm font-medium truncate text-foreground">
                    {fund.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {fund.fundId}
                    {fund.ticker ? ` · ${fund.ticker}` : ''}
                    {inPortfolio ? ' · in portfolio' : ''}
                  </div>
                </div>
                {selected && dollars > 0 && (
                  <div className="text-sm font-semibold tabular-nums text-success">
                    +{formatCurrency(dollars)}
                  </div>
                )}
              </button>

              {selected && (
                <div className="border-t px-4 py-3 space-y-2">
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="100"
                      step="1"
                      value={dest?.percent ?? ''}
                      onChange={(e) => patchPercent(fund.fundId ?? '', e.target.value)}
                      placeholder="0"
                      className="h-10 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      %
                    </span>
                  </div>
                  {dollars > 0 && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{formatCurrency(dollars)}</span> of{' '}
                      {formatCurrency(sourceTotal)} into this fund
                    </p>
                  )}
                  {rowError && <p className="text-xs text-destructive">{rowError}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {validation.errors.length > 0 && validated === false && totalPct > 0 && (
        <ul className="mt-4 rounded-lg border border-destructive/60 bg-destructive/5 p-3 text-xs space-y-1 list-disc list-inside text-destructive">
          {validation.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      <div className="sticky bottom-0 mt-6 -mx-4 sm:mx-0 border-t bg-background/95 px-4 py-4 backdrop-blur sm:rounded-xl sm:border sm:px-5">
        <p className="mb-3 text-sm text-muted-foreground">
          {validated ? (
            <span className="inline-flex items-center gap-1.5 text-success">
              <IconCheck className="h-4 w-4" />
              Allocation complete · ready to review
            </span>
          ) : (
            <>
              Remaining:{' '}
              <span className="font-semibold text-foreground tabular-nums">
                {(100 - totalPct).toFixed(0)}%
              </span>
            </>
          )}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onBack}
          >
            Back
          </Button>
          <Button
            type="button"
            size="lg"
            className="flex-1"
            onClick={onNext}
            disabled={!validated}
          >
            Review transfer
            <IconChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
