'use client';

import { useState } from 'react';
import {
  IconAlertCircle,
  IconArrowDown,
  IconCheck,
  IconChevronDown,
  IconLoader2,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { FundRowDto, RebalancingTrade } from '@/api/generated/models';
import { TransferHero } from './transfer-hero';
import {
  colorForFund,
  resolveSourceRowDollars,
  type DestinationAllocation,
  type TransferRowState,
} from './transfer-utils';

interface StepReviewProps {
  allFunds: FundRowDto[];
  sources: TransferRowState[];
  destinations: DestinationAllocation[];
  sourceTotal: number;
  effectiveDate: Date;
  previewTrades: RebalancingTrade[] | null;
  onPreviewTrades: () => void;
  onConfirm: () => void;
  onBack: () => void;
  isPreviewing: boolean;
  isSubmitting: boolean;
}

export function StepReview({
  allFunds,
  sources,
  destinations,
  sourceTotal,
  effectiveDate,
  previewTrades,
  onPreviewTrades,
  onConfirm,
  onBack,
  isPreviewing,
  isSubmitting,
}: StepReviewProps) {
  const [showTrades, setShowTrades] = useState(false);

  const fundsById = new Map(allFunds.map((f) => [f.fundId ?? '', f]));

  const sourceRows = sources
    .filter((r) => r.fundId && r.value)
    .map((r) => ({
      fund: fundsById.get(r.fundId),
      amount: resolveSourceRowDollars(r, fundsById.get(r.fundId)),
    }))
    .filter((r) => r.amount > 0);

  const destRows = destinations
    .filter((d) => d.fundId && d.percent)
    .map((d) => {
      const pct = parseFloat(d.percent) || 0;
      return {
        fund: fundsById.get(d.fundId),
        percent: pct,
        amount: (sourceTotal * pct) / 100,
      };
    })
    .filter((r) => r.amount > 0);

  const handleTogglePreview = () => {
    if (!showTrades && !previewTrades) {
      onPreviewTrades();
    }
    setShowTrades((s) => !s);
  };

  const visibleTrades = (previewTrades ?? []).filter(
    (t) => t.requiresTrade !== false && Math.abs(t.valueToTrade || 0) > 0.005,
  );

  return (
    <div className="flex flex-col">
      <TransferHero
        label="You are transferring"
        amount={sourceTotal}
        meta={{
          left: `${sourceRows.length} source${sourceRows.length === 1 ? '' : 's'} → ${destRows.length} destination${destRows.length === 1 ? '' : 's'}`,
          right: `Effective ${formatDate(effectiveDate, 'MMM d')}`,
        }}
      />

      <div className="space-y-3">
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b bg-error/[0.06]">
            <span className="text-xs font-semibold uppercase tracking-wide text-error">
              Out of
            </span>
            <span className="text-sm font-semibold text-error tabular-nums">
              {formatCurrency(sourceTotal)} total
            </span>
          </div>
          {sourceRows.map((r, i) => (
            <div
              key={`${r.fund?.fundId}-${i}`}
              className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
            >
              <div
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ background: colorForFund(r.fund?.fundId) }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-foreground">
                  {r.fund?.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.fund?.fundId} · balance was {formatCurrency(r.fund?.marketValue ?? 0)}
                </div>
              </div>
              <div className="text-sm font-semibold text-error tabular-nums">
                −{formatCurrency(r.amount)}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <IconArrowDown className="h-3 w-3" />
            Transfer
          </div>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b bg-success/[0.06]">
            <span className="text-xs font-semibold uppercase tracking-wide text-success">
              Into
            </span>
            <span className="text-sm font-semibold text-success tabular-nums">
              {formatCurrency(sourceTotal)} total
            </span>
          </div>
          {destRows.map((r, i) => (
            <div
              key={`${r.fund?.fundId}-${i}`}
              className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
            >
              <div
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ background: colorForFund(r.fund?.fundId) }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-foreground">
                  {r.fund?.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.fund?.fundId} · {r.percent.toFixed(0)}% of transfer
                </div>
              </div>
              <div className="text-sm font-semibold text-success tabular-nums">
                +{formatCurrency(r.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border bg-muted/30 p-3">
        <button
          type="button"
          onClick={handleTogglePreview}
          className="flex w-full items-center justify-between text-sm font-medium"
        >
          <span>See trade breakdown</span>
          <IconChevronDown
            className={cn('h-4 w-4 transition-transform', showTrades && 'rotate-180')}
          />
        </button>
        {showTrades && (
          <div className="mt-3 border-t pt-3">
            {isPreviewing ? (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating trades...
              </div>
            ) : visibleTrades.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                {previewTrades ? 'No trades required.' : 'Trades will appear here.'}
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {visibleTrades.map((trade, idx) => {
                  const fund = allFunds.find((f) => f.fundId === trade.fundId);
                  const isBuy =
                    (trade.tradeType || '').toUpperCase().includes('BUY') ||
                    (trade.tradeType || '').toUpperCase().includes('IN');
                  return (
                    <div
                      key={`${trade.fundId}-${idx}`}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={cn(
                            'inline-flex px-1.5 py-0.5 rounded text-2xs font-semibold',
                            isBuy ? 'bg-success/10 text-success' : 'bg-error/10 text-error',
                          )}
                        >
                          {trade.tradeType || (isBuy ? 'BUY' : 'SELL')}
                        </span>
                        <span className="truncate">{fund?.name || trade.fundId}</span>
                      </div>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(Math.abs(trade.valueToTrade || 0))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="flex gap-2">
          <IconAlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
          <div className="text-sm">
            <p className="font-medium">Market cutoff is 4:00 PM ET</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Requests submitted today execute at today&apos;s closing NAV. Requests after
              4 PM execute the next business day.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 px-1 text-xs leading-relaxed text-muted-foreground">
        By tapping Confirm, you authorize this exchange. You can cancel only before the
        cutoff on the effective date.
      </p>

      <div className="sticky bottom-0 mt-6 -mx-4 sm:mx-0 border-t bg-background/95 px-4 py-4 backdrop-blur sm:rounded-xl sm:border sm:px-5">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            type="button"
            size="lg"
            className="flex-1"
            onClick={onConfirm}
            disabled={isSubmitting}
            loading={isSubmitting}
            loadingText="Submitting..."
          >
            Confirm transfer
            <IconCheck className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
